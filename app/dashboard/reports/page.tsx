"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Download, FileText, TrendingUp, TrendingDown, Calendar, Filter, Loader2,
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
import { supabase } from "@/lib/supabase";
import { aggregateByMonth, aggregateByCategory, topExpensesByCategory } from "@/lib/reports";

const tooltipFormatter = (value: unknown) => [`PKR ${Number(value).toLocaleString()}`];

const FALLBACK_MONTHLY = [
  { month: "Jan", expenses: 0, revenue: 0, profit: 0 },
  { month: "Feb", expenses: 0, revenue: 0, profit: 0 },
  { month: "Mar", expenses: 0, revenue: 0, profit: 0 },
  { month: "Apr", expenses: 0, revenue: 0, profit: 0 },
  { month: "May", expenses: 0, revenue: 0, profit: 0 },
  { month: "Jun", expenses: 0, revenue: 0, profit: 0 },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [monthlyData, setMonthlyData] = useState(FALLBACK_MONTHLY);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topExpenses, setTopExpenses] = useState<{ name: string; category: string; amount: number; change: string }[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: expenses }, { data: invoices }] = await Promise.all([
      supabase.from("expenses").select("amount, category, date").eq("user_id", user.id),
      supabase.from("invoices").select("amount, status, invoice_date").eq("user_id", user.id),
    ]);

    const yearExpenses = (expenses || []).filter((e) => e.date?.startsWith(year));
    const yearInvoices = (invoices || []).filter((i) => i.invoice_date?.startsWith(year));

    const monthly = aggregateByMonth(yearExpenses, yearInvoices, year);
    setMonthlyData(monthly.length > 0 ? monthly : FALLBACK_MONTHLY);
    setCategoryData(aggregateByCategory(yearExpenses));
    setTopExpenses(topExpensesByCategory(yearExpenses));
    setLoading(false);
  }, [year]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  const totalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0);
  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

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
    a.download = `agencyflow-report-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  const handleExportPDF = () => {
    const content = `
      <html><head><title>AgencyFlow Report ${year}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h1 { color: #4f46e5; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f3f4f6; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .card { border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; flex: 1; }
      </style></head><body>
      <h1>AgencyFlow Financial Report — ${year}</h1>
      <div class="summary">
        <div class="card"><strong>Revenue</strong><br>PKR ${totalRevenue.toLocaleString()}</div>
        <div class="card"><strong>Expenses</strong><br>PKR ${totalExpenses.toLocaleString()}</div>
        <div class="card"><strong>Net Profit</strong><br>PKR ${totalProfit.toLocaleString()}</div>
        <div class="card"><strong>Margin</strong><br>${profitMargin}%</div>
      </div>
      <table>
        <tr><th>Month</th><th>Expenses</th><th>Revenue</th><th>Profit</th></tr>
        ${monthlyData.map((d) => `<tr><td>${d.month}</td><td>PKR ${d.expenses.toLocaleString()}</td><td>PKR ${d.revenue.toLocaleString()}</td><td>PKR ${d.profit.toLocaleString()}</td></tr>`).join("")}
      </table>
      </body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(content);
      win.document.close();
      win.focus();
      win.print();
      toast.success("PDF print dialog opened!");
    } else {
      toast.error("Please allow popups to export PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-sm text-muted-foreground">Loading report data...</span>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6" ref={printRef}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Financial overview from your real expenses &amp; invoices</p>
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
            <SelectItem value="2024">2024</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="gap-1">
          <Calendar className="w-3 h-3" /> {year} · Live Data
        </Badge>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `PKR ${totalRevenue.toLocaleString()}`, up: totalRevenue > 0, color: "text-green-500" },
          { label: "Total Expenses", value: `PKR ${totalExpenses.toLocaleString()}`, up: false, color: "text-red-500" },
          { label: "Net Profit", value: `PKR ${totalProfit.toLocaleString()}`, up: totalProfit >= 0, color: "text-blue-500" },
          { label: "Profit Margin", value: `${profitMargin}%`, up: profitMargin >= 0, color: "text-purple-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {s.up ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                <span className="text-xs text-muted-foreground">from paid invoices &amp; expenses</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue vs Expenses</CardTitle></CardHeader>
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
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Profit Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v / 1000}k`} />
                <Tooltip formatter={tooltipFormatter} />
                <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} name="Net Profit" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Expense Categories</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No expense data for {year}</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                      {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categoryData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">PKR {item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Spending Categories</CardTitle></CardHeader>
          <CardContent>
            {topExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No expenses recorded yet</p>
            ) : (
              <div className="space-y-3">
                {topExpenses.map((exp, i) => {
                  const percentage = totalExpenses > 0 ? Math.round((exp.amount / totalExpenses) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{exp.name}</span>
                          <Badge variant="outline" className="text-xs">{exp.category}</Badge>
                        </div>
                        <span className="font-semibold text-sm">PKR {exp.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
