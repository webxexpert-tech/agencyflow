"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Mail,
  Phone,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Client = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  revenue: number;
  projects: number;
};

const initialClients: Client[] = [
  { id: 1, name: "Ahmed Raza", company: "DigitalEdge Agency", email: "ahmed@digitaledge.pk", phone: "+92 300 1234567", status: "active", revenue: 250000, projects: 3 },
  { id: 2, name: "Sara Khan", company: "TechNest Studios", email: "sara@technest.pk", phone: "+92 321 9876543", status: "active", revenue: 180000, projects: 2 },
  { id: 3, name: "Bilal Mahmood", company: "GrowthLab PK", email: "bilal@growthlab.pk", phone: "+92 333 5551234", status: "inactive", revenue: 95000, projects: 1 },
  { id: 4, name: "Fatima Ali", company: "PixelCraft", email: "fatima@pixelcraft.pk", phone: "+92 345 7778899", status: "active", revenue: 320000, projects: 5 },
  { id: 5, name: "Usman Sheikh", company: "SocialBoost", email: "usman@socialboost.pk", phone: "+92 311 2223334", status: "active", revenue: 145000, projects: 2 },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
  });

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = clients.reduce((s, c) => s + c.revenue, 0);
  const activeClients = clients.filter(c => c.status === "active").length;

  const handleAdd = () => {
    if (!form.name || !form.email) {
      toast.error("Name and email required!");
      return;
    }
    const newClient: Client = {
      id: clients.length + 1,
      name: form.name,
      company: form.company,
      email: form.email,
      phone: form.phone,
      status: "active",
      revenue: 0,
      projects: 0,
    };
    setClients([newClient, ...clients]);
    toast.success(`Client ${form.name} added!`);
    setForm({ name: "", company: "", email: "", phone: "" });
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setClients(clients.filter(c => c.id !== id));
    toast.success("Client removed");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your client relationships
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Ahmed Raza"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  placeholder="DigitalEdge Agency"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="ahmed@agency.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+92 300 0000000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAdd}>
                  Add Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: clients.length, color: "text-blue-500" },
          { label: "Active", value: activeClients, color: "text-green-500" },
          { label: "Total Revenue", value: `PKR ${totalRevenue.toLocaleString()}`, color: "text-purple-500" },
          { label: "Avg Revenue", value: `PKR ${Math.round(totalRevenue / clients.length).toLocaleString()}`, color: "text-orange-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client, i) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">
                        {client.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.company}</p>
                    </div>
                  </div>
                  <Badge
                    variant={client.status === "active" ? "secondary" : "outline"}
                    className={`text-xs ${client.status === "active" ? "bg-green-100 text-green-700" : ""}`}
                  >
                    {client.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    {client.phone}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-sm font-semibold text-green-500">
                      PKR {client.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Projects</p>
                    <p className="text-sm font-semibold">{client.projects}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="w-7 h-7 p-0">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-7 h-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No clients found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Add your first client!</p>
        </div>
      )}
    </div>
  );
}