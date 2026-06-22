"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Receipt, BarChart3, TrendingUp,
  Users, Settings, ChevronRight, Bell, Search, X,
  Users2, FileText, Target, LogOut, CheckCheck, Sparkles,
  Video, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import OnboardingModal from "@/components/onboarding-modal";

const navItems = [
  { href: "/dashboard",           label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/expenses",  label: "Expenses",    icon: Receipt         },
  { href: "/dashboard/clients",   label: "Clients",     icon: Users2          },
  { href: "/dashboard/invoices",  label: "Invoices",    icon: FileText        },
  { href: "/dashboard/ai-proposals", label: "AI Proposals", icon: Sparkles   },
  { href: "/dashboard/meetings",  label: "Meetings",    icon: Video           },
  { href: "/dashboard/scope-detector", label: "Scope Detector", icon: AlertTriangle },
  { href: "/dashboard/reports",   label: "Reports",     icon: BarChart3       },
  { href: "/dashboard/roi",       label: "ROI Tracking",icon: TrendingUp      },
  { href: "/dashboard/budget",    label: "Budget",      icon: Target          },
  { href: "/dashboard/team",      label: "Team",        icon: Users           },
  { href: "/dashboard/settings",  label: "Settings",    icon: Settings        },
];

const typeColors: Record<string, string> = {
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  expense: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  report:  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  payment: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  info:    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  profile: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const typeIcons: Record<string, string> = {
  warning: "⚠️", expense: "💸", report: "📊",
  payment: "💳", success: "✅", info: "ℹ️", profile: "👤",
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

type Profile = {
  full_name: string;
  email: string;
  avatar_url: string;
  onboarding_completed: boolean;
  profile_completed_pct: number;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen]             = useState(false);
  const [notifications, setNotifications]     = useState<Notification[]>([]);
  const [profile, setProfile]                 = useState<Profile | null>(null);
  const [showOnboarding, setShowOnboarding]   = useState(false);
  const [userId, setUserId]                   = useState<string | null>(null);

  const unread = notifications.filter((n) => !n.read).length;

  // ── Fetch profile ───────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url, onboarding_completed, profile_completed_pct")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      // Show onboarding if not completed — after 5 seconds
      if (!data.onboarding_completed) {
        setTimeout(() => setShowOnboarding(true), 5000);
      }
    }
  }, []);

  // ── Fetch notifications ─────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setNotifications(data);
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, [fetchProfile, fetchNotifications]);

  // ── Realtime notifications subscription ────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          // Show toast for new notification
          toast(newNotif.title, {
            description: newNotif.message,
            icon: typeIcons[newNotif.type] ?? "🔔",
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Mark all read ───────────────────────────────────────────────────
  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ── Mark single read ────────────────────────────────────────────────
  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  // ── Logout ──────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully!");
    window.location.replace("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "AO";

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Onboarding Modal */}
      {showOnboarding && userId && (
        <OnboardingModal
          userId={userId}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            setShowOnboarding(false);
            fetchProfile();
            fetchNotifications();
          }}
        />
      )}

      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-base">AgencyFlow</span>
          </div>
        </div>

        {/* Profile completion bar */}
        {profile && profile.profile_completed_pct < 100 && (
          <div className="px-3 pt-3">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Profile</span>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{profile.profile_completed_pct}%</span>
              </div>
              <div className="w-full bg-indigo-100 dark:bg-indigo-900/50 rounded-full h-1.5">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${profile.profile_completed_pct}%` }}
                />
              </div>
              <button
                onClick={() => setShowOnboarding(true)}
                className="text-xs text-indigo-600 mt-1.5 hover:underline"
              >
                Complete profile →
              </button>
            </div>
          </div>
        )}

        {profile && profile.profile_completed_pct >= 100 && (
          <div className="px-3 pt-3">
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 flex items-center gap-2">
              <CheckCheck className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Profile 100% complete!</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-1">
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

        {/* User + Logout */}
        <div className="p-3 border-t border-border space-y-1">
          <Link href="/dashboard/settings">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <Avatar className="h-7 w-7">
                {profile?.avatar_url
                  ? <AvatarImage src={profile.avatar_url} />
                  : <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                }
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{profile?.full_name || "Agency Owner"}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email || ""}</p>
              </div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 h-9 text-sm" />
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Bell */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative h-9 w-9"
                onClick={() => setNotifOpen(!notifOpen)}>
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />

                    <motion.div
                      initial={{ opacity:0, y:8, scale:0.95 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      exit={{ opacity:0, y:8, scale:0.95 }}
                      transition={{ duration:0.15 }}
                      className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-indigo-600" />
                          <span className="font-semibold text-sm">Notifications</span>
                          {unread > 0 && (
                            <Badge className="text-xs bg-red-100 text-red-600 border-0 px-1.5">{unread}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {unread > 0 && (
                            <Button variant="ghost" size="sm" className="text-xs h-7 text-indigo-600"
                              onClick={markAllRead}>
                              Mark all read
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setNotifOpen(false)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-border">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div key={n.id} onClick={() => markRead(n.id)}
                              className={cn(
                                "px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                !n.read && "bg-indigo-50/50 dark:bg-indigo-950/10"
                              )}>
                              <div className="flex items-start gap-3">
                                <span className="text-base mt-0.5 shrink-0">
                                  {typeIcons[n.type] ?? "🔔"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium truncate">{n.title}</p>
                                    {!n.read && <div className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-2.5 border-t border-border">
                        <Button variant="ghost" className="w-full text-xs text-indigo-600 h-8">
                          View all notifications
                        </Button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <Link href="/dashboard/settings">
              <Avatar className="h-8 w-8 cursor-pointer">
                {profile?.avatar_url
                  ? <AvatarImage src={profile.avatar_url} />
                  : <AvatarFallback className="text-xs bg-indigo-600 text-white">{initials}</AvatarFallback>
                }
              </Avatar>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}