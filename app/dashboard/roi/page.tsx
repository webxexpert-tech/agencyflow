"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Plus, Target, DollarSign,
  BarChart2, Trash2, CheckCircle2, Clock, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { campaignMonthlyData } from "@/lib/reports";
import { createNotification } from "@/lib/notifications";

type Campaign = {
  id: string;
  name: string;
  client_name: string;
  invested: number;
  returned: number;
  status: string;
  category: string;
  start_date: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  Active: CheckCircle2, Completed: CheckCircle2, Paused: Clock,
};

const categoryColors: Record<string, string> = {
  "Paid Ads": "bg-purple-100 text-purple-700",
  SEO: "bg-indigo-100 text-indigo-700",
  "Social Media": "bg-pink-100 text-pink-700",
  Email: "bg-orange-100 text-orange-700",
};

export default function ROITrackingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", client: "", invested: "", returned: "",
    status: "Active", category: "Paid Ads",
  });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("roi_campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load campaigns");
    else setCampaigns(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const calcROI = (invested: number, returned: number) =>
    invested > 0 ? (((returned - invested) / invested) * 100).toFixed(1) : "0";

  const totalInvested = campaigns.reduce((s, c) => s + Number(c.invested), 0);
  const totalReturned = campaigns.reduce((s, c) => s + Number(c.returned), 0);
  const avgROI = campaigns.length
    ? (campaigns.reduce((s, c) => s + parseFloat(calcROI(Number(c.invested), Number(c.returned))), 0) / campaigns.length).toFixed(1)
    : "0";
  const bestCampaign = [...campaigns].sort(
    (a, b) => parseFloat(calcROI(Number(b.invested), Number(b.returned))) - parseFloat(calcROI(Number(a.invested), Number(a.returned)))
  )[0];

  const roiData = campaignMonthlyData(campaigns);
  const chartData = roiData.length > 0 ? roiData : [{ month: "No data", invested: 0, returned: 0, roi: 0 }];

  const handleAdd = async () => {
    if (!form.name || !form.client || !form.invested || !form.returned)
      return toast.error("Fill all fields");

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please login first"); setSubmitting(false); return; }

    const today = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

    const { error } = await supabase.from("roi_campaigns").insert({
      user_id: user.id,
      name: form.name,
      client_name: form.client,
      invested: parseFloat(form.invested),
      returned: parseFloat(form.returned),
      status: form.status,
      category: form.category,
      start_date: today,
    });

    if (error) toast.error("Failed to add campaign: " + error.message);
    else {
      toast.success("Campaign added!");
      await createNotification(user.id, "📈 Campaign Added", form.name, "success");
      setForm({ name: "", client: "", invested: "", returned: "", status: "Active", category: "Paid Ads" });
      setDialogOpen(false);
      fetchCampaigns();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("roi_campaigns").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Campaign removed");
      setCampaigns(campaigns.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ROI Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">Track return on investment across all your client campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Add Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add New Campaign</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input placeholder="Facebook Ads — Lead Gen" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input placeholder="Zenith Academy" value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount Invested (PKR)</Label>
                  <Input type="number" placeholder="25000" value={form.invested}
                    onChange={(e) => setForm({ ...form, invested: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Amount Returned (PKR)</Label>
                  <Input type="number" placeholder="87500" value={form.returned}
                    onChange={(e) => setForm({ ...form, returned: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Paid Ads", "SEO", "Social Media", "Email"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Active", "Completed", "Paused"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAdd} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Add Campaign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Invested", value: `PKR ${(totalInvested / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50", sub: `${campaigns.length} campaigns` },
          { label: "Total Returned", value: `PKR ${(totalReturned / 1000).toFixed(0)}k`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", sub: `+PKR ${((totalReturned - totalInvested) / 1000).toFixed(0)}k profit` },
          { label: "Average ROI", value: `${avgROI}%`, icon: BarChart2, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Across all campaigns" },
          { label: "Best Campaign", value: bestCampaign ? `${calcROI(Number(bestCampaign.invested), Number(bestCampaign.returned))}%` : "—", icon: Target, color: "text-purple-600", bg: "bg-purple-50", sub: bestCampaign?.name?.split("—")[0] ?? "" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ROI Trend</CardTitle>
            <CardDescription>Return on investment by period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, "ROI"]} />
                <Area type="monotone" dataKey="roi" stroke="#6366f1" fill="url(#roiGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invested vs Returned</CardTitle>
            <CardDescription>Monthly PKR comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`PKR ${(Number(v) / 1000).toFixed(0)}k`]} />
                <Legend />
                <Bar dataKey="invested" name="Invested" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returned" name="Returned" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Campaigns</CardTitle>
          <CardDescription>Individual ROI breakdown per campaign</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No campaigns yet. Add your first campaign above.</div>
          ) : (
            <div className="divide-y divide-border">
              {campaigns.map((c, i) => {
                const roi = parseFloat(calcROI(Number(c.invested), Number(c.returned)));
                const isPositive = roi >= 0;
                const StatusIcon = statusIcons[c.status] || CheckCircle2;
                return (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{c.name}</p>
                          <Badge className={`text-xs border-0 ${categoryColors[c.category] || ""}`}>{c.category}</Badge>
                          <Badge className={`text-xs border-0 ${statusColors[c.status]}`}>
                            <StatusIcon className="h-3 w-3 mr-1 inline" />{c.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{c.client_name} · Started {c.start_date}</p>
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Invested: PKR {Number(c.invested).toLocaleString()}</span>
                            <span>Returned: PKR {Number(c.returned).toLocaleString()}</span>
                          </div>
                          <Progress value={Math.min((Number(c.returned) / (Number(c.invested) * 2)) * 100, 100)} className="h-1.5" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className={`flex items-center gap-1 font-bold text-lg ${isPositive ? "text-green-600" : "text-red-500"}`}>
                            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {isPositive ? "+" : ""}{roi}%
                          </div>
                          <p className="text-xs text-muted-foreground">ROI</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"
                          onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
