"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, Filter, Download, Receipt, Trash2, Edit,
  ChevronLeft, ChevronRight, Loader2,
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
import { supabase } from "@/lib/supabase";

const expenseSchema = z.object({
  description: z.string().min(2, "Description required"),
  amount: z.string().min(1, "Amount required"),
  category: z.string().min(1, "Category required"),
  date: z.string().min(1, "Date required"),
  paymentMethod: z.string().min(1, "Payment method required"),
  notes: z.string().optional(),
  recurring: z.boolean(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

// Supabase se aane wala data ka type
type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  payment_method: string;
  recurring: boolean;
  status: string;
  notes?: string;
};

const categories = [
  "Office Rent", "Salaries", "Electricity", "Petrol", "Food",
  "Hosting", "Tools", "Ads", "Internet", "Maintenance",
  "Freelancers", "Miscellaneous",
];

const paymentMethods = ["Cash", "Bank Transfer", "Credit Card", "JazzCash", "EasyPaisa"];

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const itemsPerPage = 7;

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: "",
      paymentMethod: "",
      notes: "",
      recurring: false,
    },
  });

  // ✅ Supabase se expenses fetch karo
  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load expenses");
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ✅ Supabase mein expense save karo
  const onSubmit = async (data: ExpenseForm) => {
    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Please login first");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("expenses").insert({
      user_id: userData.user.id,
      description: data.description,
      amount: parseInt(data.amount),
      category: data.category,
      date: data.date,
      payment_method: data.paymentMethod,
      notes: data.notes || "",
      recurring: data.recurring,
      status: "approved",
    });

    if (error) {
      toast.error("Failed to add expense: " + error.message);
    } else {
      toast.success(`✅ PKR ${parseInt(data.amount).toLocaleString()} expense added!`);
      reset();
      setDialogOpen(false);
      fetchExpenses(); // list refresh karo
    }
    setSubmitting(false);
  };

  // ✅ Supabase se expense delete karo
  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete expense");
    } else {
      toast.success("Expense deleted");
      setExpenses(expenses.filter((e) => e.id !== id));
    }
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
                <input type="checkbox" id="recurring" {...register("recurring")} className="w-4 h-4 accent-primary" />
                <Label htmlFor="recurring" className="cursor-pointer">Recurring payment</Label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Add Expense"}
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
          { label: "Total Records", value: `${expenses.length} entries`, color: "text-orange-500" },
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

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="ml-2 text-sm text-muted-foreground">Loading expenses...</span>
              </div>
            )}

            {!loading && (
              <>
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
                          <td className="px-4 py-3 text-sm text-muted-foreground">{expense.payment_method}</td>
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

                {/* Mobile */}
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
                        <button onClick={() => deleteExpense(expense.id)} className="text-xs text-destructive mt-1">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                {filtered.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Receipt className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="font-medium text-muted-foreground">No expenses found</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Add your first expense!</p>
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
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}