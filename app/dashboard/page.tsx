"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, Flame,
  PiggyBank, Clock, Plus, Zap, ArrowUpRight, ArrowDownRight,
  Download, Sun, Sparkles, CheckCircle2, TrendingUp as TrendingUpIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

// ─── Animation Variants ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ─── Fallback monthly chart data ───────────────────────────────────────────
const FALLBACK_MONTHLY = [
  { month: "Jan 26", expenses: 180000, revenue: 320000 },
  { month: "Feb 26", expenses: 210000, revenue: 380000 },
  { month: "Mar 26", expenses: 195000, revenue: 350000 },
  { month: "Apr 26", expenses: 240000, revenue: 420000 },
  { month: "May 26", expenses: 220000, revenue: 400000 },
  { month: "Jun 26", expenses: 0,      revenue: 450000 },
];

const PIE_COLORS: Record<string, string> = {
  Salaries:     "#6366f1",
  Hosting:      "#8b5cf6",
  Ads:          "#a78bfa",
  Tools:        "#c4b5fd",
  Transport:    "#7c3aed",
  Office:       "#4f46e5",
  Food:         "#818cf8",
  Internet:     "#a5b4fc",
  Utilities:    "#ddd6fe",
  Freelancers:  "#ede9fe",
  Miscellaneous:"#c7d2fe",
};

// ─── Category helpers ──────────────────────────────────────────────────────
const categoryMap: Record<string, string> = {
  petrol:"Transport", fuel:"Transport", uber:"Transport",
  rent:"Office", office:"Office",
  ahrefs:"Tools", semrush:"Tools", tools:"Tools",
  hosting:"Hosting", server:"Hosting", cloudways:"Hosting",
  ads:"Ads", facebook:"Ads", google:"Ads",
  salary:"Salaries", salaries:"Salaries",
  food:"Food", lunch:"Food", dinner:"Food",
  internet:"Internet", wifi:"Internet",
  electricity:"Utilities", electric:"Utilities",
  freelancer:"Freelancers",
};

const categoryIcons: Record<string, string> = {
  Transport:"🚗", Office:"🏢", Tools:"🔧", Hosting:"🖥️",
  Ads:"📢", Salaries:"👥", Food:"🍔", Internet:"📡",
  Utilities:"⚡", Freelancers:"💼", Miscellaneous:"💸",
};

function parseExpenseInput(input: string) {
  const amountMatch = input.match(/(\d[\d,]*)/);
  const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, "")) : 0;
  let category = "Miscellaneous";
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(categoryMap)) {
    if (lower.includes(key)) { category = val; break; }
  }
  const description = input.replace(/\d[\d,]*/g, "").replace(/[$£€₨]/g, "").trim();
  return {
    amount,
    category,
    description: description.length > 1
      ? description.charAt(0).toUpperCase() + description.slice(1)
      : category,
  };
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface Expense {
  id: string | number;
  name: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
  type: string;
}

// ─── Dynamic AI Insights ───────────────────────────────────────────────────
function generateInsights(expenses: Expense[], total: number) {
  const insights: { text: string; type: string; icon: string }[] = [];

  if (expenses.length === 0) {
    insights.push({ text: "Add your first expense to get AI insights!", type: "info", icon: "💡" });
    return insights;
  }

  // Top category
  const catTotals: Record<string, number> = {};
  expenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] ?? 0) + e.amount; });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    const pct = Math.round((topCat[1] / total) * 100);
    insights.push({
      text: `${topCat[0]} is your top spend — PKR ${topCat[1].toLocaleString()} (${pct}% of total)`,
      type: pct > 40 ? "warning" : "info",
      icon: pct > 40 ? "⚠️" : "📊",
    });
  }

  // Daily burn
  const dayOfMonth = new Date().getDate();
  const burnPerDay = dayOfMonth > 0 ? Math.round(total / dayOfMonth) : 0;
  insights.push({
    text: `Daily burn rate: PKR ${burnPerDay.toLocaleString()}/day this month`,
    type: burnPerDay > 15000 ? "warning" : "success",
    icon: burnPerDay > 15000 ? "🔥" : "✅",
  });

  // Recurring count
  const recurring = expenses.filter((e) => e.type === "recurring").length;
  if (recurring > 0) {
    insights.push({
      text: `You have ${recurring} recurring expense${recurring > 1 ? "s" : ""} this month`,
      type: "info", icon: "🔄",
    });
  }

  // Savings
  const revenue = 450000; // fallback if no clients yet
  const savings = revenue - total;
  insights.push(
    savings > 0
      ? { text: `Estimated savings this month: PKR ${savings.toLocaleString()} 🎉`, type: "success", icon: "💰" }
      : { text: "Expenses exceed estimated revenue — review your spending!", type: "danger", icon: "🚨" }
  );

  return insights.slice(0, 4);
}

