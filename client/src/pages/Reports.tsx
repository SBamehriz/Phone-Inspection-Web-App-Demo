import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  ArrowLeft, FileSpreadsheet, Download, CheckCircle, Clock,
  BarChart3, Package, Smartphone,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";

export default function Reports() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/orders"] });

  function triggerDownload(reportUrl: string, downloadName: string) {
    fetch(reportUrl, { method: "GET", credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => {
        const url = window.URL.createObjectURL(
          new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => toast({ title: "Download Failed", variant: "destructive" }));
  }

  const generateOrderReport = useMutation({
    mutationFn: async (orderId: number) => {
      const r = await apiRequest("POST", "/api/reports/excel", { orderId });
      return r.json() as Promise<{ reportUrl: string; orderNumber: string; totalInspections: number }>;
    },
    onSuccess: (d) => {
      toast({ title: "Report Ready", description: `Order ${d.orderNumber} exported.` });
      triggerDownload(d.reportUrl, `inspection-report-${d.orderNumber}.xlsx`);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const exportAllOrders = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/reports/excel/all", {});
      return r.json() as Promise<{ reportUrl: string }>;
    },
    onSuccess: (d) => {
      toast({ title: "Report Ready", description: "All completed orders exported." });
      triggerDownload(d.reportUrl, "all-completed-orders-report.xlsx");
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const total      = orders.length;
  const active     = orders.filter((o: any) => o.status === "active").length;
  const completed  = orders.filter((o: any) => o.status === "completed").length;
  const devices    = orders.reduce((s: number, o: any) => s + (o.expectedQuantity || 0), 0);

  const stats = [
    { label: "Orders",    value: total,     icon: BarChart3,   color: "text-gray-700",    bg: "bg-gray-50" },
    { label: "Active",    value: active,    icon: Clock,       color: "text-amber-600",   bg: "bg-amber-50" },
    { label: "Completed", value: completed, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Devices",   value: devices,   icon: Smartphone,  color: "text-blue-600",    bg: "bg-blue-50" },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl animate-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Reports</h2>
          <p className="text-xs text-gray-500">Export inspection data as Excel spreadsheets</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
            onClick={() => exportAllOrders.mutate()}
            disabled={exportAllOrders.isPending || completed === 0}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            {exportAllOrders.isPending ? "Generating..." : "Export All Completed"}
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500 h-8 text-xs" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Dashboard
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={`${bg} ${color} p-2 rounded-lg`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-5 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-900">All Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Order Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-xs text-gray-400">Loading...</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
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
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap">
                        {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${order.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-blue-600 hover:bg-blue-50 px-2"
                          onClick={() => generateOrderReport.mutate(order.id)}
                          disabled={generateOrderReport.isPending}
                        >
                          <Download className="w-3 h-3 mr-1" /> Export
                        </Button>
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
