import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Camera, Search, ArrowLeft, CloudUpload, Save, CheckCircle, Video, Smartphone,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";

export default function PhotographingStation() {
  const [, setLocation] = useLocation();
  const [imei, setImei] = useState("");
  const [inspectionData, setInspectionData] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadProgressTimer = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentOrderNumber = localStorage.getItem("currentOrderNumber");

  const { data: currentOrder } = useQuery({
    queryKey: ["/api/orders", currentOrderNumber],
    queryFn: async () => {
      if (!currentOrderNumber) return null;
      const r = await apiRequest("GET", `/api/orders/${currentOrderNumber}`);
      return r.json();
    },
    enabled: !!currentOrderNumber,
  });

  const { data: orderInspections = [], refetch: refetchInspections } = useQuery<any[]>({
    queryKey: ["/api/orders", currentOrder?.id, "inspections"],
    queryFn: async () => {
      if (!currentOrder?.id) return [];
      const r = await apiRequest("GET", `/api/orders/${currentOrder.id}/inspections`);
      return r.json();
    },
    enabled: !!currentOrder?.id,
  });

  const completedCount = orderInspections.filter((i: any) => i.status === "completed").length;
  const progressPct = currentOrder?.expectedQuantity
    ? Math.round((completedCount / currentOrder.expectedQuantity) * 100)
    : 0;

  const loadInspection = useMutation({
    mutationFn: async (imeiNumber: string) => {
      if (!currentOrder?.id) throw new Error("No order selected");
      const r = await apiRequest("GET", `/api/inspections/imei/${imeiNumber}/order/${currentOrder.id}`);
      return r.json();
    },
    onSuccess: (data) => {
      setInspectionData(data);
      toast({ title: "Loaded", description: `${data.phoneSpecs?.brand || ""} ${data.phoneSpecs?.model || ""}`.trim() });
    },
    onError: () => toast({ title: "Not Found", description: "No inspection for this IMEI. Scan it first.", variant: "destructive" }),
  });

  const uploadImages = useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const r = await apiRequest("POST", `/api/inspections/${inspectionData.id}/images`, fd, {
        headers: { "x-demo-image-count": String(files.length) },
      });
      return r.json();
    },
    onSuccess: async (result) => {
      if (uploadProgressTimer.current) window.clearInterval(uploadProgressTimer.current);
      setUploadProgress(100);
      toast({ title: "Uploaded", description: `${result.imageUrls?.length ?? 0} images saved.` });
      setSelectedFiles([]);
      setCapturedImages([]);
      setUploading(false);
      await refetchInspections();
      const refreshed = await apiRequest("GET", `/api/inspections/imei/${inspectionData.imei}/order/${currentOrder.id}`);
      setInspectionData(await refreshed.json());
    },
    onError: (e: any) => {
      if (uploadProgressTimer.current) window.clearInterval(uploadProgressTimer.current);
      toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
      setUploading(false);
    },
  });

  const completeInspection = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", `/api/inspections/${inspectionData.id}/status`, { status: "completed" });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Completed" });
      refetchInspections();
      queryClient.invalidateQueries({ queryKey: ["/api/orders", currentOrder?.id, "inspections"] });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  useEffect(() => () => {
    if (uploadProgressTimer.current) window.clearInterval(uploadProgressTimer.current);
    stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  useEffect(() => {
    if (showCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const handleLoadByImei = () => {
    if (!/^\d{15}$/.test(imei)) {
      toast({ title: "Invalid IMEI", description: "Enter a 15-digit IMEI.", variant: "destructive" });
      return;
    }
    loadInspection.mutate(imei);
  };

  const handlePickFromList = (insp: any) => {
    setImei(insp.imei);
    setInspectionData(insp);
  };

  const handleUploadImages = () => {
    if (!inspectionData || selectedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    uploadProgressTimer.current = window.setInterval(() => {
      setUploadProgress((p) => (p >= 90 ? 90 : p + Math.random() * 15));
    }, 200);
    uploadImages.mutate(selectedFiles);
  };

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      setStream(ms);
      setShowCamera(true);
    } catch {
      toast({ title: "Camera Error", description: "Camera access was denied or unavailable.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setShowCamera(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    setCapturedImages((p) => [...p, c.toDataURL("image/jpeg", 0.8)]);
    c.toBlob((b) => {
      if (b) {
        setSelectedFiles((p) => [...p, new File([b], `captured-${Date.now()}.jpg`, { type: "image/jpeg" })]);
      }
    }, "image/jpeg", 0.8);
  };

  const resetForm = () => {
    setImei("");
    setInspectionData(null);
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploading(false);
    setCapturedImages([]);
    stopCamera();
  };

  const gradeColor = (g: string) => {
    if (["A+", "A"].includes(g)) return "bg-emerald-50 text-emerald-700";
    if (["B+", "B"].includes(g)) return "bg-amber-50 text-amber-700";
    if (g === "C") return "bg-orange-50 text-orange-700";
    return "bg-gray-50 text-gray-600";
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-emerald-50 text-emerald-700";
    if (s === "photographed") return "bg-blue-50 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="container mx-auto px-6 py-6 max-w-5xl animate-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-brand-red text-white p-2 rounded-lg">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Photographing Station</h2>
            {currentOrder && <p className="text-xs text-gray-500 font-mono">Order {currentOrder.orderNumber}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-medium tabular-nums">{completedCount}/{currentOrder?.expectedQuantity || 0}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-500 h-8 text-xs" onClick={() => setLocation("/station-selection")}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Switch
          </Button>
        </div>
      </div>

      {!currentOrderNumber && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-xs text-amber-700">
          No order selected. Go to the Dashboard and pick an order first.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-brand-red" />
              Scanned Items
            </h3>

            <div className="flex gap-2 mb-3">
              <Input value={imei} onChange={(e) => setImei(e.target.value.replace(/\D/g, ""))} placeholder="Enter IMEI" maxLength={15} className="font-mono text-xs h-8" />
              <Button onClick={handleLoadByImei} className="bg-brand-red hover:bg-brand-dark-red shrink-0 h-8 px-2.5" size="sm" disabled={loadInspection.isPending}>
                <Search className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
              {orderInspections.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No items yet.</p>
              ) : (
                orderInspections.map((insp: any) => {
                  const specs = insp.phoneSpecs || {};
                  const isActive = inspectionData?.id === insp.id;
                  return (
                    <div
                      key={insp.id}
                      onClick={() => handlePickFromList(insp)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                        isActive ? "border-brand-red bg-red-50/50 shadow-sm" : "border-transparent bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-mono text-[10px] text-gray-400">{insp.imei}</span>
                        <Badge className={`text-[9px] py-0 ${statusColor(insp.status)}`}>{insp.status}</Badge>
                      </div>
                      <p className="font-medium text-gray-800">{specs.brand || "?"} {specs.model || ""}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {insp.grade && <Badge className={`text-[9px] py-0 ${gradeColor(insp.grade)}`}>{insp.grade}</Badge>}
                        {specs.storage && <span className="text-[10px] text-gray-400">{specs.storage}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {inspectionData ? (
            <Card className="border-0 shadow-sm bg-blue-50/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">
                    {inspectionData.phoneSpecs?.brand} {inspectionData.phoneSpecs?.model}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-gray-500 text-[10px]">IMEI</p><p className="font-mono text-[11px]">{inspectionData.imei}</p></div>
                  <div><p className="text-gray-500 text-[10px]">Storage</p><p className="font-medium">{inspectionData.phoneSpecs?.storage || "—"}</p></div>
                  <div><p className="text-gray-500 text-[10px]">Grade</p><Badge className={`text-[10px] mt-0.5 ${gradeColor(inspectionData.grade || "")}`}>{inspectionData.grade || "—"}</Badge></div>
                  <div>
                    <p className="text-gray-500 text-[10px]">Defects</p>
                    <p className={`text-[11px] font-medium ${inspectionData.defects?.length ? "text-red-600" : "text-emerald-600"}`}>
                      {inspectionData.defects?.length ? inspectionData.defects.join(", ") : "None"}
                    </p>
                  </div>
                </div>
                {inspectionData.notes && (
                  <p className="mt-2 text-[11px] text-gray-600 bg-white/60 rounded p-2 border border-blue-100">
                    {inspectionData.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-gray-200 shadow-none bg-gray-50/50">
              <CardContent className="py-10 text-center">
                <Search className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Select an item from the list to begin</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-brand-red" /> Image Capture
              </h3>

              <div className="flex flex-wrap gap-2 mb-4">
                {!showCamera ? (
                  <Button onClick={startCamera} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-8">
                    <Video className="w-3.5 h-3.5 mr-1.5" /> Start Camera
                  </Button>
                ) : (
                  <>
                    <Button onClick={captureImage} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8">
                      <Camera className="w-3.5 h-3.5 mr-1.5" /> Capture
                    </Button>
                    <Button onClick={stopCamera} variant="destructive" size="sm" className="text-xs h-8">Stop</Button>
                    {capturedImages.length > 0 && (
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => { setCapturedImages([]); setSelectedFiles((p) => p.filter((f) => !f.name.startsWith("captured-"))); }}>
                        Clear
                      </Button>
                    )}
                  </>
                )}
              </div>

              {showCamera && (
                <div className="border rounded-lg overflow-hidden mb-4">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover bg-black" />
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />

              {capturedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {capturedImages.map((url, i) => (
                    <img key={i} src={url} alt={`Captured ${i + 1}`} className="w-full h-20 object-cover rounded border" />
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center mb-4">
                <CloudUpload className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                <p className="text-[10px] text-gray-400 mb-2">Or upload from files</p>
                <input type="file" multiple accept="image/*" onChange={(e) => setSelectedFiles((p) => [...p, ...Array.from(e.target.files || [])])} className="hidden" id="img-upload" />
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => document.getElementById("img-upload")?.click()}>
                  Browse Files
                </Button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="bg-gray-50 rounded p-2.5 mb-4">
                  <p className="text-[10px] font-medium text-gray-600 mb-1">{selectedFiles.length} file(s) queued</p>
                  <div className="space-y-0.5 max-h-20 overflow-y-auto">
                    {selectedFiles.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="text-[10px] text-gray-500 flex justify-between">
                        <span className="truncate">{f.name}</span>
                        <span className="shrink-0 ml-2">{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Uploading...</span><span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-brand-red h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => inspectionData && completeInspection.mutate()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1 text-xs h-9"
                  disabled={completeInspection.isPending || !inspectionData || !(inspectionData.images?.length > 0)}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  {completeInspection.isPending ? "Completing..." : "Complete"}
                </Button>
                <Button
                  onClick={handleUploadImages}
                  className="bg-brand-red hover:bg-brand-dark-red text-white flex-1 text-xs h-9"
                  disabled={uploadImages.isPending || selectedFiles.length === 0 || !inspectionData}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {uploadImages.isPending ? "Uploading..." : "Save Photos"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
