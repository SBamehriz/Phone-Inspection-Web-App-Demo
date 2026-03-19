import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { QrCode, Camera, Check, ArrowLeft, Package } from "lucide-react";
import { useLocation } from "wouter";

export default function StationSelection() {
  const [, setLocation] = useLocation();
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  useEffect(() => {
    const orderNumber = localStorage.getItem("currentOrderNumber");
    if (orderNumber) {
      fetch(`/api/orders/${orderNumber}`, { credentials: "include" })
        .then((res) => res.json())
        .then((order) => setCurrentOrder(order))
        .catch(() => localStorage.removeItem("currentOrderNumber"));
    }
  }, []);

  const selectStation = (station: "scanning" | "photographing") => {
    if (currentOrder) localStorage.setItem("currentOrderId", currentOrder.id.toString());
    setLocation(`/${station}`);
  };

  const stations = [
    {
      id: "scanning" as const,
      icon: QrCode,
      title: "Scanning Station",
      desc: "Scan IMEI numbers and document device condition",
      features: ["IMEI scanning & lookup", "Phone spec identification", "Defect documentation", "Condition grading"],
    },
    {
      id: "photographing" as const,
      icon: Camera,
      title: "Photographing Station",
      desc: "Capture images and complete the inspection",
      features: ["Live camera capture", "File upload support", "Image management", "Final inspection review"],
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Select Station</h2>
          <p className="text-xs text-gray-500">Choose your workstation to continue</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-900 h-8 text-xs"
            onClick={() => setLocation("/past-orders")}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Orders
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-900 h-8 text-xs"
            onClick={() => setLocation("/")}
          >
            Dashboard
          </Button>
        </div>
      </div>

      {/* Current order context */}
      {currentOrder && (
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-red-50 text-brand-red p-2 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Working on order</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{currentOrder.orderNumber}</p>
            </div>
            <span className="text-xs text-gray-500">{currentOrder.expectedQuantity} devices</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stations.map(({ id, icon: Icon, title, desc, features }) => (
          <Card
            key={id}
            className="card-hover cursor-pointer border-0 shadow-sm group"
            onClick={() => selectStation(id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-50 text-brand-red p-3 rounded-xl group-hover:bg-brand-red group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>

              <ul className="space-y-2 mb-5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button className="w-full bg-brand-red hover:bg-brand-dark-red text-white text-xs font-semibold h-9">
                Select {title.split(" ")[0]} Station
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
