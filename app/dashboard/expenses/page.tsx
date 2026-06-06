"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, Filter, Download, Receipt, Trash2, Edit,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ✅ FIXED: Schema with recurring as required boolean (NOT optional)
const expenseSchema = z.object({
  description: z.string().min(2, "Description required"),
  amount: z.string().min(1, "Amount required"),
  category: z.string().min(1, "Category required"),
  date: z.string().min(1, "Date required"),
  paymentMethod: z.string().min(1, "Payment method required"),
  notes: z.string().optional(),
  recurring: z.boolean(), // ✅ NO .default() here — causes type mismatch with useForm
});

// ✅ FIXED: Type derived from schema — no manual type needed
type ExpenseForm = z.infer<typeof expenseSchema>;

const categories = [
  "Office Rent", "Salaries", "Electricity", "Petrol", "Food",
  "Hosting", "Tools", "Ads", "Internet", "Maintenance",
  "Freelancers", "Miscellaneous",
];

const paymentMethods = ["Cash", "Bank Transfer", "Credit Card", "JazzCash", "EasyPaisa"];

const mockExpenses = [
  { id: 1, description: "Ahrefs Subscription", category: "Tools", amount: 15000, date: "2026-06-04", method: "Credit Card", recurring: true, status: "approved" },
  { id: 2, description: "Facebook Ads", category: "Ads", amount: 25000, date: "2026-06-04", method: "Bank Transfer", recurring: false, status: "approved" },
  { id: 3, description: "Office Rent", category: "Office Rent", amount: 50000, date: "2026-06-03", method: "Bank Transfer", recurring: true, status: "approved" },
  { id: 4, description: "Freelancer Payment", category: "Freelancers", amount: 30000, date: "2026-06-02", method: "JazzCash", recurring: false, status: "pending" },
  { id: 5, description: "Internet Bill", category: "Internet", amount: 5000, date: "2026-06-01", method: "Cash", recurring: true, status: "approved" },
  { id: 6, description: "Electricity Bill", category: "Electricity", amount: 8000, date: "2026-05-31", method: "Cash", recurring: true, status: "approved" },
  { id: 7, description: "SEMrush", category: "Tools", amount: 12000, date: "2026-05-30", method: "Credit Card", recurring: true, status: "approved" },
  { id: 8, description: "Team Lunch", category: "Food", amount: 7500, date: "2026-05-29", method: "Cash", recurring: false, status: "approved" },
  { id: 9, description: "Petrol", category: "Petrol", amount: 3000, date: "2026-05-28", method: "Cash", recurring: false, status: "approved" },
  { id: 10, description: "Cloudways Hosting", category: "Hosting", amount: 8000, date: "2026-05-27", method: "Credit Card", recurring: true, status: "pending" },
];

const categoryColors: Record<string, string> = {
  "Tools": "bg-purple-100 text-purple-700",
  "Ads": "bg-blue-100 text-blue-700",
  "Office Rent": "bg-orange-100 text-orange-700",
  "Freelancers": "bg-pink-100 text-pink-700",
  "Internet": "bg-cyan-100 text-cyan-700",
  "Electricity": "bg-yellow-100 text-yellow-700",
  "Food": "bg-green-100 text-green-700",
  "Petrol": "bg-red-100 text-red-700",
  "Hosting": "bg-indigo-100 text-indigo-700",
  "Salaries": "bg-teal-100 text-teal-700",
  "Miscellaneous": "bg-gray-100 text-gray-700",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState(mockExpenses);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // ✅ FIXED: defaultValues explicitly sets recurring: false as boolean
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: "",
      paymentMethod: "",
      notes: "",
      recurring: false, // ✅ boolean, not undefined
    },
  });

  const onSubmit = async (data: ExpenseForm) => {
    const newExpense = {
      id: expenses.length + 1,
      description: data.description,
      category: data.category,
      amount: parseInt(data.amount),
      date: data.date,
      method: data.paymentMethod,
      recurring: data.recurring,
      status: "approved",
    };
    setExpenses([newExpense, ...expenses]);
    toast.success(`Expense added: PKR ${parseInt(data.amount).toLocaleString()}`);
    reset();
    setDialogOpen(false);
  };

  const deleteExpense = (id: number) => {
    setExpenses(expenses.filter((e) => e.id !== id));
    toast.success("Expense deleted");
  };

  const filtered = expenses.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track all your expenses</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="e.g. Ahrefs Subscription" {...register("description")} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (PKR)</Label>
                  <Input type="number" placeholder="5000" {...register("amount")} />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" {...register("date")} />
                  {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={(v) => setValue("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select onValueChange={(v) => setValue("paymentMethod", v)}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any additional notes..." {...register("notes")} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  {...register("recurring")}
                  className="w-4 h-4 accent-primary"
                />
                <Label htmlFor="recurring" className="cursor-pointer">Recurring payment</Label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  Add Expense
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Expenses", value: `PKR ${totalAmount.toLocaleString()}`, color: "text-red-500" },
          { label: "This Month", value: "PKR 2,45,000", color: "text-orange-500" },
          { label: "Recurring", value: `${expenses.filter(e => e.recurring).length} payments`, color: "text-purple-500" },
          { label: "Pending", value: `${expenses.filter(e => e.status === "pending").length} approvals`, color: "text-yellow-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Description", "Category", "Date", "Method", "Status", "Amount", "Actions"].map((h, i) => (
                      <th key={i} className={`text-xs font-medium text-muted-foreground px-4 py-3 ${i >= 5 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((expense, i) => (
                    <motion.tr key={expense.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{expense.description}</p>
                            {expense.recurring && <p className="text-xs text-muted-foreground">Recurring</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[expense.category] || "bg-gray-100 text-gray-700"}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{expense.date}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{expense.method}</td>
                      <td className="px-4 py-3">
                        <Badge variant={expense.status === "approved" ? "secondary" : "outline"} className="text-xs">
                          {expense.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-red-500">
                          -PKR {expense.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="w-7 h-7 p-0">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => deleteExpense(expense.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-3 p-4">
              {paginated.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center">
                      <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">{expense.date} · {expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500">-PKR {expense.amount.toLocaleString()}</p>
                    <button onClick={() => deleteExpense(expense.id)} className="text-xs text-destructive mt-1">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="font-medium text-muted-foreground">No expenses found</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0"
                    disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-medium">{currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0"
                    disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}