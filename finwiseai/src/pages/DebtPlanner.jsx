import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { CreditCard, TrendingDown, Plus, Trash2, Brain, Loader2, Info, AlertTriangle, Target, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const CATEGORIES = [
  { value: "credit_card", label: "Credit Card", icon: "💳", color: "text-red-500" },
  { value: "personal_loan", label: "Personal Loan", icon: "🏦", color: "text-blue-500" },
  { value: "education_loan", label: "Education Loan", icon: "🎓", color: "text-purple-500" },
  { value: "home_loan", label: "Home Loan", icon: "🏠", color: "text-green-500" },
  { value: "car_loan", label: "Car Loan", icon: "🚗", color: "text-amber-500" },
  { value: "business_loan", label: "Business Loan", icon: "💼", color: "text-cyan-500" },
  { value: "other", label: "Other", icon: "📄", color: "text-muted-foreground" },
];

const INTEREST_TYPES = [
  { value: "reducing_balance", label: "Reducing Balance (EMI)" },
  { value: "compound_monthly", label: "Compound Monthly" },
  { value: "compound_daily", label: "Compound Daily (Credit Card)" },
  { value: "simple", label: "Simple Interest" },
];

function getCategoryInfo(cat) {
  return CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];
}

function calcMonthlyInterest(debt) {
  const monthlyRate = debt.interestRate / 12 / 100;
  if (debt.interestType === 'compound_daily') {
    const dailyRate = debt.interestRate / 365 / 100;
    return debt.remainingAmount * (Math.pow(1 + dailyRate, 30) - 1);
  }
  if (debt.interestType === 'compound_monthly' || debt.interestType === 'reducing_balance') {
    return debt.remainingAmount * monthlyRate;
  }
  return (debt.remainingAmount * debt.interestRate / 100) / 12;
}

// Estimate months to payoff given remaining, rate, and monthly payment
function estimateMonthsToPayoff(remaining, annualRate, monthlyPayment) {
  if (monthlyPayment <= 0 || remaining <= 0) return Infinity;
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return Math.ceil(remaining / monthlyPayment);
  const interestPerMonth = remaining * monthlyRate;
  if (monthlyPayment <= interestPerMonth) return Infinity; // Never pays off
  const months = Math.log(monthlyPayment / (monthlyPayment - remaining * monthlyRate)) / Math.log(1 + monthlyRate);
  return Math.ceil(months);
}

