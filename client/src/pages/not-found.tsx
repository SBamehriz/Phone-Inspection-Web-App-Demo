import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center animate-in">
        <p className="text-6xl font-bold text-gray-200 mb-2">404</p>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Page not found</h1>
        <p className="text-sm text-gray-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Button
          onClick={() => setLocation("/")}
          className="bg-brand-red hover:bg-brand-dark-red text-white text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
