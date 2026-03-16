import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { CreditCard, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const debts = [
  { name: "Education Loan", principal: 300000, remaining: 80000, emi: 8500, rate: 8.5, months: 10 },
  { name: "Credit Card Debt", principal: 50000, remaining: 20000, emi: 5000, rate: 36, months: 5 },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function DebtPlanner() {
  const totalDebt = debts.reduce((s, d) => s + d.remaining, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display">Debt Planner</h1>
        <p className="text-muted-foreground text-sm mt-1">Smart strategies to become debt-free</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Debt" value={`₹${totalDebt.toLocaleString("en-IN")}`} change="2 active loans" changeType="negative" icon={CreditCard} />
        <MetricCard title="Monthly EMI" value={`₹${debts.reduce((s, d) => s + d.emi, 0).toLocaleString("en-IN")}`} change="15.9% of income" changeType="neutral" icon={TrendingDown} />
        <MetricCard title="Debt-Free Date" value="Jan 2027" change="10 months away" changeType="positive" icon={CreditCard} />
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-5 glass-card">
          <h3 className="font-display font-semibold mb-4">Active Loans</h3>
          <div className="space-y-4">
            {debts.map((d) => (
              <div key={d.name} className="p-4 rounded-xl border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{d.name}</h4>
                    <p className="text-xs text-muted-foreground">{d.rate}% p.a. · {d.months} months left</p>
                  </div>
                  <span className="text-lg font-bold font-display">₹{d.remaining.toLocaleString("en-IN")}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Paid: ₹{(d.principal - d.remaining).toLocaleString("en-IN")}</span>
                    <span>Total: ₹{d.principal.toLocaleString("en-IN")}</span>
                  </div>
                  <Progress value={((d.principal - d.remaining) / d.principal) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="snowball">
          <TabsList>
            <TabsTrigger value="snowball">Snowball Method</TabsTrigger>
            <TabsTrigger value="avalanche">Avalanche Method</TabsTrigger>
          </TabsList>
          <TabsContent value="snowball" className="mt-4">
            <Card className="p-5 glass-card">
              <h3 className="font-display font-semibold mb-2">Snowball Strategy</h3>
              <p className="text-sm text-muted-foreground mb-4">Pay off smallest debt first for psychological wins. You'd clear Credit Card by July, then focus all payments on Education Loan.</p>
              <div className="text-sm text-primary font-medium">💡 Adding ₹2,000 extra/month would save ₹4,200 in interest and get you debt-free 2 months earlier.</div>
            </Card>
          </TabsContent>
          <TabsContent value="avalanche" className="mt-4">
            <Card className="p-5 glass-card">
              <h3 className="font-display font-semibold mb-2">Avalanche Strategy</h3>
              <p className="text-sm text-muted-foreground mb-4">Pay off highest interest rate first (Credit Card @ 36%). This saves the most in total interest — ₹6,800 compared to snowball.</p>
              <div className="text-sm text-primary font-medium">💡 The avalanche method is mathematically optimal for your debt profile.</div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
