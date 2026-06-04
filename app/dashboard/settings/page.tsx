"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, User, Settings2, Bell, Shield, Save,
  Upload, Moon, Sun, Globe, DollarSign, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Settings2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState("PKR");
  const [language, setLanguage] = useState("en");

  const [notifications, setNotifications] = useState({
    emailExpense: true,
    emailReport: true,
    emailInvite: true,
    pushExpense: false,
    pushReport: true,
    pushPayment: true,
    weeklyDigest: true,
    monthlyReport: true,
    budgetAlert: true,
    teamActivity: false,
  });

  const handleSave = () => toast.success("Settings saved successfully!");

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and preferences
        </p>
      </motion.div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <aside className="w-52 shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>
        </aside>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >

            {/* ── COMPANY ── */}
            {activeTab === "company" && (
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>Your agency's public information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-indigo-600" />
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" /> Upload Logo
                    </Button>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input defaultValue="My Agency" />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Email</Label>
                      <Input defaultValue="owner@agency.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input defaultValue="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input defaultValue="https://youragency.com" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Address</Label>
                      <Input defaultValue="California, Washington, United States" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                      <Save className="h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Personal account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl font-bold text-indigo-700">
                      AO
                    </div>
                    <div>
                      <p className="font-medium">Agency Owner</p>
                      <p className="text-sm text-muted-foreground">owner@agency.com</p>
                      <Badge className="mt-1 text-xs bg-purple-100 text-purple-700 border-0">Owner</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input defaultValue="Agency" />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input defaultValue="Owner" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Email</Label>
                      <Input defaultValue="owner@agency.com" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Bio</Label>
                      <Input defaultValue="Running a digital marketing agency since 2026" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                      <Save className="h-4 w-4" /> Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── PREFERENCES ── */}
            {activeTab === "preferences" && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your dashboard experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dark Mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {darkMode ? <Moon className="h-5 w-5 text-indigo-500" /> : <Sun className="h-5 w-5 text-yellow-500" />}
                      <div>
                        <p className="font-medium text-sm">Dark Mode</p>
                        <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
                      </div>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  </div>
                  <Separator />
                  {/* Currency */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Currency</p>
                        <p className="text-xs text-muted-foreground">Default currency for expenses</p>
                      </div>
                    </div>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKR">PKR — ₨</SelectItem>
                        <SelectItem value="USD">USD — $</SelectItem>
                        <SelectItem value="EUR">EUR — €</SelectItem>
                        <SelectItem value="GBP">GBP — £</SelectItem>
                        <SelectItem value="AED">AED — د.إ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  {/* Language */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Language</p>
                        <p className="text-xs text-muted-foreground">Dashboard display language</p>
                      </div>
                    </div>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ur">اردو</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                      <Save className="h-4 w-4" /> Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Choose what alerts you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email */}
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-indigo-500" /> Email Notifications
                    </p>
                    <div className="space-y-4">
                      {[
                        { key: "emailExpense", label: "New expense added", desc: "Get notified when a team member adds an expense" },
                        { key: "emailReport", label: "Monthly report ready", desc: "Receive your monthly financial report via email" },
                        { key: "emailInvite", label: "Team invitations", desc: "Alerts for new team member invites" },
                        { key: "weeklyDigest", label: "Weekly digest", desc: "Summary of your agency's week every Monday" },
                        { key: "monthlyReport", label: "Monthly summary", desc: "Full financial breakdown on 1st of every month" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch
                            checked={notifications[item.key as keyof typeof notifications]}
                            onCheckedChange={() => toggleNotif(item.key as keyof typeof notifications)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  {/* Push */}
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-purple-500" /> Push Notifications
                    </p>
                    <div className="space-y-4">
                      {[
                        { key: "pushExpense", label: "Expense alerts", desc: "Real-time push when expenses are logged" },
                        { key: "pushReport", label: "Report generated", desc: "Notify when a new report is available" },
                        { key: "pushPayment", label: "Payment due", desc: "Reminders for pending payments" },
                        { key: "budgetAlert", label: "Budget exceeded", desc: "Alert when monthly budget limit is hit" },
                        { key: "teamActivity", label: "Team activity", desc: "Updates when team members make changes" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <Switch
                            checked={notifications[item.key as keyof typeof notifications]}
                            onCheckedChange={() => toggleNotif(item.key as keyof typeof notifications)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                      <Check className="h-4 w-4" /> Save Notifications
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your password and account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Add extra security to your account
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                      <Save className="h-4 w-4" /> Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}