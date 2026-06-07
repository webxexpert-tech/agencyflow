"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Download, Eye, Trash2, FileText,
  CheckCircle2, Clock, XCircle, Send, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

type InvoiceItem = { desc: string; qty: number; price: number };

type Invoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  status: string;
  invoice_date: string;
  due_date: string;
  items: InvoiceItem[];
};

const statusColors: Record<string, string> = {
  Paid: "bg-green-100 text-green-700 border-0",
  Pending: "bg-yellow-100 text-yellow-700 border-0",
  Overdue: "bg-red-100 text-red-700 border-0",
  Draft: "bg-gray-100 text-gray-600 border-0",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  Paid: CheckCircle2,
  Pending: Clock,
  Overdue: XCircle,
  Draft: FileText,
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState({
    client: "", email: "", dueDate: "", status: "Pending",
    items: [{ desc: "", qty: 1, price: 0 }] as InvoiceItem[],
  });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load invoices");
    else setInvoices((data as Invoice[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filtered = invoices.filter(inv =>
    inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const paidAmount = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + Number(i.amount), 0);
  const pendingAmount = invoices.filter(i => i.status === "Pending").reduce((s, i) => s + Number(i.amount), 0);
  const overdueAmount = invoices.filter(i => i.status === "Overdue").reduce((s, i) => s + Number(i.amount), 0);

  const addItem = () => setForm({ ...form, items: [...form.items, { desc: "", qty: 1, price: 0 }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({ ...form, items });
  };

  const totalFormAmount = form.items.reduce((s, i) => s + (i.qty * i.price), 0);

  const handleCreate = async () => {
    if (!form.client || !form.email) return toast.error("Client name and email required!");

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please login first"); setSubmitting(false); return; }

    const invoiceNumber = `INV-${String(invoices.length + 1).padStart(3, "0")}`;
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("invoices").insert({
      user_id: user.id,
      invoice_number: invoiceNumber,
      client_name: form.client,
      client_email: form.email,
      amount: totalFormAmount,
      status: form.status,
      invoice_date: today,
      due_date: form.dueDate || today,
      items: form.items,
    });

    if (error) {
      toast.error("Failed to create invoice: " + error.message);
    } else {
      toast.success(`Invoice ${invoiceNumber} created!`);
      await createNotification(user.id, "📄 Invoice Created", `${invoiceNumber} for ${form.client}`, "payment");
      setForm({ client: "", email: "", dueDate: "", status: "Pending", items: [{ desc: "", qty: 1, price: 0 }] });
      setDialogOpen(false);
      fetchInvoices();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) toast.error("Failed to delete invoice");
    else {
      toast.success("Invoice deleted");
      setInvoices(invoices.filter(i => i.id !== id));
      if (user) await createNotification(user.id, "🗑️ Invoice Deleted", "An invoice was removed", "warning");
    }
  };

  const handlePrint = (inv: Invoice) => {
    setPreviewInvoice(inv);
    setPreviewOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage client invoices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Client Name</Label>
                  <Input placeholder="Zenith Academy"
                    value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Client Email</Label>
                  <Input type="email" placeholder="client@company.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Invoice Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 text-xs">
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-5 text-xs" placeholder="Service description"
                      value={item.desc} onChange={(e) => updateItem(i, "desc", e.target.value)} />
                    <Input className="col-span-2 text-xs" type="number" placeholder="Qty"
                      value={item.qty} onChange={(e) => updateItem(i, "qty", parseInt(e.target.value) || 1)} />
                    <Input className="col-span-3 text-xs" type="number" placeholder="Price"
                      value={item.price} onChange={(e) => updateItem(i, "price", parseInt(e.target.value) || 0)} />
                    <Button type="button" variant="ghost" size="icon" className="col-span-2 h-8 w-8 text-red-500"
                      onClick={() => removeItem(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-end">
                  <p className="text-sm font-bold">Total: PKR {totalFormAmount.toLocaleString()}</p>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Create Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced", value: `PKR ${(totalAmount/1000).toFixed(0)}k`, color: "text-indigo-600", bg: "bg-indigo-50", icon: FileText },
          { label: "Paid", value: `PKR ${(paidAmount/1000).toFixed(0)}k`, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
          { label: "Pending", value: `PKR ${(pendingAmount/1000).toFixed(0)}k`, color: "text-yellow-600", bg: "bg-yellow-50", icon: Clock },
          { label: "Overdue", value: `PKR ${(overdueAmount/1000).toFixed(0)}k`, color: "text-red-600", bg: "bg-red-50", icon: XCircle },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search invoices..." className="pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Invoice", "Client", "Amount", "Date", "Due Date", "Status", "Actions"].map((h, i) => (
                      <th key={i} className={`text-xs font-medium text-muted-foreground px-4 py-3 ${i >= 5 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, i) => {
                    const StatusIcon = statusIcons[inv.status] || FileText;
                    return (
                      <motion.tr key={inv.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium">{inv.invoice_number}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{inv.client_name}</p>
                          <p className="text-xs text-muted-foreground">{inv.client_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-indigo-600">
                            PKR {Number(inv.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{inv.invoice_date}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{inv.due_date}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge className={`text-xs ${statusColors[inv.status]}`}>
                            <StatusIcon className="h-3 w-3 mr-1 inline" />
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePrint(inv)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePrint(inv)}>
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                              onClick={() => handleDelete(inv.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No invoices found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Invoice Preview</DialogTitle></DialogHeader>
          {previewInvoice && (
            <div className="space-y-6 p-4 border border-border rounded-lg print-invoice">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">A</div>
                    <span className="font-bold text-lg">AgencyFlow</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Hyderabad, Sindh, Pakistan</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{previewInvoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">Date: {previewInvoice.invoice_date}</p>
                  <p className="text-sm text-muted-foreground">Due: {previewInvoice.due_date}</p>
                  <Badge className={`mt-1 text-xs ${statusColors[previewInvoice.status]}`}>
                    {previewInvoice.status}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Bill To</p>
                <p className="font-semibold">{previewInvoice.client_name}</p>
                <p className="text-sm text-muted-foreground">{previewInvoice.client_email}</p>
              </div>
              <Separator />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
                    <th className="text-center py-2 text-muted-foreground font-medium">Qty</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Price</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewInvoice.items || []).map((item, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2">{item.desc}</td>
                      <td className="py-2 text-center">{item.qty}</td>
                      <td className="py-2 text-right">PKR {item.price.toLocaleString()}</td>
                      <td className="py-2 text-right font-medium">PKR {(item.qty * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end">
                <div className="font-bold text-lg">
                  Total: <span className="text-indigo-600">PKR {Number(previewInvoice.amount).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => window.print()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Download className="h-4 w-4" /> Download / Print
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Send className="h-4 w-4" /> Send to Client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
