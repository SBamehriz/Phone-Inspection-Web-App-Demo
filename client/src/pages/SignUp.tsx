import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

export default function SignUp() {
  const [loc, setLoc] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      setLoc("/"); // back to sign-in
    } else {
      const { message } = await res.json();
      alert(message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-brand-red text-white">
              Sign Up
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
