"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const currencies = [
  { code: "PKR", symbol: "₨", label: "🇵🇰 PKR", rate: 1 },
  { code: "USD", symbol: "$", label: "🇺🇸 USD", rate: 0.0036 },
  { code: "EUR", symbol: "€", label: "🇪🇺 EUR", rate: 0.0033 },
  { code: "GBP", symbol: "£", label: "🇬🇧 GBP", rate: 0.0028 },
  { code: "AED", symbol: "د.إ", label: "🇦🇪 AED", rate: 0.013 },
  { code: "SAR", symbol: "﷼", label: "🇸🇦 SAR", rate: 0.013 },
  { code: "CAD", symbol: "C$", label: "🇨🇦 CAD", rate: 0.0049 },
  { code: "AUD", symbol: "A$", label: "🇦🇺 AUD", rate: 0.0055 },
];

const initialBudgets = [
  { id: 1, category: "Salaries", budget: 150000, spent: 120000, color: "#6366f1" },
  { id: 2, category: "Ads", budget: 50000, spent: 45000, color: "#f43f5e" },
  { id: 3, category: "Tools", budget: 30000, spent: 27000, color: "#8b5cf6" },
  { id: 4, category: "Office Rent", budget: 50000, spent: 50000, color: "#f97316" },
  { id: 5, category: "Hosting", budget: 15000, spent: 8000, color: "#06b6d4" },
  { id: 6, category: "Freelancers", budget: 40000, spent: 55000, color: "#ec4899" },
  { id: 7, category: "Food", budget: 10000, spent: 7500, color: "#84cc16" },
  { id: 8, category: "Internet", budget: 6000, spent: 5000, color: "#14b8a6" },
];

const categories = [
  "Salaries", "Ads", "Tools", "Office Rent", "Hosting",
  "Freelancers", "Food", "Internet", "Electricity", "Miscellaneous",
];

type Budget = {
  id: number;
  category: string;
  budget: number;
  spent: number;
  color: string;
};

type Currency = {
  code: string;
  symbol: string;
  label: string;
  rate: number;
};

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);
  const [formCategory, setFormCategory] = useState("");
  const [formBudget, setFormBudget] = useState("");

  const convert = (pkrAmount: number) => {
    const converted = pkrAmount * selectedCurrency.rate;
    if (converted >= 1000) return `${selectedCurrency.symbol}${Math.round(converted).toLocaleString()}`;
    if (converted >= 1) return `${selectedCurrency.symbol}${converted.toFixed(2)}`;
    return `${selectedCurrency.symbol}${converted.toFixed(4)}`;
  };

  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overBudget = budgets.filter(b => b.spent > b.budget);

  const getStatus = (budget: number, spent: number) => {
    const pct = (spent / budget) * 100;
    if (pct >= 100) return { label: "Over Budget", bg: "bg-red-100 text-red-700" };
    if (pct >= 80) return { label: "Warning", bg: "bg-yellow-100 text-yellow-700" };
    return { label: "On Track", bg: "bg-green-100 text-green-700" };
  };

  const handleAdd = () => {
    if (!formCategory || !formBudget) {
      toast.error("Fill all fields!");
      return;
    }
    const newBudget: Budget = {
      id: budgets.length + 1,
      category: formCategory,
      budget: parseInt(formBudget),
      spent: 0,
      color: "#6366f1",
    };
    setBudgets([...budgets, newBudget]);
    toast.success(`Budget set for ${formCategory}!`);
    setFormCategory("");
    setFormBudget("");
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setBudgets(budgets.filter(b => b.id !== id));
    toast.success("Budget removed");
  };

  const summaryCards = [
    { label: "Total Budget", value: convert(totalBudget), color: "text-blue-500", icon: Target, bg: "bg-blue-50" },
    { label: "Total Spent", value: convert(totalSpent), color: "text-red-500", icon: TrendingUp, bg: "bg-red-50" },
    { label: "Remaining", value: convert(Math.abs(totalRemaining)), color: totalRemaining >= 0 ? "text-green-500" : "text-red-500", icon: CheckCircle, bg: "bg-green-50" },
    { label: "Over Budget", value: `${overBudget.length} categories`, color: overBudget.length > 0 ? "text-red-500" : "text-green-500", icon: AlertTriangle, bg: "bg-orange-50" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Budget</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set limits and track spending per category
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedCurrency.code}
            onValueChange={(v) => {
              const cur = currencies.find(c => c.code === v)!;
              setSelectedCurrency(cur);
              toast.success(`Switched to ${cur.code}`);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Set Category Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={setFormCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Budget (PKR)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 50000"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleAdd}>
                    Set Budget
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Alert */}
      {overBudget.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {overBudget.length} {overBudget.length === 1 ? "category is" : "categories are"} over budget!
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {overBudget.map(b => b.category).join(", ")}
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Budget List */}
      <div className="space-y-4">
        {budgets.map((b, i) => {
          const pct = Math.min((b.spent / b.budget) * 100, 100);
          const status = getStatus(b.budget, b.spent);
          const remaining = b.budget - b.spent;

          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.color }} />
                      <div>
                        <p className="font-semibold text-sm">{b.category}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {convert(b.spent)} spent of {convert(b.budget)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.bg}`}>
                        {status.label}
                      </span>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
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
    </div>
  );
}