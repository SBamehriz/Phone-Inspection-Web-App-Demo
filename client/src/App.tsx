import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { useAuth } from "./lib/auth";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import PastOrders from "./pages/PastOrders";
import StationSelection from "./pages/StationSelection";
import ScanningStation from "./pages/ScanningStation";
import PhotographingStation from "./pages/PhotographingStation";
import Reports from "./pages/Reports";
import Navigation from "./components/Navigation";
import NotFound from "./pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gradient">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
    <Switch>
      <Route path="/signup" component={SignUp} />
      <Route path="/" component={SignIn} />
    </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation user={user} />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/new-order" component={NewOrder} />
        <Route path="/past-orders" component={PastOrders} />
        <Route path="/reports" component={Reports} />
        <Route path="/station-selection" component={StationSelection} />
        <Route path="/scanning" component={ScanningStation} />
        <Route path="/photographing" component={PhotographingStation} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;