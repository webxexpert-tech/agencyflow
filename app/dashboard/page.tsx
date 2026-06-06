"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, Flame,
  PiggyBank, Clock, Plus, Zap, ArrowUpRight, ArrowDownRight,
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const monthlyData = [
  { month: "Jan 26", expenses: 180000, revenue: 320000 },
  { month: "Feb 26", expenses: 210000, revenue: 380000 },
  { month: "Mar 26", expenses: 195000, revenue: 350000 },
  { month: "Apr 26", expenses: 240000, revenue: 420000 },
  { month: "May 26", expenses: 220000, revenue: 400000 },
  { month: "Jun 26", expenses: 245000, revenue: 450000 },
];

const pieData = [
  { name: "Salaries", value: 120000, color: "#6366f1" },
  { name: "Hosting", value: 25000, color: "#8b5cf6" },
  { name: "Ads", value: 45000, color: "#a78bfa" },
  { name: "Tools", value: 20000, color: "#c4b5fd" },
  { name: "Office", value: 35000, color: "#ddd6fe" },
];

const recurringPayments = [
  { name: "Ahrefs", amount: 15000, dueIn: "Today", status: "due" },
  { name: "Hosting (Cloudways)", amount: 8000, dueIn: "3 days", status: "upcoming" },
  { name: "SEMrush", amount: 12000, dueIn: "5 days", status: "upcoming" },
  { name: "Team Salaries", amount: 250000, dueIn: "8 days", status: "upcoming" },
];

const aiInsights = [
  { text: "Tool expenses increased 22% this month", type: "warning", icon: "📊" },
  { text: "Facebook Ads ROI performing well (+340%)", type: "success", icon: "🎯" },
  { text: "Guest posting spend has low ROI", type: "danger", icon: "⚠️" },
  { text: "You're on track to save PKR 40,000 this month", type: "success", icon: "💰" },
];

const categoryMap: Record<string, string> = {
  petrol: "Transport", fuel: "Transport", uber: "Transport",
  rent: "Office", office: "Office",
  ahrefs: "Tools", semrush: "Tools", tools: "Tools",
  hosting: "Hosting", server: "Hosting", cloudways: "Hosting",
  ads: "Ads", facebook: "Ads", google: "Ads",
  salary: "Salaries", salaries: "Salaries",
  food: "Food", lunch: "Food", dinner: "Food",
  internet: "Internet", wifi: "Internet",
  electricity: "Utilities", electric: "Utilities",
  freelancer: "Freelancers",
};

const categoryIcons: Record<string, string> = {
  Transport: "🚗", Office: "🏢", Tools: "🔧", Hosting: "🖥️",
  Ads: "📢", Salaries: "👥", Food: "🍔", Internet: "📡",
  Utilities: "⚡", Freelancers: "💼", Miscellaneous: "💸",
};

function parseExpenseInput(input: string) {
  const amountMatch = input.match(/(\d+[\d,]*)/);
  const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, "")) : 0;
  let category = "Miscellaneous";
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(categoryMap)) {
    if (lower.includes(key)) { category = val; break; }
  }
  const words = input.replace(/\d+[\d,]*/g, "").replace(/[$£€₨]/g, "").trim();
  const description = words.length > 2 ? words : category;
  return { amount, category, description };
}

