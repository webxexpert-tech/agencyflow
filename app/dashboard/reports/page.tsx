"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download, FileText, TrendingUp, TrendingDown, Calendar, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { toast } from "sonner";

const monthlyData = [
  { month: "Jan", expenses: 180000, revenue: 320000, profit: 140000 },
  { month: "Feb", expenses: 210000, revenue: 380000, profit: 170000 },
  { month: "Mar", expenses: 195000, revenue: 350000, profit: 155000 },
  { month: "Apr", expenses: 240000, revenue: 420000, profit: 180000 },
  { month: "May", expenses: 220000, revenue: 400000, profit: 180000 },
  { month: "Jun", expenses: 245000, revenue: 450000, profit: 205000 },
];

const categoryData = [
  { name: "Salaries", value: 120000, color: "#6366f1" },
  { name: "Ads", value: 45000, color: "#f43f5e" },
  { name: "Office Rent", value: 50000, color: "#f97316" },
  { name: "Tools", value: 27000, color: "#8b5cf6" },
  { name: "Hosting", value: 8000, color: "#06b6d4" },
  { name: "Miscellaneous", value: 15000, color: "#84cc16" },
];

const topExpenses = [
  { name: "Team Salaries", category: "Salaries", amount: 120000, change: "+5%" },
  { name: "Office Rent", category: "Office Rent", amount: 50000, change: "0%" },
  { name: "Facebook Ads", category: "Ads", amount: 45000, change: "+12%" },
  { name: "Ahrefs + SEMrush", category: "Tools", amount: 27000, change: "+22%" },
  { name: "Cloudways Hosting", category: "Hosting", amount: 8000, change: "-3%" },
];

// ✅ FIXED: Single formatter function used everywhere
const tooltipFormatter = (value: unknown) => [
  `PKR ${Number(value).toLocaleString()}`,
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState("2026");

  const totalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0);
  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = Math.round((totalProfit / totalRevenue) * 100);

  const handleExportCSV = () => {
    const rows = [
      ["Month", "Expenses", "Revenue", "Profit"],
      ...monthlyData.map((d) => [d.month, d.expenses, d.revenue, d.profit]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agencyflow-report.csv";
    a.click();
    toast.success("CSV exported successfully!");
  };

  const handleExportPDF = () => {
    toast.success("PDF export coming soon!");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Financial overview and detailed analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
            <FileText className="w-4 h-4" /> PDF
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }} className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="gap-1">
          <Calendar className="w-3 h-3" /> Jan — Jun 2026
        </Badge>
      </motion.div>

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `PKR ${totalRevenue.toLocaleString()}`, change: "+18%", up: true, color: "text-green-500" },
          { label: "Total Expenses", value: `PKR ${totalExpenses.toLocaleString()}`, change: "+12%", up: false, color: "text-red-500" },
          { label: "Net Profit", value: `PKR ${totalProfit.toLocaleString()}`, change: "+8%", up: true, color: "text-blue-500" },
          { label: "Profit Margin", value: `${profitMargin}%`, change: "+2%", up: true, color: "text-purple-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {s.up ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                <span className={`text-xs ${s.up ? "text-green-500" : "text-red-500"}`}>{s.change} vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v / 1000}k`} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v / 1000}k`} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 4 }} name="Net Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipFormatter} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">PKR {item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topExpenses.map((exp, i) => {
                  const percentage = Math.round((exp.amount / totalExpenses) * 100 * 6);
                  const isUp = exp.change.startsWith("+");
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{exp.name}</span>
                          <Badge variant="outline" className="text-xs">{exp.category}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs ${isUp ? "text-red-500" : "text-green-500"}`}>{exp.change}</span>
                          <span className="font-semibold text-sm">PKR {exp.amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}