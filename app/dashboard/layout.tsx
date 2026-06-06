"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Receipt, BarChart3, TrendingUp,
  Users, Settings, ChevronRight, Bell, Search, X,
  Users2, FileText, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "/dashboard/clients", label: "Clients", icon: Users2 },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/roi", label: "ROI Tracking", icon: TrendingUp },
  { href: "/dashboard/budget", label: "Budget", icon: Target },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const initialNotifications = [
  { id: 1, title: "Budget Alert!", message: "Ads budget 80% consumed this month", time: "2 min ago", read: false, type: "warning" },
  { id: 2, title: "New Expense Added", message: "Sarah added PKR 15,000 — Ahrefs", time: "15 min ago", read: false, type: "expense" },
  { id: 3, title: "Monthly Report Ready", message: "June 2026 financial report is ready", time: "1 hour ago", read: false, type: "report" },
  { id: 4, title: "Payment Due!", message: "Office rent PKR 35,000 due tomorrow", time: "3 hours ago", read: true, type: "payment" },
  { id: 5, title: "ROI Milestone", message: "Facebook Ads campaign hit 250% ROI!", time: "Yesterday", read: true, type: "success" },
];

const typeColors: Record<string, string> = {
  warning: "bg-yellow-100 text-yellow-700",
  expense: "bg-blue-100 text-blue-700",
  report: "bg-indigo-100 text-indigo-700",
  payment: "bg-red-100 text-red-700",
  success: "bg-green-100 text-green-700",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [liveNotifs, setLiveNotifs] = useState<{ id: number; message: string }[]>([]);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const messages = [
      "New expense added by team member",
      "Budget limit approaching!",
      "Client payment received — PKR 50,000",
      "Weekly report is ready to view",
    ];
    let i = 0;
    const interval = setInterval(() => {
      const msg = messages[i % messages.length];
      const newId = Date.now();
      setLiveNotifs((prev) => [...prev, { id: newId, message: msg }]);
      setNotifications((prev) => [
        { id: newId, title: "Live Update", message: msg, time: "Just now", read: false, type: "expense" },
        ...prev,
      ]);
      setTimeout(() => setLiveNotifs((prev) => prev.filter((n) => n.id !== newId)), 4000);
      i++;
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-base">AgencyFlow</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  {active && <ChevronRight className="h-3.5 w-3.5" />}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">AO</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">Agency Owner</p>
              <p className="text-xs text-muted-foreground truncate">owner@agency.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {unread}
                  </span>
                )}
              </Button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-indigo-600" />
                        <span className="font-semibold text-sm">Notifications</span>
                        {unread > 0 && <Badge className="text-xs bg-red-100 text-red-600 border-0 px-1.5">{unread}</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        {unread > 0 && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-indigo-600" onClick={markAllRead}>
                            Mark all read
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNotifOpen(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-border">
                      {notifications.slice(0, 8).map((n) => (
                        <div key={n.id} onClick={() => markRead(n.id)}
                          className={cn("px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors", !n.read && "bg-indigo-50/50")}>
                          <div className="flex items-start gap-3">
                            <div className={cn("text-xs px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5", typeColors[n.type])}>
                              {n.type === "warning" ? "⚠" : n.type === "success" ? "✓" : n.type === "payment" ? "!" : "•"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium truncate">{n.title}</p>
                                {!n.read && <div className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2.5 border-t border-border">
                      <Button variant="ghost" className="w-full text-xs text-indigo-600 h-8">View all notifications</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-xs bg-indigo-600 text-white">AO</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <AnimatePresence>
          {liveNotifs.map((n) => (
            <motion.div key={n.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-4 right-4 z-50 bg-card border border-border rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 max-w-xs"
            >
              <Bell className="h-4 w-4 text-indigo-600 shrink-0" />
              <p className="text-sm font-medium">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}