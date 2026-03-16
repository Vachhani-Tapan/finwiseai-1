import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Calculator, IndianRupee, Info, Plus, TrendingUp, Landmark, Briefcase, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

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

// --- Capital Gains Tax Rates ---
const STCG_EQUITY_RATE = 0.15;     // 15% for listed equity held < 1 year
const LTCG_EQUITY_RATE = 0.10;     // 10% beyond ₹1L exemption for equity held > 1 year
const LTCG_EQUITY_EXEMPTION = 100000; // ₹1L exemption on equity LTCG
const LTCG_OTHER_RATE = 0.20;      // 20% with indexation for non-equity assets

function calcSlabTax(taxableIncome, slabs) {
  let tax = 0;
  let prevLimit = 0;
  slabs.forEach(slab => {
    const taxableInSlab = Math.min(Math.max(0, taxableIncome - prevLimit), slab.limit - prevLimit);
    tax += taxableInSlab * slab.rate;
    prevLimit = slab.limit;
  });
  return tax;
}

// Get effective slab rate for a given income (marginal rate)
function getMarginalRate(taxableIncome, slabs) {
  let prevLimit = 0;
  for (const slab of slabs) {
    if (taxableIncome <= slab.limit) return slab.rate;
    prevLimit = slab.limit;
  }
  return slabs[slabs.length - 1].rate;
}

