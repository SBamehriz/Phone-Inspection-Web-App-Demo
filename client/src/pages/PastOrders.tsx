import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  ArrowLeft, Edit, Eye, Plus, Trash2, Camera, CheckCircle, XCircle,
  Package, Play, ChevronLeft,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";

export default function PastOrders() {
  const [, setLocation] = useLocation();
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ notes: "", expectedQuantity: "", orderNumber: "" });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showInspections, setShowInspections] = useState(false);
  const [uploadingInspection, setUploadingInspection] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({ queryKey: ["/api/orders"] });

  const { data: orderDetails } = useQuery({
    queryKey: ["/api/orders", selectedOrder?.id, "details"],
    queryFn: async () => {
      if (!selectedOrder) return null;
      const response = await apiRequest("GET", `/api/orders/${selectedOrder.id}/details`);
      return response.json();
    },
    enabled: !!selectedOrder,
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/orders/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Order Updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setEditingOrder(null);
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteInspection = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/inspections/${id}`); },
    onSuccess: () => {
      toast({ title: "Inspection Deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrder?.id, "details"] });
    },
    onError: (error: any) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });

  const uploadImages = useMutation({
    mutationFn: async ({ inspectionId, images }: { inspectionId: number; images: File[] }) => {
      const formData = new FormData();
      images.forEach((img) => formData.append("images", img));
      const res = await fetch(`/api/inspections/${inspectionId}/images`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to upload images");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Images Uploaded" });
      setUploadingInspection(null);
      setSelectedImages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrder?.id, "details"] });
    },
    onError: (error: any) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setEditFormData({ notes: order.notes || "", expectedQuantity: order.expectedQuantity.toString(), orderNumber: order.orderNumber });
  };

  const handleUpdateOrder = () => {
    if (!editFormData.orderNumber.match(/^\d{12}$/)) {
      toast({ title: "Invalid Order Number", description: "Must be 12 digits", variant: "destructive" });
      return;
    }
    updateOrder.mutate({
      id: editingOrder.id,
      data: { notes: editFormData.notes, expectedQuantity: parseInt(editFormData.expectedQuantity), orderNumber: editFormData.orderNumber },
    });
  };

  const handleContinueOrder = (orderNumber: string) => {
    localStorage.setItem("currentOrderNumber", orderNumber);
    setLocation("/station-selection");
  };

  const gradeColor = (g: string) => {
    if (["A+", "A"].includes(g)) return "bg-emerald-50 text-emerald-700";
    if (["B+", "B"].includes(g)) return "bg-amber-50 text-amber-700";
    if (g === "C") return "bg-orange-50 text-orange-700";
    return "bg-gray-50 text-gray-600";
  };

  // --- Order Details View ---
  if (showInspections && selectedOrder) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-6xl animate-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
            <p className="text-xs text-gray-500 font-mono">{selectedOrder.orderNumber}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-500 h-8 text-xs" onClick={() => setShowInspections(false)}>
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back to Orders
          </Button>
        </div>

        {/* Order info strip */}
        <Card className="border-0 shadow-sm mb-5">
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-500">Order Number</p>
              <p className="font-mono font-semibold text-gray-900">{selectedOrder.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Description</p>
              <p className="font-medium text-gray-700 truncate">{selectedOrder.notes || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Expected Quantity</p>
              <p className="font-semibold text-gray-900">{selectedOrder.expectedQuantity} devices</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <Badge className={`text-[10px] mt-0.5 ${selectedOrder.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {selectedOrder.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Inspections table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-900">
                Inspected Devices ({orderDetails?.inspections?.length || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!orderDetails?.inspections || orderDetails.inspections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-xs text-gray-400">
                        No devices inspected yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderDetails.inspections.map((insp: any) => (
                      <TableRow key={insp.id} className="table-row-hover text-xs">
                        <TableCell>
                          {insp.status === "completed"
                            ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            : <XCircle className="w-3.5 h-3.5 text-gray-300" />}
                        </TableCell>
                        <TableCell className="font-mono text-gray-700">{insp.imei}</TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {insp.phoneSpecs?.brand || "?"} {insp.phoneSpecs?.model || ""}
                          {insp.phoneSpecs?.storage && <span className="text-gray-400 ml-1">{insp.phoneSpecs.storage}</span>}
                        </TableCell>
                        <TableCell>
                          {insp.grade
                            ? <Badge className={`text-[10px] ${gradeColor(insp.grade)}`}>{insp.grade}</Badge>
                            : <span className="text-gray-300">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${
                            insp.status === "completed" ? "bg-emerald-50 text-emerald-700"
                            : insp.status === "photographed" ? "bg-blue-50 text-blue-700"
                            : "bg-gray-50 text-gray-600"
                          }`}>{insp.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="sm" className="h-7 text-[11px] text-blue-600 hover:bg-blue-50 px-2"
                              onClick={() => {
                                localStorage.setItem("currentOrderNumber", selectedOrder.orderNumber);
                                localStorage.setItem("editImei", insp.imei);
                                setLocation("/scanning");
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="h-7 text-[11px] text-emerald-600 hover:bg-emerald-50 px-2"
                              onClick={() => setUploadingInspection(insp)}
                            >
                              <Camera className="w-3 h-3 mr-1" /> Images
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="h-7 text-[11px] text-red-500 hover:bg-red-50 px-2"
                              onClick={() => deleteInspection.mutate(insp.id)}
                              disabled={deleteInspection.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload Dialog */}
        <Dialog open={!!uploadingInspection} onOpenChange={() => setUploadingInspection(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">Upload Images</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {uploadingInspection?.phoneSpecs?.brand} {uploadingInspection?.phoneSpecs?.model} — {uploadingInspection?.imei}
              </p>
              <Input type="file" multiple accept="image/*" onChange={(e) => setSelectedImages(Array.from(e.target.files || []))} className="text-xs" />
              {selectedImages.length > 0 && (
                <p className="text-xs text-gray-500">{selectedImages.length} file(s) selected</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => uploadingInspection && selectedImages.length && uploadImages.mutate({ inspectionId: uploadingInspection.id, images: selectedImages })}
                  disabled={!selectedImages.length || uploadImages.isPending}
                  className="bg-brand-red hover:bg-brand-dark-red text-white text-xs h-8"
                >
                  {uploadImages.isPending ? "Uploading..." : "Upload"}
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => { setUploadingInspection(null); setSelectedImages([]); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --- Orders List View ---
  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Orders</h2>
          <p className="text-xs text-gray-500">Manage and review all inspection orders</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-brand-red hover:bg-brand-dark-red text-white text-xs h-8" onClick={() => setLocation("/new-order")}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Order
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500 h-8 text-xs" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Dashboard
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Order Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-xs text-gray-400">Loading...</TableCell>
                  </TableRow>
                ) : !Array.isArray(orders) || orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <Package className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No orders yet.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: any) => (
                    <TableRow key={order.id} className="table-row-hover text-xs">
                      <TableCell className="font-mono font-medium text-gray-900">{order.orderNumber}</TableCell>
                      <TableCell className="text-gray-600 max-w-[200px]">
                        <span className="truncate block">{order.notes?.split("\n")[0]?.replace("Client: ", "") || "—"}</span>
                      </TableCell>
                      <TableCell className="text-center font-medium">{order.expectedQuantity}</TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${order.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-[11px] text-gray-600 hover:bg-gray-50 px-2" onClick={() => handleEditOrder(order)}>
                                <Edit className="w-3 h-3 mr-1" /> Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader><DialogTitle className="text-sm">Edit Order</DialogTitle></DialogHeader>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Order Number (12 digits)</Label>
                                  <Input value={editFormData.orderNumber} onChange={(e) => setEditFormData({ ...editFormData, orderNumber: e.target.value })} maxLength={12} className="text-xs h-8 font-mono" />
                                </div>
                                <div>
                                  <Label className="text-xs">Description</Label>
                                  <Input value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} className="text-xs h-8" />
                                </div>
                                <div>
                                  <Label className="text-xs">Expected Quantity</Label>
                                  <Input type="number" min="1" value={editFormData.expectedQuantity} onChange={(e) => setEditFormData({ ...editFormData, expectedQuantity: e.target.value })} className="text-xs h-8" />
                                </div>
                                <Button onClick={handleUpdateOrder} className="w-full bg-brand-red hover:bg-brand-dark-red text-white text-xs h-8" disabled={updateOrder.isPending}>
                                  {updateOrder.isPending ? "Updating..." : "Update Order"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-blue-600 hover:bg-blue-50 px-2" onClick={() => { setSelectedOrder(order); setShowInspections(true); }}>
                            <Eye className="w-3 h-3 mr-1" /> Details
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-emerald-600 hover:bg-emerald-50 px-2" onClick={() => handleContinueOrder(order.orderNumber)}>
                            <Play className="w-3 h-3 mr-1" /> Continue
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
