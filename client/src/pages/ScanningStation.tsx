import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { QrCode, Smartphone, AlertTriangle, Save, RotateCcw, ArrowLeft, Package } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";

export default function ScanningStation() {
  const [, setLocation] = useLocation();
  const [imei, setImei] = useState("");
  const [phoneSpecs, setPhoneSpecs] = useState<any>(null);
  const [grade, setGrade] = useState("");
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [editingInspectionId, setEditingInspectionId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentOrderNumber = localStorage.getItem("currentOrderNumber");

  const { data: currentOrder } = useQuery({
    queryKey: ["/api/orders", currentOrderNumber],
    queryFn: async () => {
      if (!currentOrderNumber) return null;
      const response = await apiRequest("GET", `/api/orders/${currentOrderNumber}`);
      return response.json();
    },
    enabled: !!currentOrderNumber,
  });

  const { data: orderInspections = [] } = useQuery({
    queryKey: ["/api/orders", currentOrder?.id, "inspections"],
    queryFn: async () => {
      if (!currentOrder?.id) return [];
      const response = await apiRequest("GET", `/api/orders/${currentOrder.id}/inspections`);
      return response.json();
    },
    enabled: !!currentOrder?.id,
  });

  const lookupIMEI = useMutation({
    mutationFn: async (imeiNumber: string) => {
      const response = await apiRequest("GET", `/api/imei/${imeiNumber}`);
      return response.json();
    },
    onSuccess: (specs) => {
      setPhoneSpecs(specs);
      toast({ title: "Phone Found", description: `${specs.brand} ${specs.model} detected` });
    },
    onError: (error: any) => {
      toast({ title: "IMEI Lookup Failed", description: error.message || "Could not retrieve phone specs", variant: "destructive" });
    },
  });

  const saveInspection = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing && editingInspectionId) {
        const response = await apiRequest("PUT", `/api/inspections/${editingInspectionId}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/inspections", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: isEditing ? "Inspection updated." : "Inspection saved." });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", currentOrder?.id, "inspections"] });
    },
    onError: (error: any) => {
      toast({ title: isEditing ? "Update Failed" : "Save Failed", description: error.message || "Something went wrong", variant: "destructive" });
    },
  });

  const checkExistingInspection = useMutation({
    mutationFn: async (imeiNumber: string) => {
      if (!currentOrder?.id) return null;
      const response = await apiRequest("GET", `/api/inspections/imei/${imeiNumber}/order/${currentOrder.id}`);
      return response.json();
    },
    onSuccess: (existingInspection) => {
      if (existingInspection) {
        setIsEditing(true);
        setEditingInspectionId(existingInspection.id);
        setPhoneSpecs(existingInspection.phoneSpecs);
        setGrade(existingInspection.grade || "");
        setSelectedDefects(existingInspection.defects || []);
        setNotes(existingInspection.notes || "");
        toast({ title: "Existing Inspection Found", description: "Loaded for editing." });
      }
    },
    onError: () => {
      lookupIMEI.mutate(imei);
    },
  });

  const handleScanIMEI = () => {
    if (imei.length < 15) {
      toast({ title: "Invalid IMEI", description: "Enter a valid 15-digit IMEI number.", variant: "destructive" });
      return;
    }
    checkExistingInspection.mutate(imei);
  };

  const handleDefectChange = (defect: string, checked: boolean) => {
    setSelectedDefects(checked ? [...selectedDefects, defect] : selectedDefects.filter((d) => d !== defect));
  };

  const handleSaveInspection = () => {
    if (!imei || !grade) {
      toast({ title: "Missing Information", description: "IMEI and grade are required.", variant: "destructive" });
      return;
    }
    if (!currentOrder?.id) {
      toast({ title: "No Order Selected", description: "Select an order first.", variant: "destructive" });
      return;
    }
    saveInspection.mutate({ imei, orderId: currentOrder.id, phoneSpecs, grade, defects: selectedDefects, notes: notes || undefined });
  };

  const resetForm = () => {
    setImei(""); setPhoneSpecs(null); setGrade(""); setSelectedDefects([]); setNotes("");
    setIsEditing(false); setEditingInspectionId(null);
  };

  useEffect(() => {
    const editImei = localStorage.getItem("editImei");
    if (editImei && currentOrder?.id) {
      localStorage.removeItem("editImei");
      setImei(editImei);
      checkExistingInspection.mutate(editImei);
    }
  }, [currentOrder?.id]);

  const completedInspections = Array.isArray(orderInspections) ? orderInspections.length : 0;

  const defectOptions = [
    { value: "screen-crack", label: "Screen Crack" },
    { value: "back-damage", label: "Back Damage" },
    { value: "battery-issue", label: "Battery Issue" },
    { value: "camera-malfunction", label: "Camera Issue" },
    { value: "button-stuck", label: "Button Problems" },
    { value: "water-damage", label: "Water Damage" },
    { value: "missing-pen", label: "Missing Pen" },
    { value: "missing-sim-slot", label: "Missing SIM Slot" },
  ];

  const gradeOptions = [
    { value: "A+", label: "A+ (Excellent)" },
    { value: "A", label: "A (Very Good)" },
    { value: "B+", label: "B+ (Good)" },
    { value: "B", label: "B (Fair)" },
    { value: "C", label: "C (Poor)" },
    { value: "N/A", label: "N/A (Not Applicable)" },
  ];

  const progressPct = currentOrder?.expectedQuantity
    ? Math.round((completedInspections / currentOrder.expectedQuantity) * 100)
    : 0;

  return (
    <div className="container mx-auto px-6 py-6 max-w-5xl animate-in">

      {/* Header bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-brand-red text-white p-2 rounded-lg">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Scanning Station</h2>
            {currentOrder && (
              <p className="text-xs text-gray-500 font-mono">Order {currentOrder.orderNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-red rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 font-medium tabular-nums">
              {completedInspections}/{currentOrder?.expectedQuantity || 0}
            </span>
          </div>
          <Button
            onClick={() => setLocation("/station-selection")}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-900 h-8 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Switch
          </Button>
        </div>
      </div>

      {!currentOrderNumber && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-xs text-amber-700">
          No order selected. Go to the Dashboard and select an order first.
        </div>
      )}

      {/* Editing indicator */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 flex items-center justify-between">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Editing mode</span> — Modifying existing inspection for IMEI {imei}
          </p>
          <Button variant="ghost" size="sm" className="text-blue-600 h-6 text-xs" onClick={resetForm}>Cancel</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: IMEI Scanner + Phone Info */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-brand-red" />
                IMEI Scanner
              </h3>

              <div className="flex gap-2 mb-4">
                <Input
                  id="imei"
                  type="text"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="font-mono text-sm h-9"
                  placeholder="Enter 15-digit IMEI"
                  maxLength={15}
                />
                <Button
                  onClick={handleScanIMEI}
                  className="bg-brand-red hover:bg-brand-dark-red shrink-0 h-9 px-3"
                  disabled={lookupIMEI.isPending || checkExistingInspection.isPending}
                >
                  {lookupIMEI.isPending ? "..." : <QrCode className="w-4 h-4" />}
                </Button>
              </div>

              {phoneSpecs && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Identified Device</p>
                  <p className="font-semibold text-sm text-gray-900 mb-2">{phoneSpecs.brand} {phoneSpecs.model}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Storage:</span> <span className="font-medium text-gray-700">{phoneSpecs.storage || "—"}</span></div>
                    <div><span className="text-gray-500">Color:</span> <span className="font-medium text-gray-700">{phoneSpecs.color || "—"}</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Defect Documentation */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Defect Documentation
            </h3>

            <div className="space-y-4">
              {/* Grade */}
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Condition Grade</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select grade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Defects */}
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">Common Issues</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {defectOptions.map((defect) => (
                    <div key={defect.value} className="flex items-center gap-2">
                      <Checkbox
                        id={defect.value}
                        checked={selectedDefects.includes(defect.value)}
                        onCheckedChange={(checked) => handleDefectChange(defect.value, checked as boolean)}
                      />
                      <Label htmlFor={defect.value} className="text-xs text-gray-700 cursor-pointer">{defect.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-xs font-medium text-gray-600 mb-1.5 block">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm min-h-[72px] resize-none"
                  rows={3}
                  placeholder="Observations, battery health, cosmetic details..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={resetForm} variant="outline" size="sm" className="h-9 text-xs px-4">
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset
        </Button>
        <Button
          onClick={handleSaveInspection}
          className="bg-brand-red hover:bg-brand-dark-red text-white h-9 text-xs px-5 font-semibold"
          disabled={saveInspection.isPending}
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saveInspection.isPending
            ? (isEditing ? "Updating..." : "Saving...")
            : (isEditing ? "Update Inspection" : "Save & Continue")}
        </Button>
      </div>
    </div>
  );
}