// Collapsible Section Component
function CollapsibleSection({ title, icon: Icon, iconColor, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="glass-card border-primary/10 overflow-hidden">
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconColor || "bg-primary/10 text-primary"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-display font-semibold text-sm">{title}</h3>
          {badge && <Badge className="text-[10px] ml-1">{badge}</Badge>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function TaxPlanner() {
  const { user } = useAuth();

  // Fetch portfolio for ELSS & capital gains detection
  const { data: portfolio = [] } = useQuery({
    queryKey: ["portfolio", user?.uid],
    queryFn: async () => {
      const r = await fetch(`${API_URL}/api/portfolio?uid=${user.uid}`);
      return r.json();
    },
    enabled: !!user?.uid,
  });

  // Live prices for portfolio P&L
  const portfolioSymbols = useMemo(() => portfolio.map(h => h.symbol), [portfolio]);
  const { data: livePrices = {} } = useQuery({
    queryKey: ["portfolio-prices-tax", portfolioSymbols],
    queryFn: async () => {
      if (portfolioSymbols.length === 0) return {};
      const prices = {};
      for (const symbol of portfolioSymbols) {
        try {
          const r = await fetch(`${API_URL}/api/market/stock/${encodeURIComponent(symbol)}?range=1d&interval=1d`);
          const data = await r.json();
          prices[symbol] = data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;
        } catch { prices[symbol] = null; }
      }
      return prices;
    },
    enabled: portfolioSymbols.length > 0,
    staleTime: 120000,
  });

  // Calculate unrealized gains from portfolio
  const portfolioGains = useMemo(() => {
    let totalUnrealizedGain = 0;
    let totalInvested = 0;
    portfolio.forEach(h => {
      const currentPrice = livePrices[h.symbol] || h.entryPrice;
      const gain = (currentPrice - h.entryPrice) * h.quantity;
      totalUnrealizedGain += gain;
      totalInvested += h.entryPrice * h.quantity;
    });
    return { unrealizedGain: totalUnrealizedGain, invested: totalInvested };
  }, [portfolio, livePrices]);

  // Calculate ELSS from portfolio
  const elssValue = useMemo(() => {
    return portfolio.reduce((acc, h) => {
      if (h.name.toUpperCase().includes("ELSS") || h.name.toUpperCase().includes("TAX SAVER")) {
        return acc + (h.entryPrice * h.quantity);
      }
      return acc;
    }, 0);
  }, [portfolio]);

  // --- Old Regime Deductions ---
  const [sec80CManual, setSec80CManual] = useState(0);
  const sec80C = Math.max(Number(sec80CManual), elssValue);
  const [sec80D, setSec80D] = useState(0);
  const [hra, setHra] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);

  // --- Investment Income Inputs ---
  const [stcgEquity, setStcgEquity] = useState(0);       // Short-term capital gains (equity)
  const [stcgOther, setStcgOther] = useState(0);          // Short-term capital gains (debt/gold/property)
  const [ltcgEquity, setLtcgEquity] = useState(0);        // Long-term capital gains (equity/MF)
  const [ltcgOther, setLtcgOther] = useState(0);          // LTCG on debt/gold/property (20% indexation)
  const [fdInterest, setFdInterest] = useState(0);        // FD interest income
  const [savingsInterest, setSavingsInterest] = useState(0); // Savings account interest
  const [rentalIncome, setRentalIncome] = useState(0);    // Rental income
  const [otherIncome, setOtherIncome] = useState(0);       // Freelance/other
  const [dividendIncome, setDividendIncome] = useState(0); // Dividend income
  const [sec80TTA, setSec80TTA] = useState(true);          // ₹10K savings interest deduction

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

  // --- MASTER Calculation Logic ---
  const calculation = useMemo(() => {
    const salaryIncome = annualIncome;
    const stcgEq = Math.max(0, Number(stcgEquity));
    const stcgOth = Math.max(0, Number(stcgOther));
    const ltcgEq = Math.max(0, Number(ltcgEquity));
    const ltcgOth = Math.max(0, Number(ltcgOther));
    const fdInt = Math.max(0, Number(fdInterest));
    const savInt = Math.max(0, Number(savingsInterest));
    const rental = Math.max(0, Number(rentalIncome));
    const other = Math.max(0, Number(otherIncome));
    const dividend = Math.max(0, Number(dividendIncome));

    const totalGrossIncome = salaryIncome + fdInt + savInt + rental + other + dividend + stcgOth;

    if (salaryIncome === 0 && totalGrossIncome === 0) return null;

    // === CAPITAL GAINS TAX (same for both regimes) ===
    // STCG on equity: flat 15%
    const stcgEquityTax = stcgEq * STCG_EQUITY_RATE;
    // STCG on other (debt/gold/property): taxed as per slab rate (calculated later)
    // LTCG on equity: 10% beyond ₹1L exemption
    const ltcgEquityTaxable = Math.max(0, ltcgEq - LTCG_EQUITY_EXEMPTION);
    const ltcgEquityTax = ltcgEquityTaxable * LTCG_EQUITY_RATE;
    // LTCG on other: 20% flat with indexation
    const ltcgOtherTax = ltcgOth * LTCG_OTHER_RATE;

    const totalCapitalGainsTax = stcgEquityTax + ltcgEquityTax + ltcgOtherTax;

    // 80TTA deduction: up to ₹10,000 on savings account interest (Old Regime only)
    const sec80TTADeduction = sec80TTA ? Math.min(10000, savInt) : 0;

    // === NEW REGIME ===
    const stdDedNew = 75000;
    // New regime: salary + FD interest + savings interest + rental + other + dividend + STCG other
    const grossNew = salaryIncome + fdInt + savInt + rental + other + dividend + stcgOth;
    const taxableNew = Math.max(0, grossNew - stdDedNew);
    let taxNew = calcSlabTax(taxableNew, NEW_SLABS);
    if (taxableNew <= 700000) taxNew = 0; // 87A rebate
    // Add capital gains taxes (separate from slab)
    const totalTaxNew = taxNew + totalCapitalGainsTax;
    const cessNew = totalTaxNew * 0.04;
    const grandTotalNew = totalTaxNew + cessNew;

    // === OLD REGIME ===
    const stdDedOld = 50000;
    const totalOldDeductions = Math.min(150000, Number(sec80C)) + Number(sec80D) + Number(hra) + Number(otherDeductions) + stdDedOld + sec80TTADeduction;
    // Old regime: salary + FD interest + savings interest + rental + other + dividend + STCG other
    const grossOld = salaryIncome + fdInt + savInt + rental + other + dividend + stcgOth;
    const taxableOld = Math.max(0, grossOld - totalOldDeductions);
    let taxOld = calcSlabTax(taxableOld, OLD_SLABS);
    if (taxableOld <= 500000) taxOld = 0; // 87A rebate
    const totalTaxOld = taxOld + totalCapitalGainsTax;
    const cessOld = totalTaxOld * 0.04;
    const grandTotalOld = totalTaxOld + cessOld;

    // FD TDS estimate: 10% TDS if interest > ₹40,000
    const fdTDS = fdInt > 40000 ? fdInt * 0.10 : 0;

    // Marginal slab rates for reference
    const marginalOld = getMarginalRate(taxableOld, OLD_SLABS);
    const marginalNew = getMarginalRate(taxableNew, NEW_SLABS);

    return {
      salary: salaryIncome,
      grossIncome: grossOld + stcgEq + ltcgEq + ltcgOth,
      
      new: {
        taxable: taxableNew,
        slabTax: taxNew,
        capitalGainsTax: totalCapitalGainsTax,
        totalTax: totalTaxNew,
        cess: cessNew,
        total: grandTotalNew,
        marginalRate: marginalNew,
      },
      old: {
        taxable: taxableOld,
        slabTax: taxOld,
        capitalGainsTax: totalCapitalGainsTax,
        totalTax: totalTaxOld,
        cess: cessOld,
        total: grandTotalOld,
        deductions: totalOldDeductions,
        marginalRate: marginalOld,
        sec80TTADeduction,
      },

      // Capital gains breakdown
      capitalGains: {
        stcgEquity: stcgEq,
        stcgEquityTax,
        stcgOther: stcgOth,
        ltcgEquity: ltcgEq,
        ltcgEquityTaxable,
        ltcgEquityTax,
        ltcgOther: ltcgOth,
        ltcgOtherTax,
        totalTax: totalCapitalGainsTax,
      },

      // Other income breakdown
      otherIncomes: {
        fdInterest: fdInt,
        fdTDS,
        savingsInterest: savInt,
        rental,
        other,
        dividend,
      },

      recommended: grandTotalNew <= grandTotalOld ? "New" : "Old",
      savings: Math.abs(grandTotalNew - grandTotalOld),
    };
  }, [annualIncome, sec80C, sec80D, hra, otherDeductions, stcgEquity, stcgOther, ltcgEquity, ltcgOther, fdInterest, savingsInterest, rentalIncome, otherIncome, dividendIncome, sec80TTA]);

  if (!user) return null;

  const fmt = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Smart Tax Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete tax estimation including salary, investments &amp; capital gains
          </p>
        </div>
        {calculation && (
          <Badge className="py-1 px-3 text-sm gap-2 bg-success/10 text-success border-success/20">
            Recommended: {calculation.recommended} Regime
          </Badge>
        )}
      </motion.div>

      {annualIncome === 0 && !calculation ? (
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
          {/* Summary Cards */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Tax (Old Regime)" value={fmt(calculation?.old.total || 0)} change={`Deductions: ${fmt(calculation?.old.deductions || 0)}`} changeType="neutral" icon={Calculator} />
            <MetricCard title="Tax (New Regime)" value={fmt(calculation?.new.total || 0)} change="Standard Ded: ₹75,000" changeType="neutral" icon={Calculator} />
            <MetricCard title="Capital Gains Tax" value={fmt(calculation?.capitalGains.totalTax || 0)} change="STCG + LTCG" changeType="neutral" icon={TrendingUp} />
            <MetricCard title="Potential Savings" value={fmt(calculation?.savings || 0)} change={`By choosing ${calculation?.recommended}`} changeType="positive" icon={IndianRupee} />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ═══ LEFT PANEL: All Inputs ═══ */}
            <motion.div variants={item} className="lg:col-span-1 space-y-4">
              
              {/* Old Regime Deductions */}
              <CollapsibleSection title="Old Regime Deductions" icon={Plus} iconColor="bg-primary/10 text-primary" defaultOpen={true}>
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
              </CollapsibleSection>

              {/* Capital Gains */}
              <CollapsibleSection title="Capital Gains" icon={TrendingUp} iconColor="bg-amber-500/10 text-amber-500" badge={portfolioGains.unrealizedGain > 0 ? `Unrealized: ${fmt(portfolioGains.unrealizedGain)}` : null}>
                <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1">📊 From Your Portfolio</p>
                  <p className="text-[10px] text-muted-foreground">
                    Unrealized P&L: <span className={portfolioGains.unrealizedGain >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                      {fmt(portfolioGains.unrealizedGain)}
                    </span> — Enter realized gains below when you sell.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">STCG — Equity (Stocks/MF held &lt; 1yr)</Label>
                  <Input type="number" value={stcgEquity} onChange={(e) => setStcgEquity(e.target.value)} placeholder="Taxed at 15% flat" className="bg-muted/30" />
                  {Number(stcgEquity) > 0 && <p className="text-[10px] text-muted-foreground">Tax: {fmt(Number(stcgEquity) * 0.15)} @ 15%</p>}
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">STCG — Other (Debt/Gold/Property &lt; 3yr)</Label>
                  <Input type="number" value={stcgOther} onChange={(e) => setStcgOther(e.target.value)} placeholder="Taxed at slab rate" className="bg-muted/30" />
                  {Number(stcgOther) > 0 && <p className="text-[10px] text-muted-foreground">Taxed at your income slab rate</p>}
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">LTCG — Equity (Stocks/MF held &gt; 1yr)</Label>
                  <Input type="number" value={ltcgEquity} onChange={(e) => setLtcgEquity(e.target.value)} placeholder="10% above ₹1L exemption" className="bg-muted/30" />
                  {Number(ltcgEquity) > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Exemption: ₹1,00,000 · Taxable: {fmt(Math.max(0, Number(ltcgEquity) - 100000))} · Tax: {fmt(Math.max(0, Number(ltcgEquity) - 100000) * 0.10)}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">LTCG — Other (Debt/Gold/Property &gt; 3yr)</Label>
                  <Input type="number" value={ltcgOther} onChange={(e) => setLtcgOther(e.target.value)} placeholder="20% with indexation" className="bg-muted/30" />
                  {Number(ltcgOther) > 0 && <p className="text-[10px] text-muted-foreground">Tax: {fmt(Number(ltcgOther) * 0.20)} @ 20% with indexation</p>}
                </div>
              </CollapsibleSection>

              {/* FD & Interest Income */}
              <CollapsibleSection title="FD & Interest Income" icon={Landmark} iconColor="bg-blue-500/10 text-blue-500">
                <div className="grid gap-2">
                  <Label className="text-xs">FD Interest Earned (Annual)</Label>
                  <Input type="number" value={fdInterest} onChange={(e) => setFdInterest(e.target.value)} placeholder="e.g. 50000" className="bg-muted/30" />
                  {Number(fdInterest) > 40000 && (
                    <p className="text-[10px] text-amber-500 font-medium">
                      ⚠️ TDS of {fmt(Number(fdInterest) * 0.10)} deducted (10% on interest &gt; ₹40,000)
                    </p>
                  )}
                  {Number(fdInterest) > 0 && <p className="text-[10px] text-muted-foreground">FD interest is taxed at your slab rate</p>}
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Savings Account Interest</Label>
                  <Input type="number" value={savingsInterest} onChange={(e) => setSavingsInterest(e.target.value)} placeholder="e.g. 8000" className="bg-muted/30" />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="sec80tta" checked={sec80TTA} onChange={(e) => setSec80TTA(e.target.checked)} className="rounded border-border" />
                    <label htmlFor="sec80tta" className="text-[10px] text-muted-foreground">
                      Claim 80TTA deduction (up to ₹10,000 on savings interest — Old Regime only)
                    </label>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Dividend Income</Label>
                  <Input type="number" value={dividendIncome} onChange={(e) => setDividendIncome(e.target.value)} placeholder="Taxed at slab rate" className="bg-muted/30" />
                  {Number(dividendIncome) > 0 && <p className="text-[10px] text-muted-foreground">Dividends are taxed at your slab rate (since FY 2020-21)</p>}
                </div>
              </CollapsibleSection>

              {/* Other Income */}
              <CollapsibleSection title="Other Income" icon={Briefcase} iconColor="bg-purple-500/10 text-purple-500">
                <div className="grid gap-2">
                  <Label className="text-xs">Rental Income (Annual)</Label>
                  <Input type="number" value={rentalIncome} onChange={(e) => setRentalIncome(e.target.value)} placeholder="e.g. 120000" className="bg-muted/30" />
                  {Number(rentalIncome) > 0 && <p className="text-[10px] text-muted-foreground">30% standard deduction available under old regime</p>}
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Freelance / Other Income</Label>
                  <Input type="number" value={otherIncome} onChange={(e) => setOtherIncome(e.target.value)} placeholder="e.g. 50000" className="bg-muted/30" />
                </div>
              </CollapsibleSection>
            </motion.div>

            {/* ═══ RIGHT PANEL: Results ═══ */}
            <motion.div variants={item} className="lg:col-span-2 space-y-6">
              {/* Regime Comparison */}
              <Card className="p-6 glass-card">
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
                            <p className="font-semibold text-sm">{fmt(calculation.grossIncome)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Slab Tax</p>
                            <p className="font-semibold text-sm">{fmt(data.slabTax)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Capital Gains Tax</p>
                            <p className="font-semibold text-sm">{fmt(data.capitalGainsTax)}</p>
                          </div>
                          <div className={isRec ? "text-primary" : ""}>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Total Payable</p>
                            <p className="font-bold text-lg">{fmt(data.total)}</p>
                          </div>
                        </div>

                        {regime === "old" && (
                          <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-4">
                            <div className="text-[11px] text-muted-foreground">Standard Deduction: <span className="font-medium text-foreground">₹50,000</span></div>
                            <div className="text-[11px] text-muted-foreground">Claimed 80C: <span className="font-medium text-foreground">{fmt(Math.min(150000, Number(sec80C)))}</span></div>
                            <div className="text-[11px] text-muted-foreground">80TTA: <span className="font-medium text-foreground">{fmt(data.sec80TTADeduction)}</span></div>
                            <div className="text-[11px] text-muted-foreground">Other Benefits: <span className="font-medium text-foreground">{fmt(Number(sec80D) + Number(hra) + Number(otherDeductions))}</span></div>
                            <div className="text-[11px] text-muted-foreground">Marginal Rate: <span className="font-medium text-foreground">{(data.marginalRate * 100).toFixed(0)}%</span></div>
                          </div>
                        )}
                        {regime === "new" && (
                          <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-4">
                            <div className="text-[11px] text-muted-foreground">Standard Deduction: <span className="font-medium text-foreground">₹75,000</span> (Enhanced in July 2024 Budget)</div>
                            <div className="text-[11px] text-muted-foreground">Marginal Rate: <span className="font-medium text-foreground">{(data.marginalRate * 100).toFixed(0)}%</span></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Investment Tax Breakdown */}
              {(calculation?.capitalGains.totalTax > 0 || Number(fdInterest) > 0 || Number(dividendIncome) > 0) && (
                <Card className="p-6 glass-card">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-amber-500" /> Investment Tax Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium">Income Type</th>
                          <th className="text-right p-3 font-medium">Amount</th>
                          <th className="text-right p-3 font-medium">Tax Rate</th>
                          <th className="text-right p-3 font-medium">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculation.capitalGains.stcgEquity > 0 && (
                          <tr className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <p className="font-medium">STCG — Equity</p>
                              <p className="text-xs text-muted-foreground">Stocks/MF held &lt; 1 year</p>
                            </td>
                            <td className="p-3 text-right">{fmt(calculation.capitalGains.stcgEquity)}</td>
                            <td className="p-3 text-right"><Badge variant="outline" className="text-xs">15% Flat</Badge></td>
                            <td className="p-3 text-right font-semibold text-destructive">{fmt(calculation.capitalGains.stcgEquityTax)}</td>
                          </tr>
                        )}
                        {calculation.capitalGains.stcgOther > 0 && (
                          <tr className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <p className="font-medium">STCG — Other</p>
                              <p className="text-xs text-muted-foreground">Debt/Gold/Property &lt; 3 years</p>
                            </td>
                            <td className="p-3 text-right">{fmt(calculation.capitalGains.stcgOther)}</td>
                            <td className="p-3 text-right"><Badge variant="outline" className="text-xs">Slab Rate</Badge></td>
                            <td className="p-3 text-right font-semibold text-muted-foreground">Included in slab</td>
                          </tr>
                        )}
                        {calculation.capitalGains.ltcgEquity > 0 && (
                          <tr className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <p className="font-medium">LTCG — Equity</p>
                              <p className="text-xs text-muted-foreground">₹1L exemption applied · Taxable: {fmt(calculation.capitalGains.ltcgEquityTaxable)}</p>
                            </td>
                            <td className="p-3 text-right">{fmt(calculation.capitalGains.ltcgEquity)}</td>
                            <td className="p-3 text-right"><Badge variant="outline" className="text-xs">10% &gt; ₹1L</Badge></td>
                            <td className="p-3 text-right font-semibold text-destructive">{fmt(calculation.capitalGains.ltcgEquityTax)}</td>
                          </tr>
                        )}
                        {calculation.capitalGains.ltcgOther > 0 && (
                          <tr className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <p className="font-medium">LTCG — Other</p>
                              <p className="text-xs text-muted-foreground">Debt/Gold/Property with indexation</p>
                            </td>
                            <td className="p-3 text-right">{fmt(calculation.capitalGains.ltcgOther)}</td>
                            <td className="p-3 text-right"><Badge variant="outline" className="text-xs">20% Indexed</Badge></td>
                            <td className="p-3 text-right font-semibold text-destructive">{fmt(calculation.capitalGains.ltcgOtherTax)}</td>
                          </tr>
                        )}
                        {calculation.otherIncomes.fdInterest > 0 && (
                          <tr className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <p className="font-medium">FD Interest</p>
                              <p className="text-xs text-muted-foreground">
                                {calculation.otherIncomes.fdTDS > 0 ? `TDS deducted: ${fmt(calculation.otherIncomes.fdTDS)}` : "No TDS (interest < ₹40K)"}
                              </p>
                            </td>
                            <td className="p-3 text-right">{fmt(calculation.otherIncomes.fdInterest)}</td>
                            <td className="p-3 text-right"><Badge variant="outline" className="text-xs">Slab Rate</Badge></td>
                            <td className="p-3 text-right font-semibold text-muted-foreground">Included in slab</td>
                          </tr>
                        )}
                        {calculation.otherIncomes.dividend > 0 && (
                          <tr className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <p className="font-medium">Dividend Income</p>
                              <p className="text-xs text-muted-foreground">Taxable since FY 2020-21</p>
                            </td>
                            <td className="p-3 text-right">{fmt(calculation.otherIncomes.dividend)}</td>
                            <td className="p-3 text-right"><Badge variant="outline" className="text-xs">Slab Rate</Badge></td>
                            <td className="p-3 text-right font-semibold text-muted-foreground">Included in slab</td>
                          </tr>
                        )}
                        {calculation.otherIncomes.savingsInterest > 0 && (
                          <tr className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <p className="font-medium">Savings Interest</p>
                              <p className="text-xs text-muted-foreground">80TTA: upto ₹10K deduction (Old Regime)</p>
                            </td>
                            <td className="p-3 text-right">{fmt(calculation.otherIncomes.savingsInterest)}</td>
                            <td className="p-3 text-right"><Badge variant="outline" className="text-xs">Slab Rate</Badge></td>
                            <td className="p-3 text-right font-semibold text-muted-foreground">Included in slab</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/30">
                          <td className="p-3 font-bold" colSpan={3}>Total Capital Gains Tax (separate)</td>
                          <td className="p-3 text-right font-bold text-destructive">{fmt(calculation.capitalGains.totalTax)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>
              )}

              {/* Tax Disclaimer */}
              <div className="p-4 bg-muted/30 rounded-xl border border-dashed flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Tax Disclaimer:</strong> This calculation is based on standard slabs and rates for FY 2024-25 (AY 2025-26). Capital gains tax rates: STCG Equity @ 15%, LTCG Equity @ 10% above ₹1L, LTCG Other @ 20% with indexation. FD interest and dividends are taxed at slab rates. It does not account for surcharge (income &gt; 50L), Section 54 exemptions on property, or grandfathering provisions. Please consult a CA for official filings.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
