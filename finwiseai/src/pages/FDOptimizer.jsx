import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Landmark, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const fds = [
  { bank: "SBI", rate: 7.1, tenure: "1 Year", minAmount: 10000, special: false },
  { bank: "HDFC Bank", rate: 7.25, tenure: "1 Year", minAmount: 10000, special: false },
  { bank: "ICICI Bank", rate: 7.0, tenure: "1 Year", minAmount: 10000, special: false },
  { bank: "Post Office", rate: 7.5, tenure: "1 Year", minAmount: 1000, special: true },
  { bank: "Bajaj Finance", rate: 8.25, tenure: "1 Year", minAmount: 15000, special: true },
  { bank: "Shriram Finance", rate: 8.59, tenure: "1 Year", minAmount: 5000, special: true },
];

const myFDs = [
  { bank: "HDFC Bank", amount: 100000, rate: 7.0, maturity: "Sep 2026", interest: 7000 },
  { bank: "SBI", amount: 100000, rate: 6.8, maturity: "Dec 2026", interest: 6800 },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function FDOptimizer() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display">FD Optimizer</h1>
        <p className="text-muted-foreground text-sm mt-1">Compare rates and maximize your fixed deposit returns</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total FD Value" value="₹2,00,000" change="2 active FDs" changeType="neutral" icon={Landmark} />
        <MetricCard title="Expected Interest" value="₹13,800" change="This year" changeType="positive" icon={TrendingUp} />
        <MetricCard title="Best Rate Available" value="8.59%" change="Shriram Finance" changeType="positive" icon={TrendingUp} />
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-5 glass-card">
          <h3 className="font-display font-semibold mb-4">My Fixed Deposits</h3>
          <div className="space-y-3">
            {myFDs.map((fd) => (
              <div key={fd.bank + fd.maturity} className="p-4 rounded-xl border border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{fd.bank}</h4>
                  <p className="text-xs text-muted-foreground">{fd.rate}% · Matures {fd.maturity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold font-display">₹{fd.amount.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-success">Interest: ₹{fd.interest.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="font-display font-semibold">Compare FD Rates (1 Year)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Institution</th>
                  <th className="text-right p-3 font-medium">Rate</th>
                  <th className="text-right p-3 font-medium">Min Amount</th>
                  <th className="text-right p-3 font-medium">Post-Tax Yield*</th>
                  <th className="text-center p-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {fds.sort((a, b) => b.rate - a.rate).map((fd) => (
                  <tr key={fd.bank} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 font-medium">{fd.bank}</td>
                    <td className="p-3 text-right text-success font-semibold">{fd.rate}%</td>
                    <td className="p-3 text-right">₹{fd.minAmount.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right text-muted-foreground">{(fd.rate * 0.7).toFixed(2)}%</td>
                    <td className="p-3 text-center">
                      <Badge variant={fd.special ? "default" : "secondary"} className="text-xs">
                        {fd.special ? "NBFC/Govt" : "Bank"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 text-xs text-muted-foreground">*Post-tax yield calculated at 30% tax bracket</div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
