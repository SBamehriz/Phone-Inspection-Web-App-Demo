import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Smartphone, LogIn, Info } from "lucide-react";
import { useSignIn } from "../lib/auth";
import { useToast } from "../hooks/use-toast";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useSignIn();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Error", description: "Please enter both username and password", variant: "destructive" });
      return;
    }
    signIn.mutate(
      { username, password },
      {
        onError: (error) => {
          toast({ title: "Sign In Failed", description: error.message || "Invalid credentials", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient p-4">
      <div className="w-full max-w-sm animate-in">
        {/* Logo block */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-red mb-3">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Phone Inspection System</h1>
          <p className="text-gray-400 text-xs mt-1">Quality control & device grading</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6">
            {/* Demo notice */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5 mb-5">
              <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                <span className="font-semibold">Demo Mode</span> — Enter any username and password to sign in.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Enter password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-brand-red hover:bg-brand-dark-red text-white text-sm font-semibold h-9"
                disabled={signIn.isPending}
              >
                {signIn.isPending ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-gray-500 mt-4">
          Inspection Software Demo
        </p>
      </div>
    </div>
  );
}
