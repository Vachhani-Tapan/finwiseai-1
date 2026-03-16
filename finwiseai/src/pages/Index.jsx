import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/MetricCard";
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, Target, Receipt, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { format, parseISO, subMonths, startOfMonth, isSameMonth } from "date-fns";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const Index = () => {
  const { user } = useAuth();
  const displayName = user?.displayName?.split(" ")[0] || "there";

  // Fetch real expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/expenses?uid=${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  // Fetch budgets
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/budgets?uid=${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  // Fetch net worth data
  const { data: netWorthData = { assets: [], liabilities: [] } } = useQuery({
    queryKey: ["networth", user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/networth?uid=${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch net worth data");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const assets = netWorthData.assets || [];
  const liabilities = netWorthData.liabilities || [];
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);

  const { currentMonthSpend, monthlyTrendData, recentTransactions } = useMemo(() => {
    const now = new Date();
    let currSpend = 0;
    const currentMonthExpenses = expenses.filter((e) => isSameMonth(parseISO(e.date), startOfMonth(now)));
    currentMonthExpenses.forEach((e) => { currSpend += e.amount; });

    // Build monthly trend (last 6 months)
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      let total = 0;
      expenses.filter((e) => isSameMonth(parseISO(e.date), startOfMonth(m))).forEach((e) => { total += e.amount; });
      trend.push({ month: format(m, "MMM"), spent: total });
    }

    // Recent 5
    const recent = expenses.slice(0, 5).map((e) => ({
      name: e.description || e.category,
      category: e.category,
      amount: -e.amount,
      date: format(parseISO(e.date), "dd MMM"),
    }));

    return { currentMonthSpend: currSpend, monthlyTrendData: trend, recentTransactions: recent };
  }, [expenses]);

  const budgetDiff = totalBudget > 0 ? ((currentMonthSpend / totalBudget) * 100).toFixed(0) : 0;

  // Get current month name
  const currentMonth = format(new Date(), "MMMM yyyy");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display">Good morning, {displayName} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your financial overview for {currentMonth}</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net Worth"
          value={`₹${netWorth.toLocaleString("en-IN")}`}
          change={netWorth >= 0 ? "Positive" : "Negative"}
          changeType={netWorth >= 0 ? "positive" : "negative"}
          icon={Wallet}
        />
        <MetricCard
          title="Total Assets"
          value={`₹${totalAssets.toLocaleString("en-IN")}`}
          change={`${assets.length} items tracked`}
          changeType="neutral"
          icon={TrendingUp}
        />
        <MetricCard
          title="Monthly Spend"
          value={`₹${currentMonthSpend.toLocaleString("en-IN")}`}
          change={totalBudget > 0 ? `${budgetDiff}% of budget used` : "No budget set"}
          changeType={budgetDiff > 100 ? "negative" : "positive"}
          icon={Receipt}
        />
        <MetricCard
          title="Remaining Budget"
          value={totalBudget > 0 ? `₹${Math.max(0, totalBudget - currentMonthSpend).toLocaleString("en-IN")}` : "—"}
          change={totalBudget > 0 && currentMonthSpend > totalBudget ? "Over budget!" : "This month"}
          changeType={currentMonthSpend > totalBudget && totalBudget > 0 ? "negative" : "positive"}
          icon={Target}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="p-5 glass-card">
            <h3 className="font-display font-semibold mb-4">Monthly Spending Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]} />
                <Area type="monotone" dataKey="spent" stroke="hsl(160, 84%, 39%)" fill="url(#spendGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5 glass-card h-full flex flex-col">
            <h3 className="font-display font-semibold mb-4">Account Summary</h3>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-3xl font-bold text-success">₹{totalAssets.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Assets</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-3xl font-bold text-destructive">₹{totalLiabilities.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Liabilities</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-3xl font-bold text-primary">₹{netWorth.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mt-1">Net Worth</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card className="p-5 glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Recent Transactions</h3>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet. Add expenses to see them here.</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-destructive/10">
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.category} · {t.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">₹{Math.abs(t.amount).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Index;
