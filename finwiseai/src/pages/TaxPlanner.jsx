import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Calculator, IndianRupee, Info, Plus, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

// --- Tax Slab Constants (FY 2024-25 / AY 2025-26) ---
const NEW_SLABS = [
  { limit: 300000, rate: 0 },
  { limit: 700000, rate: 0.05 },
  { limit: 1000000, rate: 0.10 },
  { limit: 1200000, rate: 0.15 },
  { limit: 1500000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];
const OLD_SLABS = [
  { limit: 250000, rate: 0 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

export default function TaxPlanner() {
  const { user } = useAuth();
  
  // Fetch portfolio for ELSS detection
  const { data: portfolio = [] } = useQuery({
    queryKey: ["portfolio", user?.uid],
    queryFn: async () => {
      const r = await fetch(`${API_URL}/api/portfolio?uid=${user.uid}`);
      return r.json();
    },
    enabled: !!user?.uid,
  });

  // Calculate ELSS from portfolio (assuming name or symbol contains "ELSS" or "Tax")
  const elssValue = useMemo(() => {
    return portfolio.reduce((acc, h) => {
      if (h.name.toUpperCase().includes("ELSS") || h.name.toUpperCase().includes("TAX SAVER")) {
        return acc + (h.entryPrice * h.quantity);
      }
      return acc;
    }, 0);
  }, [portfolio]);

  const [sec80CManual, setSec80CManual] = useState(0);
  const sec80C = Math.max(Number(sec80CManual), elssValue);

  // States for interactive planning
  const [sec80D, setSec80D] = useState(0);
  const [hra, setHra] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);

  // Fetch real salary from SavingsGoal
  const { data: savingsData } = useQuery({
    queryKey: ["savings", user?.uid],
    queryFn: async () => {
      const r = await fetch(`${API_URL}/api/savings?uid=${user.uid}`);
      return r.json();
    },
    enabled: !!user?.uid,
  });

  const monthlySalary = savingsData?.monthlySalary || 0;
  const annualIncome = monthlySalary * 12;

  // --- Calculation Logic ---
  const calculation = useMemo(() => {
    const income = annualIncome;
    if (income === 0) return null;

    // 1. New Regime Calculation
    const stdDedNew = 75000;
    const taxableNew = Math.max(0, income - stdDedNew);
    let taxNew = 0;
    let prevLimit = 0;
    NEW_SLABS.forEach(slab => {
      const taxableInSlab = Math.min(Math.max(0, taxableNew - prevLimit), slab.limit - prevLimit);
      taxNew += taxableInSlab * slab.rate;
      prevLimit = slab.limit;
    });
    // Section 87A Rebate for New Regime (Up to 7L taxable)
    if (taxableNew <= 700000) taxNew = 0;
    const cessNew = taxNew * 0.04;
    const totalNew = taxNew + cessNew;

    // 2. Old Regime Calculation
    const stdDedOld = 50000;
    const totalDeductions = Math.min(150000, Number(sec80C)) + Number(sec80D) + Number(hra) + Number(otherDeductions) + stdDedOld;
    const taxableOld = Math.max(0, income - totalDeductions);
    let taxOld = 0;
    prevLimit = 0;
    OLD_SLABS.forEach(slab => {
      const taxableInSlab = Math.min(Math.max(0, taxableOld - prevLimit), slab.limit - prevLimit);
      taxOld += taxableInSlab * slab.rate;
      prevLimit = slab.limit;
    });
    // Section 87A Rebate for Old Regime (Up to 5L taxable)
    if (taxableOld <= 500000) taxOld = 0;
    const cessOld = taxOld * 0.04;
    const totalOld = taxOld + cessOld;

    return {
      annualIncome: income,
      new: { taxable: taxableNew, tax: taxNew, cess: cessNew, total: totalNew },
      old: { taxable: taxableOld, tax: taxOld, cess: cessOld, total: totalOld, deductions: totalDeductions },
      recommended: totalNew <= totalOld ? "New" : "Old",
      savings: Math.abs(totalNew - totalOld)
    };
  }, [annualIncome, sec80C, sec80D, hra, otherDeductions]);

  if (!user) return null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Smart Tax Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Based on your annual income of <span className="text-primary font-bold">₹{annualIncome.toLocaleString("en-IN")}</span>
          </p>
        </div>
        {calculation && (
          <Badge className="py-1 px-3 text-sm gap-2 bg-success/10 text-success border-success/20">
            Recommended: {calculation.recommended} Regime
          </Badge>
        )}
      </motion.div>

      {annualIncome === 0 ? (
        <motion.div variants={item}>
          <Card className="p-10 glass-card text-center text-muted-foreground">
            <Info className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-lg text-foreground">Set your salary first</p>
            <p className="text-sm mt-1">We need your income details to calculate taxes. Go to <strong>Expenses</strong> to set your salary.</p>
            <Button variant="outline" className="mt-4" onClick={() => (window.location.href = '/expenses')}>Set Salary</Button>
          </Card>
        </motion.div>
      ) : (
        <>
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Tax (Old Regime)" value={`₹${calculation?.old.total.toLocaleString("en-IN")}`} change={`Deductions: ₹${calculation?.old.deductions.toLocaleString("en-IN")}`} changeType="neutral" icon={Calculator} />
            <MetricCard title="Tax (New Regime)" value={`₹${calculation?.new.total.toLocaleString("en-IN")}`} change="Standard Ded: ₹75,000" changeType="neutral" icon={Calculator} />
            <MetricCard title="Potential Savings" value={`₹${calculation?.savings.toLocaleString("en-IN")}`} change={`By choosing ${calculation?.recommended}`} changeType="positive" icon={IndianRupee} />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Panel */}
            <motion.div variants={item} className="lg:col-span-1 space-y-4">
              <Card className="p-5 glass-card border-primary/20">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> Old Regime Deductions
                </h3>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-xs">Section 80C (EPF, ELSS, LIC...)</Label>
                    <div className="relative">
                      <Input type="number" value={sec80CManual} onChange={(e) => setSec80CManual(e.target.value)} placeholder="Limit: 1.5L" className="bg-muted/30 pr-12" />
                      {elssValue > 0 && <Badge className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-primary/20 text-primary border-none">Auto: ₹{elssValue.toLocaleString()}</Badge>}
                    </div>
                    <Progress value={(Math.min(150000, sec80C) / 150000) * 100} className="h-1" />
                    {elssValue > 0 && <p className="text-[10px] text-muted-foreground italic">Detected ₹{elssValue.toLocaleString()} in ELSS investments</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Section 80D (Health Insurance)</Label>
                    <Input type="number" value={sec80D} onChange={(e) => setSec80D(e.target.value)} placeholder="e.g. 25000" className="bg-muted/30" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">HRA (House Rent Allowance)</Label>
                    <Input type="number" value={hra} onChange={(e) => setHra(e.target.value)} placeholder="e.g. 100000" className="bg-muted/30" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs">Other Exemptions</Label>
                    <Input type="number" value={otherDeductions} onChange={(e) => setOtherDeductions(e.target.value)} placeholder="e.g. 50000" className="bg-muted/30" />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Comparison Details */}
            <motion.div variants={item} className="lg:col-span-2">
              <Card className="p-6 glass-card h-full">
                <h3 className="font-display font-semibold mb-6">Regime Detailed Comparison</h3>
                <div className="space-y-6">
                  {["old", "new"].map((regime) => {
                    const data = calculation[regime];
                    const isRec = calculation.recommended.toLowerCase() === regime;
                    return (
                      <div key={regime} className={`p-5 rounded-2xl border transition-all ${isRec ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : "border-border bg-muted/20"}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isRec ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              <Calculator className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold capitalize">{regime} Tax Regime</h4>
                              <p className="text-xs text-muted-foreground">For FY 2024-25 (AY 2025-26)</p>
                            </div>
                          </div>
                          {isRec && <Badge className="bg-primary text-primary-foreground">Recommended</Badge>}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Gross Income</p>
                            <p className="font-semibold text-sm">₹{calculation.annualIncome.toLocaleString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Taxable Income</p>
                            <p className="font-semibold text-sm">₹{data.taxable.toLocaleString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Base Tax</p>
                            <p className="font-semibold text-sm">₹{data.tax.toLocaleString("en-IN")}</p>
                          </div>
                          <div className={isRec ? "text-primary" : ""}>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Total Payable</p>
                            <p className="font-bold text-lg">₹{data.total.toLocaleString("en-IN")}</p>
                          </div>
                        </div>

                        {regime === "old" && (
                          <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-4">
                            <div className="text-[11px] text-muted-foreground">Standard Deduction: <span className="font-medium text-foreground">₹50,000</span></div>
                            <div className="text-[11px] text-muted-foreground">Claimed 80C: <span className="font-medium text-foreground">₹{Math.min(150000, Number(sec80C)).toLocaleString("en-IN")}</span></div>
                            <div className="text-[11px] text-muted-foreground">Other Benefits: <span className="font-medium text-foreground">₹{(Number(sec80D) + Number(hra) + Number(otherDeductions)).toLocaleString("en-IN")}</span></div>
                          </div>
                        )}
                        {regime === "new" && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="text-[11px] text-muted-foreground">Standard Deduction: <span className="font-medium text-foreground">₹75,000</span> (Enhanced in July 2024 Budget)</div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="p-4 bg-muted/30 rounded-xl border border-dashed flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Tax Disclaimer:</strong> This calculation is based on standard slabs for FY 2024-25. It does not account for professional tax, surcharge (for income &gt; 50L), or specific exemptions like Section 24(b) for home loans. Please consult a tax expert for official filings.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