export default function DebtPlanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", category: "other", principalAmount: "",
    remainingAmount: "", interestRate: "", interestType: "reducing_balance",
    emiAmount: "", reason: "", dueDate: "",
  });

  // Fetch debts
  const { data: debts = [], isLoading } = useQuery({
    queryKey: ["debts", user?.uid],
    queryFn: async () => {
      const r = await fetch(`${API_URL}/api/debts?uid=${user.uid}`);
      return r.json();
    },
    enabled: !!user?.uid,
  });

  // Add debt
  const addDebt = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_URL}/api/debts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          name: form.name,
          category: form.category,
          principalAmount: Number(form.principalAmount),
          remainingAmount: Number(form.remainingAmount || form.principalAmount),
          interestRate: Number(form.interestRate),
          interestType: form.interestType,
          emiAmount: Number(form.emiAmount) || 0,
          reason: form.reason,
          dueDate: form.dueDate || undefined,
        }),
      });
      if (!r.ok) throw new Error("Failed to add debt");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["debts"]);
      setAddOpen(false);
      setForm({ name: "", category: "other", principalAmount: "", remainingAmount: "", interestRate: "", interestType: "reducing_balance", emiAmount: "", reason: "", dueDate: "" });
      toast.success("Debt added successfully!");
    },
    onError: () => toast.error("Failed to add debt"),
  });

  // Delete debt
  const deleteDebt = useMutation({
    mutationFn: async (id) => {
      await fetch(`${API_URL}/api/debts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["debts"]);
      toast.success("Debt removed");
    },
  });

  // AI Advice
  const fetchAIAdvice = async () => {
    setAiLoading(true);
    setShowAdvice(true);
    try {
      const r = await fetch(`${API_URL}/api/debts/ai-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setAiAdvice(data.response);
    } catch (err) {
      setAiAdvice("❌ Failed to get AI advice. Please check your Groq API key configuration.");
      toast.error("Failed to get AI advice");
    } finally {
      setAiLoading(false);
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    const totalDebt = debts.reduce((s, d) => s + d.remainingAmount, 0);
    const totalEMI = debts.reduce((s, d) => s + d.emiAmount, 0);
    const totalMonthlyInterest = debts.reduce((s, d) => s + calcMonthlyInterest(d), 0);

    // Highest interest debt
    const sorted = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const highestRateDebt = sorted[0] || null;

    // Estimate longest payoff
    let maxMonths = 0;
    debts.forEach(d => {
      const m = estimateMonthsToPayoff(d.remainingAmount, d.interestRate, d.emiAmount);
      if (m !== Infinity && m > maxMonths) maxMonths = m;
    });

    const debtFreeDate = maxMonths > 0 && maxMonths < 600
      ? new Date(Date.now() + maxMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
      : "—";

    return { totalDebt, totalEMI, totalMonthlyInterest, highestRateDebt, debtFreeDate, maxMonths };
  }, [debts]);

  const fmt = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  if (!user) return null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Debt Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">Track, manage, and strategize your debt payoff journey</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Debt
          </Button>
          {debts.length > 0 && (
            <Button variant="outline" onClick={fetchAIAdvice} disabled={aiLoading} className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
              <Brain className="h-4 w-4" /> {aiLoading ? "Analyzing..." : "AI Payoff Strategy"}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Debt" value={fmt(stats.totalDebt)} change={`${debts.length} active ${debts.length === 1 ? "loan" : "loans"}`} changeType={stats.totalDebt > 0 ? "negative" : "positive"} icon={CreditCard} />
        <MetricCard title="Monthly EMI" value={fmt(stats.totalEMI)} change={stats.totalMonthlyInterest > 0 ? `Interest: ${fmt(stats.totalMonthlyInterest)}/mo` : "No active EMIs"} changeType="neutral" icon={TrendingDown} />
        <MetricCard title="Highest Rate" value={stats.highestRateDebt ? `${stats.highestRateDebt.interestRate}%` : "—"} change={stats.highestRateDebt?.name || "No debts"} changeType={stats.highestRateDebt?.interestRate > 20 ? "negative" : "neutral"} icon={AlertTriangle} />
        <MetricCard title="Debt-Free Date" value={stats.debtFreeDate} change={stats.maxMonths > 0 && stats.maxMonths < 600 ? `~${stats.maxMonths} months away` : "Add EMIs to estimate"} changeType="positive" icon={Target} />
      </motion.div>

      {/* Empty State */}
      {debts.length === 0 && !isLoading && (
        <motion.div variants={item}>
          <Card className="p-10 glass-card text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-lg">No debts recorded</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Add your loans, credit card debts, and other liabilities to get AI-powered payoff strategies.
            </p>
            <Button onClick={() => setAddOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Your First Debt
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Active Debts List */}
      {debts.length > 0 && (
        <motion.div variants={item}>
          <Card className="p-5 glass-card">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Active Debts
            </h3>
            <div className="space-y-4">
              {[...debts].sort((a, b) => b.interestRate - a.interestRate).map((d) => {
                const catInfo = getCategoryInfo(d.category);
                const monthlyInterest = calcMonthlyInterest(d);
                const paidPct = d.principalAmount > 0 ? ((d.principalAmount - d.remainingAmount) / d.principalAmount) * 100 : 0;
                const monthsLeft = estimateMonthsToPayoff(d.remainingAmount, d.interestRate, d.emiAmount);
                const isDangerous = d.interestRate > 20;

                return (
                  <div key={d._id} className={`p-4 rounded-xl border transition-all hover:shadow-sm ${isDangerous ? "border-red-500/30 bg-red-500/5" : "border-border/50"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{catInfo.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{d.name}</h4>
                            {isDangerous && (
                              <Badge variant="destructive" className="text-[10px] gap-1">
                                <AlertTriangle className="h-2.5 w-2.5" /> High Interest
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {d.interestRate}% p.a. · {INTEREST_TYPES.find(t => t.value === d.interestType)?.label || d.interestType}
                          </p>
                          {d.reason && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">Reason: {d.reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-lg font-bold font-display">{fmt(d.remainingAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">of {fmt(d.principalAmount)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => deleteDebt.mutate(d._id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Paid: {fmt(d.principalAmount - d.remainingAmount)}</span>
                        <span>{paidPct.toFixed(0)}% done</span>
                      </div>
                      <Progress value={paidPct} className="h-2" />
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">EMI/Payment</p>
                        <p className="font-semibold text-sm">{d.emiAmount > 0 ? fmt(d.emiAmount) : "—"}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Interest</p>
                        <p className={`font-semibold text-sm ${isDangerous ? "text-red-500" : ""}`}>{fmt(monthlyInterest)}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Months Left</p>
                        <p className="font-semibold text-sm">{monthsLeft < 600 ? monthsLeft : "∞"}</p>
                      </div>
                    </div>

                    {/* Warning for compound daily */}
                    {d.interestType === "compound_daily" && (
                      <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-600 dark:text-red-400">
                          <strong>Compound Daily Interest!</strong> This debt grows much faster than regular loans. Effective annual rate is higher than the stated {d.interestRate}%. Prioritize paying this off.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* AI Advice Section */}
      <AnimatePresence>
        {showAdvice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card border-primary/20 overflow-hidden">
              <div className="p-5 border-b border-border/50 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">AI Debt Payoff Strategy</h3>
                    <p className="text-xs text-muted-foreground">Personalized analysis based on your actual debts & income</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchAIAdvice} disabled={aiLoading} className="gap-1">
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                    {aiLoading ? "Analyzing..." : "Refresh"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAdvice(false)}>✕</Button>
                </div>
              </div>
              <div className="p-5">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
                    <p className="font-medium">Analyzing your debt profile...</p>
                    <p className="text-sm mt-1">Calculating interest costs and optimal payoff order</p>
                  </div>
                ) : aiAdvice ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-strong:text-foreground prose-p:text-muted-foreground">
                    <ReactMarkdown>{aiAdvice}</ReactMarkdown>
                  </div>
                ) : null}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly Interest Summary (when debts exist) */}
      {debts.length > 0 && (
        <motion.div variants={item}>
          <div className="p-4 bg-muted/30 rounded-xl border border-dashed flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <strong>Monthly Interest Breakdown:</strong> You're paying approximately <strong className="text-foreground">{fmt(stats.totalMonthlyInterest)}</strong> per month
              just in interest. {stats.highestRateDebt && stats.highestRateDebt.interestRate > 15 && (
                <>Your <strong className="text-foreground">{stats.highestRateDebt.name}</strong> at {stats.highestRateDebt.interestRate}% is costing you the most. Click "AI Payoff Strategy" for a personalized plan.</>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Debt Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Debt</DialogTitle>
            <DialogDescription>Enter the details of your loan or debt obligation</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addDebt.mutate(); }} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Debt Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. SBI Education Loan" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => {
                  const newForm = {...form, category: v};
                  // Auto-set interest type for credit cards
                  if (v === "credit_card") newForm.interestType = "compound_daily";
                  setForm(newForm);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Interest Type</Label>
                <Select value={form.interestType} onValueChange={(v) => setForm({...form, interestType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTEREST_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Principal Amount (₹) *</Label>
                <Input type="number" value={form.principalAmount} onChange={(e) => setForm({...form, principalAmount: e.target.value})} placeholder="Original amount" required />
              </div>
              <div className="grid gap-2">
                <Label>Remaining Amount (₹) *</Label>
                <Input type="number" value={form.remainingAmount} onChange={(e) => setForm({...form, remainingAmount: e.target.value})} placeholder="Current outstanding" />
                <p className="text-[10px] text-muted-foreground">Leave blank to use principal</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Interest Rate (% p.a.) *</Label>
                <Input type="number" step="0.01" value={form.interestRate} onChange={(e) => setForm({...form, interestRate: e.target.value})} placeholder="e.g. 8.5" required />
              </div>
              <div className="grid gap-2">
                <Label>Monthly EMI/Payment (₹)</Label>
                <Input type="number" value={form.emiAmount} onChange={(e) => setForm({...form, emiAmount: e.target.value})} placeholder="e.g. 5000" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Reason / Purpose</Label>
              <Input value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} placeholder="e.g. College fees, Medical emergency, Shopping" />
            </div>

            <div className="grid gap-2">
              <Label>Expected Payoff Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} />
            </div>

            {form.principalAmount && form.interestRate && (
              <div className="p-3 rounded-lg bg-muted/30 border border-dashed">
                <p className="text-xs text-muted-foreground">
                  Monthly interest cost: <strong className="text-foreground">
                    {fmt(calcMonthlyInterest({
                      remainingAmount: Number(form.remainingAmount || form.principalAmount),
                      interestRate: Number(form.interestRate),
                      interestType: form.interestType,
                    }))}
                  </strong>
                </p>
                {form.emiAmount && Number(form.emiAmount) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimated payoff: <strong className="text-foreground">
                      ~{estimateMonthsToPayoff(
                        Number(form.remainingAmount || form.principalAmount),
                        Number(form.interestRate),
                        Number(form.emiAmount)
                      )} months
                    </strong>
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={addDebt.isPending}>
                {addDebt.isPending ? "Adding..." : "Add Debt"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
