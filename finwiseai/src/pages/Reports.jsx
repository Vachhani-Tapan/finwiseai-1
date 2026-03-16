import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const reports = [
  { month: "March 2026", status: "Generating", highlights: ["Portfolio up 3.2%", "Spending under budget", "Emergency fund 83%"] },
  { month: "February 2026", status: "Ready", highlights: ["Portfolio up 1.8%", "Overspent on shopping", "New SIP started"] },
  { month: "January 2026", status: "Ready", highlights: ["Market correction -2%", "Tax saving investments done", "Goal progress on track"] },
  { month: "December 2025", status: "Ready", highlights: ["Year-end review", "Net worth grew 45%", "Best performing: PPFAS"] },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Reports() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display">Monthly AI Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-generated summaries of your financial health</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <motion.div key={r.month} variants={item}>
            <Card className="p-5 glass-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{r.month}</h3>
                    <Badge variant={r.status === "Ready" ? "secondary" : "default"} className="text-xs mt-1">
                      {r.status}
                    </Badge>
                  </div>
                </div>
                {r.status === "Ready" && (
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                )}
              </div>
              <div className="space-y-1.5 mt-3">
                {r.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {h}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
