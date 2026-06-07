"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2, User, Settings2, Bell, Shield, Save,
  Upload, Moon, Sun, Globe, DollarSign, Check, Loader2,
  Eye, EyeOff, X, AlertCircle, Smartphone, LogOut,
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
import { supabase } from "@/lib/supabase";
import { uploadLogo, deleteLogo } from "@/lib/storage";
import {
  validatePhone,
  validateWebsite,
  validateCompanyName,
  validatePasswordStrength,
  validateEmail,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  getPasswordStrengthBg,
} from "@/lib/validation";

const tabs = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Settings2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

const DEFAULT_NOTIFS = {
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
};

interface ValidationErrors {
  [key: string]: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Company state
  const [company, setCompany] = useState({
    company_name: "",
    phone: "",
    website: "",
    address: "",
    logo_url: "",
  });

  // Profile state
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    bio: "",
  });

  // Preferences state
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState("PKR");
  const [language, setLanguage] = useState("en");

  // Notifications state
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFS);

  // Security state
  const [resetLoading, setResetLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  // Load settings from database
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to access settings");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setAuthEmail(user.email || null);

      // Load profile data
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
        setLoading(false);
        return;
      }

      if (data) {
        const names = (data.full_name || "").split(" ");

        setCompany({
          company_name: data.company_name || "",
          phone: data.phone || "",
          website: data.website || "",
          address: data.address || "",
          logo_url: data.logo_url || "",
        });

        setProfile({
          first_name: data.first_name || names[0] || "",
          last_name: data.last_name || names.slice(1).join(" ") || "",
          full_name: data.full_name || "",
          bio: data.bio || "",
        });

        setDarkMode(data.dark_mode || false);
        setCurrency(data.currency || "PKR");
        setLanguage(data.language || "en");

        if (data.notification_prefs && typeof data.notification_prefs === "object") {
          setNotifications({ ...DEFAULT_NOTIFS, ...data.notification_prefs });
        }
      }
    } catch (error) {
      console.error("Error in loadSettings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Save all settings
  const saveProfile = async (extra: Record<string, unknown> = {}) => {
    if (!userId) {
      toast.error("Please log in first");
      return;
    }

    setSaving(true);
    const errors: ValidationErrors = {};

    // Validate company name
    const nameValidation = validateCompanyName(company.company_name);
    if (!nameValidation.valid) {
      errors.company_name = nameValidation.error || "";
    }

    // Validate phone if provided
    if (company.phone) {
      const phoneValidation = validatePhone(company.phone);
      if (!phoneValidation.valid) {
        errors.phone = phoneValidation.error || "";
      }
    }

    // Validate website if provided
    if (company.website) {
      const websiteValidation = validateWebsite(company.website);
      if (!websiteValidation.valid) {
        errors.website = websiteValidation.error || "";
      }
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setSaving(false);
      toast.error("Please fix validation errors");
      return;
    }

    const fullName = `${profile.first_name} ${profile.last_name}`.trim() || profile.full_name;

    const { error } = await supabase.from("profiles").update({
      company_name: company.company_name,
      phone: company.phone,
      website: company.website,
      address: company.address,
      first_name: profile.first_name,
      last_name: profile.last_name,
      full_name: fullName,
      bio: profile.bio,
      currency,
      language,
      dark_mode: darkMode,
      notification_prefs: notifications,
      ...extra,
    }).eq("id", userId);

    if (error) {
      toast.error(`Failed to save: ${error.message}`);
    } else {
      toast.success("Settings saved successfully!");
    }

    setSaving(false);
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setLogoUploading(true);

    try {
      const result = await uploadLogo(file, userId);

      if (!result.success) {
        toast.error(result.error || "Upload failed");
        return;
      }

      setCompany((prev) => ({
        ...prev,
        logo_url: result.url || "",
      }));

      // Save logo URL to database
      const { error } = await supabase.from("profiles").update({
        logo_url: result.url,
      }).eq("id", userId);

      if (error) {
        toast.error(`Failed to save logo: ${error.message}`);
        return;
      }

      toast.success("Logo uploaded successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setLogoUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  // Remove logo
  const handleRemoveLogo = async () => {
    if (!company.logo_url || !userId) return;

    setLogoUploading(true);

    try {
      const result = await deleteLogo(company.logo_url, userId);

      if (!result.success) {
        toast.error(result.error || "Failed to remove logo");
        return;
      }

      setCompany((prev) => ({
        ...prev,
        logo_url: "",
      }));

      // Update database
      const { error } = await supabase.from("profiles").update({
        logo_url: null,
      }).eq("id", userId);

      if (error) {
        toast.error(`Failed to update: ${error.message}`);
        return;
      }

      toast.success("Logo removed successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove";
      toast.error(message);
    } finally {
      setLogoUploading(false);
    }
  };

  // Send password reset email
  const handleSendResetEmail = async () => {
    if (!authEmail) {
      toast.error("Email not found");
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Password reset link sent to ${authEmail}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  // Toggle notification
  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Logout all devices
  const handleLogoutAllDevices = async () => {
    if (
      !confirm(
        "Are you sure you want to log out from all devices? You will need to log in again."
      )
    ) {
      return;
    }

    try {
      await supabase.auth.signOut({ scope: "global" });
      toast.success("Logged out from all devices");
      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to logout";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-sm text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  const initials =
    (profile.first_name[0] || "A") + (profile.last_name[0] || "O");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and preferences
        </p>
      </motion.div>

      <div className="flex gap-6">
        <aside className="w-52 shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setValidationErrors({});
                  }}
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

        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* ═══ COMPANY TAB ═══ */}
            {activeTab === "company" && (
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>
                    Your agency&apos;s public information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Logo Section */}
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt="Company logo"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-10 w-10 text-indigo-600" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="logo-input">
                        <Button
                          asChild
                          variant="outline"
                          className="gap-2 cursor-pointer"
                          disabled={logoUploading}
                        >
                          <span>
                            {logoUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            {logoUploading ? "Uploading..." : "Upload Logo"}
                          </span>
                        </Button>
                      </label>
                      <input
                        id="logo-input"
                        type="file"
                        accept="image/jpeg,image/png,image/svg+xml,image/webp"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                        className="hidden"
                      />
                      {company.logo_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-red-600 hover:text-red-700"
                          onClick={handleRemoveLogo}
                          disabled={logoUploading}
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Company Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <div>
                        <Input
                          value={company.company_name}
                          onChange={(e) => {
                            setCompany({
                              ...company,
                              company_name: e.target.value,
                            });
                            if (validationErrors.company_name) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.company_name;
                                return newErrors;
                              });
                            }
                          }}
                          className={validationErrors.company_name ? "border-red-500" : ""}
                        />
                        {validationErrors.company_name && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.company_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Business Email</Label>
                      <Input
                        type="email"
                        value={authEmail || ""}
                        disabled
                        className="bg-muted cursor-not-allowed"
                        title="This email is synced from your Supabase account and cannot be changed here"
                      />
                      <p className="text-xs text-muted-foreground">
                        Synced from your account
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <div>
                        <Input
                          value={company.phone}
                          placeholder="+1 (555) 000-0000"
                          onChange={(e) => {
                            setCompany({
                              ...company,
                              phone: e.target.value,
                            });
                            if (validationErrors.phone) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.phone;
                                return newErrors;
                              });
                            }
                          }}
                          className={validationErrors.phone ? "border-red-500" : ""}
                        />
                        {validationErrors.phone && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div>
                        <Input
                          value={company.website}
                          placeholder="https://youragency.com"
                          onChange={(e) => {
                            setCompany({
                              ...company,
                              website: e.target.value,
                            });
                            if (validationErrors.website) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.website;
                                return newErrors;
                              });
                            }
                          }}
                          className={validationErrors.website ? "border-red-500" : ""}
                        />
                        {validationErrors.website && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {validationErrors.website}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={company.address}
                        placeholder="123 Business Street, City, Country"
                        onChange={(e) =>
                          setCompany({ ...company, address: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveProfile()}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ PROFILE TAB ═══ */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>Personal account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium">
                        {profile.first_name} {profile.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{authEmail}</p>
                      <Badge className="mt-1 text-xs bg-purple-100 text-purple-700 border-0">
                        Owner
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={profile.first_name}
                        onChange={(e) =>
                          setProfile({ ...profile, first_name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={profile.last_name}
                        onChange={(e) =>
                          setProfile({ ...profile, last_name: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Email (Account Email)</Label>
                      <Input
                        type="email"
                        value={authEmail || ""}
                        disabled
                        className="bg-muted cursor-not-allowed"
                        title="To change your email, use the Supabase dashboard"
                      />
                      <p className="text-xs text-muted-foreground">
                        Managed by your Supabase account
                      </p>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Bio</Label>
                      <Input
                        value={profile.bio}
                        placeholder="Brief bio or title"
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveProfile()}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ PREFERENCES TAB ═══ */}
            {activeTab === "preferences" && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Customize your dashboard experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {darkMode ? (
                        <Moon className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Sun className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">Dark Mode</p>
                        <p className="text-xs text-muted-foreground">
                          Switch between light and dark theme
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Currency</p>
                        <p className="text-xs text-muted-foreground">
                          Default currency for expenses
                        </p>
                      </div>
                    </div>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["PKR", "USD", "EUR", "GBP", "AED"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Language</p>
                        <p className="text-xs text-muted-foreground">
                          Dashboard display language
                        </p>
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
                    <Button
                      onClick={() => saveProfile()}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ NOTIFICATIONS TAB ═══ */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Choose what alerts you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-indigo-500" /> Email
                      Notifications
                    </p>
                    <div className="space-y-4">
                      {[
                        {
                          key: "emailExpense",
                          label: "New expense added",
                          desc: "When a team member adds an expense",
                        },
                        {
                          key: "emailReport",
                          label: "Monthly report ready",
                          desc: "Monthly financial report via email",
                        },
                        {
                          key: "emailInvite",
                          label: "Team invitations",
                          desc: "Alerts for new team member invites",
                        },
                        {
                          key: "weeklyDigest",
                          label: "Weekly digest",
                          desc: "Summary every Monday",
                        },
                        {
                          key: "monthlyReport",
                          label: "Monthly summary",
                          desc: "Full breakdown on 1st of month",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.desc}
                            </p>
                          </div>
                          <Switch
                            checked={
                              notifications[
                                item.key as keyof typeof notifications
                              ]
                            }
                            onCheckedChange={() =>
                              toggleNotif(item.key as keyof typeof notifications)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-purple-500" /> Push
                      Notifications
                    </p>
                    <div className="space-y-4">
                      {[
                        {
                          key: "pushExpense",
                          label: "Expense alerts",
                          desc: "Real-time push when expenses are logged",
                        },
                        {
                          key: "pushReport",
                          label: "Report generated",
                          desc: "When a new report is available",
                        },
                        {
                          key: "pushPayment",
                          label: "Payment due",
                          desc: "Reminders for pending payments",
                        },
                        {
                          key: "budgetAlert",
                          label: "Budget exceeded",
                          desc: "When monthly budget limit is hit",
                        },
                        {
                          key: "teamActivity",
                          label: "Team activity",
                          desc: "Updates when team members make changes",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.desc}
                            </p>
                          </div>
                          <Switch
                            checked={
                              notifications[
                                item.key as keyof typeof notifications
                              ]
                            }
                            onCheckedChange={() =>
                              toggleNotif(item.key as keyof typeof notifications)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveProfile()}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save Notifications
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ SECURITY TAB ═══ */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Password Reset Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Password Reset
                    </CardTitle>
                    <CardDescription>
                      Securely update your password
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <p className="text-sm text-muted-foreground">
                      For security, we&apos;ll send a password reset link to{" "}
                      <span className="font-semibold text-foreground">
                        {authEmail}
                      </span>
                      . Click the link to set a new password.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-300">
                        ℹ️ Password resets are verified through your email to ensure
                        account security.
                      </p>
                    </div>

                    <Button
                      onClick={handleSendResetEmail}
                      disabled={resetLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    >
                      {resetLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {resetLoading
                        ? "Sending..."
                        : "Send Password Reset Link"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Active Sessions
                    </CardTitle>
                    <CardDescription>
                      Manage your login sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">Current Device</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {navigator.userAgent.includes("Chrome")
                              ? "Chrome Browser"
                              : navigator.userAgent.includes("Firefox")
                                ? "Firefox Browser"
                                : navigator.userAgent.includes("Safari")
                                  ? "Safari Browser"
                                  : "Unknown Browser"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last active: Just now
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-0">
                          Active
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      You have 1 active session. Sessions older than 30 days will be
                      automatically logged out for security.
                    </p>
                  </CardContent>
                </Card>

                {/* Logout All Devices */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">
                      Logout All Devices
                    </CardTitle>
                    <CardDescription>
                      End all sessions on other devices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <p className="text-sm text-muted-foreground">
                      This will log you out of all sessions across all devices.
                      You&apos;ll need to log in again on other devices.
                    </p>
                    <Button
                      onClick={handleLogoutAllDevices}
                      variant="destructive"
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout All Devices
                    </Button>
                  </CardContent>
                </Card>

                {/* Two Factor Authentication */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🔐 Two-Factor Authentication
                    </CardTitle>
                    <CardDescription>
                      Add an extra layer of security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Two-factor authentication adds an extra security layer to your
                        account. In addition to your password, you&apos;ll need to enter
                        a code from an authenticator app.
                      </p>
                      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                        <p className="text-sm text-amber-900 dark:text-amber-300">
                          ⏳ Coming soon - Two-factor authentication is currently being
                          developed. Stay tuned for enhanced security options.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
