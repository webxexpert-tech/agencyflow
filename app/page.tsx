"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Zap,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  Star,
  ChevronDown,
  DollarSign,
  PieChart,
  Bell,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Quick Expense Add",
      desc: 'Type "5000 petrol" and AI detects amount, category instantly.',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Live Dashboard",
      desc: "Real-time charts showing burn rate, cash flow, and net profit.",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "ROI Tracking",
      desc: "Connect expenses to revenue. Know what's profitable.",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: "Smart Alerts",
      desc: "Get notified for overspending, due payments, and anomalies.",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Team & HR Roles",
      desc: "Owner, Manager, Accountant — with full permissions control.",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Multi-Currency",
      desc: "Support for PKR, USD, EUR and 50+ currencies.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Fraud Prevention",
      desc: "Edit logs, approval system, and expense verification built-in.",
    },
    {
      icon: <PieChart className="w-5 h-5" />,
      title: "Smart Reports",
      desc: "Export PDF/CSV reports filtered by day, month, or custom range.",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "$9",
      desc: "Perfect for freelancers and small teams",
      features: [
        "Up to 3 team members",
        "500 expenses/month",
        "Basic reports",
        "Email support",
        "2 integrations",
      ],
      cta: "Start Free",
      highlight: false,
    },
    {
      name: "Growth",
      price: "$29",
      desc: "For growing agencies and startups",
      features: [
        "Up to 15 team members",
        "Unlimited expenses",
        "Advanced reports + PDF export",
        "ROI tracking",
        "Priority support",
        "All integrations",
      ],
      cta: "Start Free Trial",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "$79",
      desc: "For large agencies and software houses",
      features: [
        "Unlimited team members",
        "Multi-company support",
        "Custom roles & permissions",
        "Dedicated account manager",
        "API access",
        "White-label option",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  const testimonials = [
    {
      name: "Ahmed Raza",
      role: "CEO, DigitalEdge Agency",
      text: "AgencyFlow changed how we manage finances. We saved 8 hours a week on expense tracking alone.",
      rating: 5,
    },
    {
      name: "Sara Khan",
      role: "Founder, TechNest Studios",
      text: "The quick add feature is insane. I just type the amount and it figures everything out automatically.",
      rating: 5,
    },
    {
      name: "Bilal Mahmood",
      role: "CFO, GrowthLab",
      text: "Finally a finance tool that's actually simple. Our whole team adopted it within a day.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: "Do I need accounting knowledge to use AgencyFlow?",
      a: "No. AgencyFlow is built for non-accountants. Just add your expenses and the dashboard does everything else.",
    },
    {
      q: "Can I use it on mobile?",
      a: "Yes, AgencyFlow is fully responsive and works perfectly on mobile, tablet, and desktop.",
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. We use Supabase with row-level security, encrypted storage, and regular backups.",
    },
    {
      q: "Can I export my reports?",
      a: "Yes. Export to PDF or CSV anytime, with custom date range filters.",
    },
    {
      q: "Do you support Pakistani Rupee (PKR)?",
      a: "Yes! PKR, USD, EUR, GBP and 50+ currencies are supported.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">AgencyFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-6 px-4 py-1.5 text-sm" variant="secondary">
                🚀 Built for Agency Owners
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
            >
              Track Expenses.
              <br />
              <span className="text-primary">Grow Smarter.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              AgencyFlow helps agency owners, startups, and software houses
              track daily expenses, monitor cash flow, and understand ROI —
              without depending on accountants.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/signup">
                <Button size="lg" className="px-8 h-12 text-base">
                  Start for Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                  View Demo Dashboard
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-5xl mx-auto mt-20"
        >
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-muted-foreground">agencyflow.app/dashboard</span>
            </div>
            <div className="p-6 bg-gradient-to-br from-primary/5 to-background">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Total Expenses", value: "PKR 2,45,000", color: "text-red-500" },
                  { label: "Net Profit", value: "PKR 1,80,000", color: "text-green-500" },
                  { label: "Burn Rate", value: "PKR 8,166/day", color: "text-yellow-500" },
                ].map((stat, i) => (
                  <div key={i} className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Monthly Expenses</span>
                  <Badge variant="secondary" className="text-xs">Live</Badge>
                </div>
                <div className="flex items-end gap-2 h-20">
                  {[40, 65, 45, 80, 55, 70, 60, 85, 50, 75, 90, 65].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-primary font-medium mb-3 text-sm uppercase tracking-wider">
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4">
              Everything you need to manage money
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              No complicated accounting. Just fast, clean, actionable financial insights.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-primary font-medium mb-3 text-sm uppercase tracking-wider">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4">
              Simple, honest pricing
            </motion.h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`rounded-2xl p-6 border ${
                  plan.highlight
                    ? "border-primary bg-primary text-white shadow-xl scale-105"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <Badge className="mb-4 bg-white text-primary text-xs">Most Popular</Badge>
                )}
                <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? "text-white" : ""}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>
                  {plan.desc}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : ""}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ml-1 ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>
                    /month
                  </span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-white" : "text-primary"}`} />
                      <span className={plan.highlight ? "text-white/90" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button
                    className={`w-full ${plan.highlight ? "bg-white text-primary hover:bg-white/90" : ""}`}
                    variant={plan.highlight ? "secondary" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-primary font-medium mb-3 text-sm uppercase tracking-wider">
              Testimonials
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold">
              Loved by agency owners
            </motion.h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4">
              Frequently Asked
            </motion.h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4">
            Ready to take control of your finances?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground mb-8 text-lg">
            Join hundreds of agency owners already using AgencyFlow.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/signup">
              <Button size="lg" className="px-10 h-12 text-base">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <DollarSign className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">AgencyFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2024 AgencyFlow. Built for agency owners.
          </p>
        </div>
      </footer>
    </div>
  );
}