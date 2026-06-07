"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Trash2, Edit, Mail, Phone, Building2,
  Loader2, CheckCircle2, DollarSign, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  revenue: number;
  projects: number;
};

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2}
      viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  );
}

export default function ClientsPage() {
  const [clients, setClients]       = useState<Client[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch]         = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
    status: "active", revenue: "", projects: "",
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("clients").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load clients"); }
    else { setClients(data || []); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const resetForm = () => {
    setForm({ name: "", company: "", email: "", phone: "", status: "active", revenue: "", projects: "" });
    setEditClient(null);
  };

  const openEdit = (client: Client) => {
    setEditClient(client);
    setForm({
      name: client.name, company: client.company, email: client.email,
      phone: client.phone, status: client.status,
      revenue: String(client.revenue), projects: String(client.projects),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error("Name and email required!"); return; }
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please login first"); setSubmitting(false); return; }

    const payload = {
      user_id:  user.id,
      name:     form.name,
      company:  form.company,
      email:    form.email,
      phone:    form.phone,
      status:   form.status,
      revenue:  Number(form.revenue) || 0,
      projects: Number(form.projects) || 0,
    };

    if (editClient) {
      const { error } = await supabase.from("clients").update(payload).eq("id", editClient.id);
      if (error) { toast.error("Failed to update: " + error.message); }
      else {
        toast.success("Client updated!");
        await createNotification(user.id, "✏️ Client Updated", `${form.name} details updated`, "info");
      }
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) { toast.error("Failed to add: " + error.message); }
      else {
        toast.success(`✅ ${form.name} added!`);
        // ── Real notification ───────────────────────────────────────
        await createNotification(
          user.id,
          "👤 Client Added",
          `${form.name}${form.company ? " from " + form.company : ""} added successfully`,
          "success"
        );
      }
    }

    setSubmitting(false);
    setDialogOpen(false);
    resetForm();
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); }
    else {
      toast.success("Client removed");
      setClients(clients.filter(c => c.id !== id));
      if (user) {
        await createNotification(user.id, "🗑️ Client Removed", "A client was deleted", "warning");
      }
    }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );
  const totalRevenue  = clients.reduce((s, c) => s + (c.revenue || 0), 0);
  const activeClients = clients.filter(c => c.status === "active").length;
  const avgRevenue    = clients.length > 0 ? Math.round(totalRevenue / clients.length) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your client relationships & revenue</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editClient ? "Edit Client" : "Add New Client"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input placeholder="Ahmed Raza" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input placeholder="DigitalEdge" value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="ahmed@agency.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+92 300 0000000" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Revenue (PKR)</Label>
                  <Input type="number" placeholder="250000" value={form.revenue}
                    onChange={(e) => setForm({ ...form, revenue: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Projects</Label>
                  <Input type="number" placeholder="3" value={form.projects}
                    onChange={(e) => setForm({ ...form, projects: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1"
                  onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleSave}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editClient ? "Update" : "Add Client"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Clients",  value: loading ? "—" : `${clients.length}`,                   color:"text-blue-500",   icon:Users        },
          { label:"Active",         value: loading ? "—" : `${activeClients}`,                     color:"text-green-500",  icon:CheckCircle2 },
          { label:"Total Revenue",  value: loading ? "—" : `PKR ${totalRevenue.toLocaleString()}`, color:"text-purple-500", icon:DollarSign   },
          { label:"Avg Revenue",    value: loading ? "—" : `PKR ${avgRevenue.toLocaleString()}`,   color:"text-orange-500", icon:TrendingUp   },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search clients..." className="pl-9" value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-sm text-muted-foreground">Loading clients...</span>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client, i) => (
            <motion.div key={client.id}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-indigo-600 font-bold text-sm">
                          {client.name.slice(0,2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.company}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${
                      client.status === "active" ? "bg-green-100 text-green-700 border-0"
                      : client.status === "lead" ? "bg-blue-100 text-blue-700 border-0"
                      : "bg-gray-100 text-gray-600 border-0"
                    }`}>{client.status}</Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />{client.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-sm font-semibold text-green-500">PKR {(client.revenue||0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Projects</p>
                      <p className="text-sm font-semibold">{client.projects||0}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="w-7 h-7 p-0" onClick={() => openEdit(client)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(client.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No clients found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search ? "Try a different search" : "Add your first client!"}
          </p>
        </div>
      )}
    </div>
  );
}