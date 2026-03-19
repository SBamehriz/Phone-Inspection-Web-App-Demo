import React from "react";
import { Button } from "./ui/button";
import { useSignOut } from "../lib/auth";
import { Smartphone, LogOut, LayoutDashboard, FolderOpen, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";

interface User {
  id: number;
  username: string;
  role: string;
}

interface NavigationProps {
  user: User;
}

export default function Navigation({ user }: NavigationProps) {
  const signOut = useSignOut();
  const [location] = useLocation();

  const handleSignOut = () => {
    signOut.mutate();
  };

  const links = [
    { href: "/",            label: "Dashboard", icon: LayoutDashboard },
    { href: "/past-orders", label: "Orders",    icon: FolderOpen },
    { href: "/reports",     label: "Reports",   icon: BarChart3 },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <nav className="bg-brand-black text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Smartphone className="w-5 h-5 text-brand-red" />
            <span className="font-bold text-base tracking-tight">Phone Inspection</span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <span
                  className={`nav-link inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "active text-white bg-white/10"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right: user + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {user.username.charAt(0)}
              </div>
              {user.username}
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-white/10 h-8 px-2.5"
              disabled={signOut.isPending}
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
