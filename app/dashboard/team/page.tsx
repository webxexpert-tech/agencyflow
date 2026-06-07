"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Plus, Search, Mail, MoreHorizontal,
  Shield, User, Crown, Trash2, Edit2, Send, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

const roles = ["Owner", "Admin", "Member", "Viewer"];

const roleColors: Record<string, string> = {
  Owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Member: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const roleIcons: Record<string, typeof Crown> = {
  Owner: Crown, Admin: Shield, Member: User, Viewer: User,
};

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined_at: string;
};

function formatJoined(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true });

    if (error) {
      toast.error("Failed to load team");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      const ownerName = profile?.full_name || "Agency Owner";
      const ownerEmail = profile?.email || user.email || "";

      await supabase.from("team_members").insert({
        user_id: user.id,
        name: ownerName,
        email: ownerEmail,
        role: "Owner",
        status: "Active",
      });

      const { data: seeded } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: true });

      setMembers(seeded || []);
    } else {
      setMembers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail) return toast.error("Enter an email address");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Please login first");

    const name = inviteName || inviteEmail.split("@")[0];

    const { error } = await supabase.from("team_members").insert({
      user_id: user.id,
      name,
      email: inviteEmail,
      role: inviteRole,
      status: "Pending",
    });

    if (error) toast.error("Failed to invite: " + error.message);
    else {
      toast.success(`Invite sent to ${inviteEmail}`);
      await createNotification(user.id, "👥 Team Invite", `Invited ${inviteEmail} as ${inviteRole}`, "info");
      setInviteEmail("");
      setInviteName("");
      setDialogOpen(false);
      fetchMembers();
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) toast.error("Failed to remove member");
    else {
      toast.success("Member removed");
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    const { error } = await supabase.from("team_members").update({ role }).eq("id", id);
    if (error) toast.error("Failed to update role");
    else {
      toast.success("Role updated");
      setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your agency team members and permissions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name (optional)</Label>
                <Input placeholder="Sarah Khan" value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input placeholder="colleague@agency.com" value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.filter((r) => r !== "Owner").map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Send className="h-4 w-4" /> Send Invite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: members.length, icon: Users },
          { label: "Active", value: members.filter((m) => m.status === "Active").length, icon: User },
          { label: "Pending Invites", value: members.filter((m) => m.status === "Pending").length, icon: Mail },
          { label: "Admins", value: members.filter((m) => m.role === "Admin" || m.role === "Owner").length, icon: Shield },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                  <stat.icon className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Members</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search members..." className="pl-9 h-9" value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((member, i) => {
                const RoleIcon = roleIcons[member.role] || User;
                return (
                  <motion.div key={member.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                          {initials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 ${roleColors[member.role]}`}>
                        <RoleIcon className="h-3 w-3 mr-1 inline" />
                        {member.role}
                      </Badge>
                      <Badge variant="outline"
                        className={`text-xs ${member.status === "Active" ? "border-green-200 text-green-600" : "border-yellow-200 text-yellow-600"}`}>
                        {member.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        Joined {formatJoined(member.joined_at)}
                      </span>
                      {member.role !== "Owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {roles.filter((r) => r !== "Owner" && r !== member.role).map((r) => (
                              <DropdownMenuItem key={r} onClick={() => handleRoleChange(member.id, r)}>
                                <Edit2 className="h-3 w-3 mr-2" /> Make {r}
                              </DropdownMenuItem>
                            ))}
                            <Separator className="my-1" />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600"
                              onClick={() => handleRemove(member.id)}>
                              <Trash2 className="h-3 w-3 mr-2" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
