import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Plus, Hash, User, Package, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";

export default function NewOrder() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    orderNumber: "",
    clientName: "",
    expectedQuantity: "",
    description: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOrder = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response;
    },
    onSuccess: () => {
      toast({ title: "Order Created", description: "New order has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/recent"] });
      setLocation("/past-orders");
    },
    onError: (error) => {
      toast({ title: "Creation Failed", description: error.message || "Failed to create order", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.orderNumber.trim() || !/^\d{12}$/.test(formData.orderNumber)) {
      toast({ title: "Validation Error", description: "Order number must be exactly 12 digits", variant: "destructive" });
      return;
    }
    if (!formData.clientName.trim()) {
      toast({ title: "Validation Error", description: "Please enter the client's name", variant: "destructive" });
      return;
    }
    if (!formData.expectedQuantity || parseInt(formData.expectedQuantity) <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid quantity", variant: "destructive" });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: "Validation Error", description: "Please enter an order description", variant: "destructive" });
      return;
    }

    createOrder.mutate({
      orderNumber: formData.orderNumber,
      expectedQuantity: parseInt(formData.expectedQuantity),
      notes: `Client: ${formData.clientName}\nDescription: ${formData.description}`,
    });
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">New Order</h2>
          <p className="text-xs text-gray-500">Create a new inspection order</p>
        </div>
        <Button
          onClick={() => setLocation("/")}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-900 h-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Order Number */}
            <div>
              <Label htmlFor="orderNumber" className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                Order Number
                <span className="text-gray-400 font-normal">(12 digits)</span>
              </Label>
              <Input
                id="orderNumber"
                type="text"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value.replace(/\D/g, "") })}
                className="font-mono text-sm h-9"
                placeholder="000000000000"
                maxLength={12}
                required
              />
            </div>

            {/* Client Name */}
            <div>
              <Label htmlFor="clientName" className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <User className="w-3 h-3" />
                Client Name
              </Label>
              <Input
                id="clientName"
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="text-sm h-9"
                placeholder="e.g. TechBridge Distributors LLC"
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="expectedQuantity" className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3 h-3" />
                Expected Quantity
              </Label>
              <Input
                id="expectedQuantity"
                type="number"
                min="1"
                value={formData.expectedQuantity}
                onChange={(e) => setFormData({ ...formData, expectedQuantity: e.target.value })}
                className="text-sm h-9"
                placeholder="Number of devices"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Order Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-sm min-h-[80px] resize-none"
                placeholder="e.g. Mixed Apple iPhone 15 Pro and Samsung Galaxy S24 Ultra. Carrier-unlocked, Dallas TX."
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-red hover:bg-brand-dark-red text-white text-sm font-semibold h-10"
              disabled={createOrder.isPending}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {createOrder.isPending ? "Creating..." : "Create Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