export default function DashboardPage() {
  const [quickInput, setQuickInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(245000);
  const [totalRevenue] = useState(450000);

  const [recentExpenses, setRecentExpenses] = useState([
    { id: 1, name: "Ahrefs Subscription", category: "Tools", amount: 15000, date: "Jun 1, 2026", icon: "🔧", type: "recurring" },
    { id: 2, name: "Facebook Ads", category: "Ads", amount: 25000, date: "Jun 2, 2026", icon: "📢", type: "one-time" },
    { id: 3, name: "Office Rent", category: "Office", amount: 50000, date: "Jun 2, 2026", icon: "🏢", type: "recurring" },
    { id: 4, name: "Freelancer Payment", category: "Freelancers", amount: 30000, date: "Jun 3, 2026", icon: "💼", type: "one-time" },
    { id: 5, name: "Internet Bill", category: "Internet", amount: 5000, date: "Jun 3, 2026", icon: "📡", type: "recurring" },
  ]);

  const netProfit = totalRevenue - totalExpenses;
  const burnRate = Math.round(totalExpenses / 30);

  const handleQuickAdd = async () => {
    if (!quickInput.trim()) return;
    const parsed = parseExpenseInput(quickInput);
    if (!parsed.amount) {
      toast.error("Please include an amount — e.g. '5000 petrol'");
      return;
    }
    setAdding(true);
    await new Promise((r) => setTimeout(r, 600));
    const icon = categoryIcons[parsed.category] ?? "💸";
    const newExp = {
      id: Date.now(),
      name: parsed.description.charAt(0).toUpperCase() + parsed.description.slice(1),
      category: parsed.category,
      amount: parsed.amount,
      date: "Jun 5, 2026",
      icon,
      type: "one-time",
    };
    setRecentExpenses((prev) => [newExp, ...prev.slice(0, 9)]);
    setTotalExpenses((prev) => prev + parsed.amount);
    toast.success(`PKR ${parsed.amount.toLocaleString()} — ${parsed.category} added!`);
    setQuickInput("");
    setAdding(false);
  };

  const stats = [
    { title: "Total Expenses", value: `PKR ${totalExpenses.toLocaleString()}`, change: "+12%", up: false, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
    { title: "Total Revenue", value: `PKR ${totalRevenue.toLocaleString()}`, change: "+18%", up: true, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
    { title: "Net Profit", value: `PKR ${netProfit.toLocaleString()}`, change: "+8%", up: true, icon: DollarSign, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
    { title: "Burn Rate", value: `PKR ${burnRate.toLocaleString()}/day`, change: "-3%", up: false, icon: Flame, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
    { title: "Monthly Savings", value: "PKR 40,000", change: "+5%", up: true, icon: PiggyBank, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20" },
    { title: "Pending Payments", value: "PKR 35,000", change: "2 due", up: false, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold">Good morning! 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s your financial overview for June 2026</p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
        </motion.div>
      </motion.div>

      {/* Quick Add */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Quick Add Expense</span>
              <Badge className="text-xs bg-indigo-100 text-indigo-700 border-0">AI Powered</Badge>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder='Try: "5000 petrol" or "15000 ahrefs" or "office rent 50000"'
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                className="flex-1 bg-white dark:bg-background"
              />
              <Button onClick={handleQuickAdd} disabled={adding} className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                {adding ? "Adding..." : "Add"}
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
                  {stat.up ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                  <span className={`text-xs ${stat.up ? "text-green-500" : "text-red-500"}`}>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenue vs Expenses — 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v / 1000}k`} />
                  <Tooltip formatter={(value) => [`PKR ${Number(value).toLocaleString()}`]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`PKR ${Number(value).toLocaleString()}`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{Math.round(item.value / 2450)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cash Flow */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Cash Flow — 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v / 1000}k`} />
                <Tooltip formatter={(value) => [`PKR ${Number(value).toLocaleString()}`]} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#colorExpenses)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Expenses</CardTitle>
                <Badge className="text-xs bg-indigo-100 text-indigo-700 border-0">{recentExpenses.length} entries</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 p-0 px-6 pb-4">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
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
                    <Badge variant={exp.type === "recurring" ? "secondary" : "outline"} className="text-xs">{exp.type}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Upcoming Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recurringPayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Due: {p.dueIn}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">PKR {p.amount.toLocaleString()}</p>
                    <Badge variant={p.status === "due" ? "destructive" : "secondary"} className="text-xs">{p.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">AI Insights</CardTitle>
                <Badge className="text-xs bg-indigo-100 text-indigo-700 border-0">Beta</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {aiInsights.map((insight, i) => (
                <div key={i} className={`text-xs p-2.5 rounded-lg flex items-start gap-2 ${
                  insight.type === "success" ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                  : insight.type === "warning" ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400"
                  : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                }`}>
                  <span>{insight.icon}</span>
                  <span>{insight.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Financial Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Cash Flow", value: 78 },
                { label: "Savings Rate", value: 65 },
                { label: "ROI Score", value: 82 },
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
  );
}