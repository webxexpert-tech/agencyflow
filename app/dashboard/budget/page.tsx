"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, AlertTriangle, CheckCircle, TrendingUp, Target, Trash2, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { spentByCategory } from "@/lib/reports";
import { createNotification } from "@/lib/notifications";

const currencies = [
  { code: "PKR", symbol: "₨", label: "🇵🇰 PKR", rate: 1 },
  { code: "USD", symbol: "$", label: "🇺🇸 USD", rate: 0.0036 },
  { code: "EUR", symbol: "€", label: "🇪🇺 EUR", rate: 0.0033 },
  { code: "GBP", symbol: "£", label: "🇬🇧 GBP", rate: 0.0028 },
];

const categories = [
  "Salaries", "Ads", "Tools", "Office Rent", "Hosting",
  "Freelancers", "Food", "Internet", "Electricity", "Miscellaneous",
];

const CATEGORY_COLORS: Record<string, string> = {
  Salaries: "#6366f1", Ads: "#f43f5e", Tools: "#8b5cf6", "Office Rent": "#f97316",
  Hosting: "#06b6d4", Freelancers: "#ec4899", Food: "#84cc16", Internet: "#14b8a6",
  Electricity: "#eab308", Miscellaneous: "#64748b",
};

type Budget = {
  id: string;
  category: string;
  amount: number;
  color: string;
  spent: number;
};

type Currency = { code: string; symbol: string; label: string; rate: number };

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
  const [formCategory, setFormCategory] = useState("");
  const [formBudget, setFormBudget] = useState("");

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: budgetRows, error: budgetErr }, { data: expenseRows }] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("expenses").select("category, amount").eq("user_id", user.id),
    ]);

    if (budgetErr) toast.error("Failed to load budgets");

    const spent = spentByCategory(expenseRows || []);
    const merged = (budgetRows || []).map((b) => ({
      id: b.id,
      category: b.category,
      amount: Number(b.amount),
      color: b.color || CATEGORY_COLORS[b.category] || "#6366f1",
      spent: spent[b.category] || 0,
    }));

    setBudgets(merged);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const convert = (pkrAmount: number) => {
    const converted = pkrAmount * selectedCurrency.rate;
    if (converted >= 1000) return `${selectedCurrency.symbol}${Math.round(converted).toLocaleString()}`;
    return `${selectedCurrency.symbol}${converted.toFixed(2)}`;
  };

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overBudget = budgets.filter(b => b.spent > b.amount);

  const getStatus = (budget: number, spent: number) => {
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    if (pct >= 100) return { label: "Over Budget", bg: "bg-red-100 text-red-700" };
    if (pct >= 80) return { label: "Warning", bg: "bg-yellow-100 text-yellow-700" };
    return { label: "On Track", bg: "bg-green-100 text-green-700" };
  };

  const handleAdd = async () => {
    if (!formCategory || !formBudget) return toast.error("Fill all fields!");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Please login first");

    const { error } = await supabase.from("budgets").upsert({
      user_id: user.id,
      category: formCategory,
      amount: parseInt(formBudget),
      color: CATEGORY_COLORS[formCategory] || "#6366f1",
    }, { onConflict: "user_id,category" });

    if (error) toast.error("Failed to save budget: " + error.message);
    else {
      toast.success(`Budget set for ${formCategory}!`);
      await createNotification(user.id, "🎯 Budget Updated", `${formCategory}: PKR ${parseInt(formBudget).toLocaleString()}`, "info");
      setFormCategory("");
      setFormBudget("");
      setDialogOpen(false);
      fetchBudgets();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) toast.error("Failed to delete budget");
    else {
      toast.success("Budget removed");
      setBudgets(budgets.filter(b => b.id !== id));
    }
  };

  const summaryCards = [
    { label: "Total Budget", value: convert(totalBudget), color: "text-blue-500", icon: Target, bg: "bg-blue-50" },
    { label: "Total Spent", value: convert(totalSpent), color: "text-red-500", icon: TrendingUp, bg: "bg-red-50" },
    { label: "Remaining", value: convert(Math.abs(totalRemaining)), color: totalRemaining >= 0 ? "text-green-500" : "text-red-500", icon: CheckCircle, bg: "bg-green-50" },
    { label: "Over Budget", value: `${overBudget.length} categories`, color: overBudget.length > 0 ? "text-red-500" : "text-green-500", icon: AlertTriangle, bg: "bg-orange-50" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Budget</h1>
          <p className="text-muted-foreground text-sm mt-1">Set limits and track spending per category</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCurrency.code} onValueChange={(v) => {
            setSelectedCurrency(currencies.find(c => c.code === v)!);
          }}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Set Budget</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Set Category Budget</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Budget (PKR)</Label>
                  <Input type="number" placeholder="e.g. 50000" value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleAdd}>Set Budget</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {overBudget.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {overBudget.length} {overBudget.length === 1 ? "category is" : "categories are"} over budget!
            </p>
            <p className="text-xs text-red-600 mt-0.5">{overBudget.map(b => b.category).join(", ")}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4">
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : budgets.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          No budgets set yet. Click &quot;Set Budget&quot; to add your first category limit.
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {budgets.map((b, i) => {
            const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
            const status = getStatus(b.amount, b.spent);
            const remaining = b.amount - b.spent;
            return (
              <motion.div key={b.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.color }} />
                        <div>
                          <p className="font-semibold text-sm">{b.category}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {convert(b.spent)} spent of {convert(b.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.bg}`}>{status.label}</span>
                        <button onClick={() => handleDelete(b.id)} className="text-muted-foreground hover:text-destructive p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{Math.round(pct)}% used</span>
                      <span className={remaining < 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"}>
                        {remaining < 0 ? `${convert(Math.abs(remaining))} over` : `${convert(remaining)} left`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