// ─── CSV Export ────────────────────────────────────────────────────────────
function exportCSV(expenses: Expense[]) {
  const header = "Name,Category,Amount (PKR),Date,Type\n";
  const rows = expenses.map((e) =>
    `"${e.name}","${e.category}",${e.amount},"${e.date}","${e.type}"`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agencyflow-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported successfully!");
}

// ─── Supabase client (outside component — no re-render issues) ────────────
const supabase = createClient();

// ──────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {

  const [quickInput, setQuickInput]   = useState("");
  const [adding, setAdding]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [userName, setUserName]       = useState("there");

  // ── Fix hydration: set date/greeting only on client ──────────────────
  const [greeting, setGreeting]   = useState("");
  const [dateStr, setDateStr]     = useState("");
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setDateStr(new Date().toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    }));
    setTodayLabel(new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }));
  }, []);

  const [expenses, setExpenses]       = useState<Expense[]>([]);
  const [monthlyData, setMonthlyData] = useState(FALLBACK_MONTHLY);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // ── Fetch user profile ────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (data?.full_name) setUserName(data.full_name.split(" ")[0]);
    };
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch expenses ────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(50);

    if (error) { console.error(error); setLoading(false); return; }

    if (data && data.length > 0) {
      const mapped: Expense[] = data.map((e) => ({
        id:       e.id,
        name:     e.description ?? e.category,
        category: e.category ?? "Miscellaneous",
        amount:   Number(e.amount),
        date:     new Date(e.date).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        }),
        icon: categoryIcons[e.category] ?? "💸",
        type: e.recurring ? "recurring" : "one-time",
      }));
      setExpenses(mapped);

      // Merge real expense totals into chart data
      const monthMap: Record<string, number> = {};
      data.forEach((e) => {
        const d   = new Date(e.date);
        const key = d.toLocaleString("en-US", { month: "short" }) +
                    " " + String(d.getFullYear()).slice(2);
        monthMap[key] = (monthMap[key] ?? 0) + Number(e.amount);
      });
      setMonthlyData(FALLBACK_MONTHLY.map((m) => ({
        ...m,
        expenses: monthMap[m.month] ?? m.expenses,
      })));
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // ── Fetch total revenue from clients ──────────────────────────────────
  useEffect(() => {
    const fetchRevenue = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("clients")
        .select("revenue")
        .eq("user_id", user.id);
      if (data && data.length > 0) {
        const total = data.reduce((s: number, c: { revenue: number }) => s + (Number(c.revenue) || 0), 0);
        setTotalRevenue(total > 0 ? total : 450000); // fallback if 0
      } else {
        setTotalRevenue(450000); // fallback
      }
    };
    fetchRevenue();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived values ────────────────────────────────────────────────────
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  // totalRevenue comes from state (fetched from clients)
  const netProfit     = totalRevenue - totalExpenses;
  const burnRate      = Math.round(totalExpenses / (new Date().getDate() || 1));
  const todayTotal    = expenses
    .filter((e) => e.date === todayLabel)
    .reduce((s, e) => s + e.amount, 0);

  // Pie data from real expenses
  const catTotals: Record<string, number> = {};
  expenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] ?? 0) + e.amount; });
  const pieData = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value, color: PIE_COLORS[name] ?? "#6366f1" }));

  const aiInsights = generateInsights(expenses, totalExpenses);

  // ── Quick Add ─────────────────────────────────────────────────────────
  const handleQuickAdd = async () => {
    if (!quickInput.trim()) return;
    const parsed = parseExpenseInput(quickInput);
    if (!parsed.amount) {
      toast.error("Please include an amount — e.g. '5000 petrol'");
      return;
    }
    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from("expenses").insert({
          user_id:        user.id,
          description:    parsed.description,
          amount:         parsed.amount,
          category:       parsed.category,
          date:           new Date().toISOString().split("T")[0],
          payment_method: "cash",
          recurring:      false,
          status:         "paid",
        });
        if (error) throw error;
        await fetchExpenses();
        toast.success(`✅ PKR ${parsed.amount.toLocaleString()} — ${parsed.category} saved!`);
      } else {
        setExpenses((prev) => [{
          id:       Date.now(),
          name:     parsed.description,
          category: parsed.category,
          amount:   parsed.amount,
          date:     todayLabel,
          icon:     categoryIcons[parsed.category] ?? "💸",
          type:     "one-time",
        }, ...prev]);
        toast.success(`PKR ${parsed.amount.toLocaleString()} added (offline)`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Try again.");
    }
    setQuickInput("");
    setAdding(false);
  };

  // ── Stats cards ───────────────────────────────────────────────────────
  const stats = [
    { title:"Total Expenses",  value:`PKR ${totalExpenses.toLocaleString()}`,          change:"+12%",         up:false, icon:TrendingDown, color:"text-red-500",    bg:"bg-red-50 dark:bg-red-950/20"    },
    { title:"Total Revenue",   value:`PKR ${totalRevenue.toLocaleString()}`,            change:"+18%",         up:true,  icon:TrendingUp,   color:"text-green-500",  bg:"bg-green-50 dark:bg-green-950/20"},
    { title:"Net Profit",      value:`PKR ${netProfit.toLocaleString()}`,               change:netProfit>0?"+8%":"-", up:netProfit>0, icon:DollarSign, color:"text-blue-500", bg:"bg-blue-50 dark:bg-blue-950/20" },
    { title:"Burn Rate",       value:`PKR ${burnRate.toLocaleString()}/day`,            change:"-3%",          up:false, icon:Flame,        color:"text-orange-500", bg:"bg-orange-50 dark:bg-orange-950/20"},
    { title:"Monthly Savings", value:`PKR ${Math.max(0,netProfit).toLocaleString()}`,   change:"+5%",          up:true,  icon:PiggyBank,    color:"text-purple-500", bg:"bg-purple-50 dark:bg-purple-950/20"},
    { title:"Total Entries",   value:`${expenses.length} expenses`,                     change:"this month",   up:true,  icon:Clock,        color:"text-yellow-500", bg:"bg-yellow-50 dark:bg-yellow-950/20"},
  ];

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 lg:p-6 space-y-6">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div variants={fadeUp}>
            <h1 className="text-2xl font-bold">{greeting}, {userName}! 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Financial overview · {dateStr}</p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => exportCSV(expenses)}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => document.getElementById("quick-add-input")?.focus()}>
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </motion.div>
        </motion.div>

        {/* Morning Digest */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}>
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Morning Digest</p>
                  {loading ? (
                    <p className="text-xs text-muted-foreground mt-1">Loading your financial summary...</p>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                      {todayTotal > 0
                        ? `Today you've spent PKR ${todayTotal.toLocaleString()}. `
                        : "No expenses logged today yet. "}
                      This month total is{" "}
                      <span className="font-semibold">PKR {totalExpenses.toLocaleString()}</span>.{" "}
                      {netProfit > 0
                        ? `You're PKR ${netProfit.toLocaleString()} in profit — great work! 🎯`
                        : `You're PKR ${Math.abs(netProfit).toLocaleString()} over budget — review expenses.`}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Add */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Quick Add Expense</span>
                <Badge className="text-xs bg-indigo-100 text-indigo-700 border-0">AI Powered</Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  id="quick-add-input"
                  placeholder='Try: "5000 petrol" or "15000 ahrefs" or "office rent 50000"'
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                  className="flex-1 bg-white dark:bg-background"
                />
                <Button onClick={handleQuickAdd} disabled={adding}
                  className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {adding ? "Saving..." : "Add"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Type amount + description. AI detects category automatically. Press Enter to add.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
                  <p className="font-bold text-sm leading-tight">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.up
                      ? <ArrowUpRight className="w-3 h-3 text-green-500" />
                      : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                    <span className={`text-xs ${stat.up ? "text-green-500" : "text-red-500"}`}>{stat.change}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bar Chart */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Revenue vs Expenses — 2026</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} tickFormatter={(v:number) => `${v/1000}k`} />
                    <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`]} contentStyle={{ fontSize:12 }} />
                    <Legend />
                    <Bar dataKey="revenue"  fill="#6366f1" radius={[4,4,0,0]} name="Revenue" />
                    <Bar dataKey="expenses" fill="#f43f5e" radius={[4,4,0,0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Expense Breakdown
                  {loading && <span className="text-xs text-muted-foreground ml-2">(loading…)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {pieData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="font-medium">
                            {totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    Add expenses to see breakdown
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Cash Flow */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Cash Flow — 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} tickFormatter={(v:number) => `${v/1000}k`} />
                  <Tooltip formatter={(v) => [`PKR ${Number(v).toLocaleString()}`]} contentStyle={{ fontSize:12 }} />
                  <Area type="monotone" dataKey="revenue"  stroke="#6366f1" fill="url(#colorRevenue)"  name="Revenue"  />
                  <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#colorExpenses)" name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Expenses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Recent Expenses</CardTitle>
                  <Badge className="text-xs bg-indigo-100 text-indigo-700 border-0">{expenses.length} entries</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 px-6 pb-4">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading expenses…</div>
                ) : expenses.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No expenses yet. Use Quick Add above! ⬆️
                  </div>
                ) : (
                  <div className="space-y-1">
                    {expenses.slice(0, 8).map((exp) => (
                      <div key={exp.id}
                        className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-base">
                            {exp.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{exp.name}</p>
                            <p className="text-xs text-muted-foreground">{exp.date} · {exp.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-red-500">-PKR {exp.amount.toLocaleString()}</p>
                          <Badge variant={exp.type === "recurring" ? "secondary" : "outline"} className="text-xs">
                            {exp.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">

            {/* AI Insights */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <CardTitle className="text-sm font-semibold">AI Insights</CardTitle>
                  <Badge className="text-xs bg-indigo-100 text-indigo-700 border-0">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiInsights.map((insight, i) => (
                  <div key={i} className={`text-xs p-2.5 rounded-lg flex items-start gap-2 ${
                    insight.type === "success" ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                    : insight.type === "warning" ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400"
                    : insight.type === "danger"  ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                    : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400"
                  }`}>
                    <span>{insight.icon}</span>
                    <span>{insight.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Financial Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Financial Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label:"Cash Flow",        value: totalRevenue > 0 ? Math.min(100, Math.round((netProfit / totalRevenue) * 100)) : 0 },
                  { label:"Savings Rate",     value: totalRevenue > 0 ? Math.min(100, Math.round((Math.max(0,netProfit) / totalRevenue) * 100)) : 0 },
                  { label:"Expense Control",  value: totalRevenue > 0 ? Math.max(0, 100 - Math.round((totalExpenses / totalRevenue) * 100)) : 0 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <Progress value={item.value} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-border bg-background">
        <div className="px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
              <TrendingUpIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-foreground">AgencyFlow</span>
            <span className="text-xs text-muted-foreground">© 2026 All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> All systems operational
            </span>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}