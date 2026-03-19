import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

interface OrderEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export default function OrderEntryModal({ isOpen, onClose, onOrderCreated }: OrderEntryModalProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [expectedQuantity, setExpectedQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createOrder = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/recent"] });
      toast({
        title: "Success",
        description: `Order ${order.orderNumber} created successfully!`,
      });
      resetForm();
      onOrderCreated();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setOrderNumber("");
    setExpectedQuantity("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber || !expectedQuantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createOrder.mutate({
      orderNumber,
      expectedQuantity: parseInt(expectedQuantity),
      notes: notes || undefined,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-black">
            New Order Entry
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Order Number
            </Label>
            <Input
              id="orderNumber"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full focus:ring-brand-red focus:border-transparent"
              placeholder="ORD-2024-XXX"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="expectedQuantity" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Quantity
            </Label>
            <Input
              id="expectedQuantity"
              type="number"
              value={expectedQuantity}
              onChange={(e) => setExpectedQuantity(e.target.value)}
              className="w-full focus:ring-brand-red focus:border-transparent"
              placeholder="Number of phones"
              min="1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full focus:ring-brand-red focus:border-transparent"
              rows={3}
              placeholder="Additional notes for this order"
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={createOrder.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-red hover:bg-brand-dark-red text-white"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? "Creating..." : "Start Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
