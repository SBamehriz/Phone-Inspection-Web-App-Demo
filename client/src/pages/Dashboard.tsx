import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Plus, FolderOpen, BarChart3, CheckCircle, Clock,
  Package, ArrowRight, Smartphone,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: recentOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/orders/recent"],
  });

  const { data: allOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  const totalOrders    = allOrders.length;
  const activeOrders   = allOrders.filter((o: any) => o.status === "active").length;
  const completedOrders= allOrders.filter((o: any) => o.status === "completed").length;
  const totalDevices   = allOrders.reduce((s: number, o: any) => s + (o.expectedQuantity || 0), 0);

  const stats = [
    { label: "Total Orders",    value: totalOrders,    icon: FolderOpen,   color: "text-gray-700",  bg: "bg-gray-50" },
    { label: "Active",          value: activeOrders,   icon: Clock,        color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Completed",       value: completedOrders,icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Devices",   value: totalDevices,   icon: Smartphone,   color: "text-blue-600",  bg: "bg-blue-50" },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl animate-in">

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="card-hover border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${bg} ${color} p-2.5 rounded-lg`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          className="card-hover cursor-pointer border-0 shadow-sm group"
          onClick={() => setLocation("/new-order")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-red-50 text-brand-red p-3 rounded-xl group-hover:bg-brand-red group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">New Order</h3>
              <p className="text-xs text-gray-500">Start an inspection order</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-red transition-colors" />
          </CardContent>
        </Card>

        <Card
          className="card-hover cursor-pointer border-0 shadow-sm group"
          onClick={() => setLocation("/past-orders")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">Past Orders</h3>
              <p className="text-xs text-gray-500">View and manage orders</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
          </CardContent>
        </Card>

        <Card
          className="card-hover cursor-pointer border-0 shadow-sm group"
          onClick={() => setLocation("/reports")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">Reports</h3>
              <p className="text-xs text-gray-500">Export Excel reports</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-brand-red h-7"
              onClick={() => setLocation("/past-orders")}
            >
              View all
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-32" />
                    <div className="skeleton h-2.5 w-48" />
                  </div>
                  <div className="skeleton h-3 w-16" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No orders yet</p>
              <Button
                size="sm"
                className="mt-3 bg-brand-red hover:bg-brand-dark-red text-white text-xs"
                onClick={() => setLocation("/new-order")}
              >
                Create your first order
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="px-5 py-3 flex items-center gap-3 table-row-hover cursor-pointer transition-colors"
                  onClick={() => {
                    localStorage.setItem("currentOrderNumber", order.orderNumber);
                    setLocation("/past-orders");
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    order.status === "completed" ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"
                  }`}>
                    {order.status === "completed"
                      ? <CheckCircle className="w-4 h-4" />
                      : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 font-mono">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.expectedQuantity} devices
                      {order.notes ? ` — ${order.notes.split("\n")[0].replace("Client: ", "")}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      order.status === "completed"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}>
                      {order.status}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
