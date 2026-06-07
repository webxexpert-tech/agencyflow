"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, User, Phone, Globe, Users, DollarSign,
  ChevronRight, ChevronLeft, Check, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface OnboardingModalProps {
  userId: string;
  onClose: () => void;
  onComplete: () => void;
}

const steps = [
  { id: 1, title: "Personal Info",    icon: User,      desc: "Tell us about yourself"          },
  { id: 2, title: "Business Details", icon: Building2, desc: "About your agency"               },
  { id: 3, title: "Preferences",      icon: DollarSign,desc: "Set your financial preferences"  },
];

// Calculate profile completion %
function calcPct(data: Record<string, string>) {
  const fields = ["full_name","phone","bio","company_name","industry","team_size","monthly_budget","currency"];
  const filled = fields.filter((f) => data[f] && data[f].toString().trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

export default function OnboardingModal({ userId, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name:      "",
    phone:          "",
    bio:            "",
    company_name:   "",
    industry:       "",
    team_size:      "",
    monthly_budget: "",
    currency:       "PKR",
    timezone:       "Asia/Karachi",
  });

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleComplete = async () => {
    setSaving(true);
    const pct = calcPct(form);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name:            form.full_name   || undefined,
        phone:                form.phone       || undefined,
        bio:                  form.bio         || undefined,
        company_name:         form.company_name|| undefined,
        industry:             form.industry    || undefined,
        team_size:            form.team_size   || undefined,
        monthly_budget:       Number(form.monthly_budget) || undefined,
        currency:             form.currency,
        timezone:             form.timezone,
        onboarding_completed: true,
        profile_completed_pct: pct,
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to save profile: " + error.message);
      setSaving(false);
      return;
    }

    // Create welcome notification
    await supabase.from("notifications").insert({
      user_id: userId,
      title:   "🎉 Welcome to AgencyFlow!",
      message: `Profile ${pct}% complete. ${pct < 100 ? "Add more details to reach 100%!" : "Your profile is complete!"}`,
      type:    "success",
      read:    false,
    });

    // If profile complete, add special notification
    if (pct >= 80) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title:   "✅ Profile Complete!",
        message: "All features are now unlocked. Start adding expenses and tracking revenue!",
        type:    "profile",
        read:    false,
      });
    }

    toast.success(`Profile saved! ${pct}% complete 🎉`);
    setSaving(false);
    onComplete();
  };

  const canProceed = () => {
    if (step === 1) return form.full_name.trim().length > 0;
    if (step === 2) return true; // optional
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity:0, scale:0.95, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.95, y:20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 px-6 pt-6 pb-8">
          <button onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-white font-bold text-lg">Complete Your Profile</span>
          </div>
          <p className="text-indigo-100 text-sm">
            Takes 2 minutes — unlock all AgencyFlow features!
          </p>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.id  ? "bg-green-400 text-white"
                  : step === s.id ? "bg-white text-indigo-600"
                  : "bg-white/30 text-white"
                }`}>
                  {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 w-8 rounded transition-all ${step > s.id ? "bg-green-400" : "bg-white/30"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                className="space-y-4">
                <div>
                  <p className="font-semibold text-sm mb-0.5">{steps[0].title}</p>
                  <p className="text-xs text-muted-foreground">{steps[0].desc}</p>
                </div>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input placeholder="Hasnain Sheikh" value={form.full_name}
                    onChange={(e) => update("full_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+92 300 0000000" value={form.phone}
                    onChange={(e) => update("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input placeholder="Digital marketing agency owner..." value={form.bio}
                    onChange={(e) => update("bio", e.target.value)} />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                className="space-y-4">
                <div>
                  <p className="font-semibold text-sm mb-0.5">{steps[1].title}</p>
                  <p className="text-xs text-muted-foreground">{steps[1].desc}</p>
                </div>
                <div className="space-y-2">
                  <Label>Company / Agency Name</Label>
                  <Input placeholder="WebX Expert" value={form.company_name}
                    onChange={(e) => update("company_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {["Digital Marketing","SEO Agency","Web Development","Graphic Design",
                        "Social Media","Content Agency","SaaS","E-commerce","Consulting","Other"
                      ].map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Team Size</Label>
                  <Select value={form.team_size} onValueChange={(v) => update("team_size", v)}>
                    <SelectTrigger><SelectValue placeholder="How many people?" /></SelectTrigger>
                    <SelectContent>
                      {["Just me","2-5","6-10","11-25","26-50","50+"].map((s) =>
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                className="space-y-4">
                <div>
                  <p className="font-semibold text-sm mb-0.5">{steps[2].title}</p>
                  <p className="text-xs text-muted-foreground">{steps[2].desc}</p>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Budget (approx)</Label>
                  <Input type="number" placeholder="500000" value={form.monthly_budget}
                    onChange={(e) => update("monthly_budget", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[
                        { value:"PKR", label:"🇵🇰 PKR — Pakistani Rupee" },
                        { value:"USD", label:"🇺🇸 USD — US Dollar"       },
                        { value:"EUR", label:"🇪🇺 EUR — Euro"            },
                        { value:"GBP", label:"🇬🇧 GBP — British Pound"   },
                        { value:"AED", label:"🇦🇪 AED — UAE Dirham"      },
                        { value:"SAR", label:"🇸🇦 SAR — Saudi Riyal"     },
                      ].map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={form.timezone} onValueChange={(v) => update("timezone", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[
                        "Asia/Karachi","Asia/Dubai","Asia/Riyadh","Europe/London",
                        "America/New_York","America/Los_Angeles","Asia/Kolkata",
                      ].map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview completion % */}
                <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Profile completion</span>
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{calcPct(form)}%</span>
                  </div>
                  <div className="w-full bg-indigo-100 dark:bg-indigo-900/50 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calcPct(form)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer buttons */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 1 ? (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Skip for now
            </Button>
          )}

          {step < 3 ? (
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!canProceed()}
              onClick={() => setStep(step + 1)}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={saving}
              onClick={handleComplete}
            >
              {saving ? "Saving..." : "Complete Setup 🎉"}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}