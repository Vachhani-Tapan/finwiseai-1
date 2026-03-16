import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Receipt, TrendingDown, Utensils, Car, Zap, ShoppingBag, Plus, MoreHorizontal, Pencil, Trash2, Settings2, Wallet, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO, startOfMonth, subMonths, isSameMonth } from "date-fns";

// Static category metadata (icons & colors only, budgets come from API)
const CATEGORY_META = {
  "Food & Dining": { icon: Utensils, color: "hsl(160, 84%, 39%)" },
  "Transport": { icon: Car, color: "hsl(217, 91%, 60%)" },
  "Utilities": { icon: Zap, color: "hsl(38, 92%, 50%)" },
  "Shopping": { icon: ShoppingBag, color: "hsl(280, 67%, 60%)" },
  "Others": { icon: Receipt, color: "hsl(0, 72%, 51%)" },
};

const CATEGORIES = Object.keys(CATEGORY_META);

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function Expenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form State
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Budget & Savings State
  const [budgetForm, setBudgetForm] = useState({});
  const [savingsInput, setSavingsInput] = useState("");
  const [salaryInput, setSalaryInput] = useState("");
  const [isSavingsOpen, setIsSavingsOpen] = useState(false);

  // --- Data Fetching ---
  const { data: expenses = [], isLoading, isError } = useQuery({
    queryKey: ['expenses', user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/expenses?uid=${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  // Fetch user budgets
  const { data: userBudgets = [] } = useQuery({
    queryKey: ['budgets', user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/budgets?uid=${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
    enabled: !!user?.uid,
  });

  // Fetch savings goal
  const { data: savingsData } = useQuery({
    queryKey: ['savings', user?.uid],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/savings?uid=${user.uid}`);
      return res.json();
    },
    enabled: !!user?.uid,
  });
  const monthlySavingsGoal = savingsData?.monthlySavings || 0;

  // Build a lookup map from budget data
  const budgetMap = useMemo(() => {
    const map = {};
    userBudgets.forEach(b => { map[b.category] = b.amount; });
    // Fill defaults for any missing
    CATEGORIES.forEach(cat => {
      if (map[cat] === undefined) map[cat] = 0;
    });
    return map;
  }, [userBudgets]);

  // Total monthly budget from user settings
  const totalMonthlyBudget = useMemo(() => {
    return Object.values(budgetMap).reduce((acc, v) => acc + v, 0);
  }, [budgetMap]);

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: async (newExpense) => {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      });
      if (!res.ok) throw new Error("Failed to create expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success("Expense added successfully");
      setIsAddOpen(false);
      resetForm();
    },
    onError: () => toast.error("Failed to add expense"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updatedExpense }) => {
      const res = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExpense),
      });
      if (!res.ok) throw new Error("Failed to update expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success("Expense updated successfully");
      setIsEditOpen(false);
      setEditingExpense(null);
      resetForm();
    },
    onError: () => toast.error("Failed to update expense"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success("Expense deleted successfully");
    },
    onError: () => toast.error("Failed to delete expense"),
  });

  const saveBudgetsMutation = useMutation({
    mutationFn: async (budgets) => {
      const res = await fetch(`${API_URL}/api/budgets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, budgets }),
      });
      if (!res.ok) throw new Error("Failed to save budgets");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success("Budgets updated successfully!");
      setIsBudgetOpen(false);
    },
    onError: () => toast.error("Failed to update budgets"),
  });

  const saveSavingsMutation = useMutation({
    mutationFn: async ({ savings, salary }) => {
      const res = await fetch(`${API_URL}/api/savings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          uid: user.uid, 
          monthlySavings: Number(savings),
          monthlySalary: Number(salary)
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      toast.success("Financial profile updated!");
      setIsSavingsOpen(false);
    },
    onError: () => toast.error("Failed to update financial profile"),
  });


  const [savingSalaryInline, setSavingSalaryInline] = useState(false);
  const handleSalaryBlur = async (val) => {
    try {
      setSavingSalaryInline(true);
      await saveSavingsMutation.mutateAsync({ 
        savings: monthlySavingsGoal, 
        salary: Number(val) 
      });
    } finally {
      setSavingSalaryInline(false);
    }
  };

  // --- Handlers ---
  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!amount || !category) return toast.error("Please fill required fields");
    createMutation.mutate({
      userId: user.uid,
      amount: Number(amount),
      category,
      description,
      date,
    });
  };

  const openEdit = (exp) => {
    setEditingExpense(exp);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDescription(exp.description || "");
    setDate(format(parseISO(exp.date), "yyyy-MM-dd"));
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!amount || !category) return toast.error("Please fill required fields");
    updateMutation.mutate({
      id: editingExpense._id,
      amount: Number(amount),
      category,
      description,
      date,
    });
  };

  const openBudgetDialog = () => {
    // Pre-fill form with current budgets
    const form = {};
    CATEGORIES.forEach(cat => { form[cat] = budgetMap[cat] || 0; });
    setBudgetForm(form);
    setIsBudgetOpen(true);
  };

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    const budgets = CATEGORIES.map(cat => ({
      category: cat,
      amount: Number(budgetForm[cat]) || 0,
    }));
    saveBudgetsMutation.mutate(budgets);
  };

  const handleSavingsSubmit = (e) => {
    e.preventDefault();
    saveSavingsMutation.mutate({ 
      savings: Number(savingsInput), 
      salary: Number(salaryInput) 
    });
  };

  // --- Dynamic Calculations based on Real Data ---
  const { currentMonthTotal, lastMonthTotal, categoryAggregation, monthlyChartData } = useMemo(() => {
    if (!expenses.length) return { currentMonthTotal: 0, lastMonthTotal: 0, categoryAggregation: [], monthlyChartData: [] };

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));

    let currentTot = 0;
    let lastTot = 0;

    const currentMonthExpenses = expenses.filter(exp => isSameMonth(parseISO(exp.date), currentMonthStart));
    const catMap = {};
    CATEGORIES.forEach(cat => { catMap[cat] = 0; });

    currentMonthExpenses.forEach(exp => {
      currentTot += exp.amount;
      if (catMap[exp.category] !== undefined) {
        catMap[exp.category] += exp.amount;
      } else {
        catMap["Others"] += exp.amount;
      }
    });

    expenses.filter(exp => isSameMonth(parseISO(exp.date), lastMonthStart)).forEach(exp => {
      lastTot += exp.amount;
    });

    const categoryArray = Object.keys(catMap).map(key => ({
      name: key,
      value: catMap[key],
      budget: budgetMap[key] || 0,
      icon: CATEGORY_META[key].icon,
      color: CATEGORY_META[key].color
    })).sort((a, b) => b.value - a.value);

    // Monthly Chart Data (Last 6 months)
    const monthMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      monthMap[format(d, "MMM")] = 0;
    }
    
    expenses.forEach(exp => {
      const monthStr = format(parseISO(exp.date), "MMM");
      if (monthMap[monthStr] !== undefined) {
        monthMap[monthStr] += exp.amount;
      }
    });

    const chartData = Object.keys(monthMap).map(key => ({
      month: key,
      spent: monthMap[key],
      budget: totalMonthlyBudget,
    }));

    return {
      currentMonthTotal: currentTot,
      lastMonthTotal: lastTot,
      categoryAggregation: categoryArray,
      monthlyChartData: chartData
    };
  }, [expenses, budgetMap, totalMonthlyBudget]);

  const triggerAlert = useMutation({
    mutationFn: async ({ category, spent, budget }) => {
      await fetch(`${API_URL}/api/alerts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          type: "destructive",
          icon: "AlertTriangle",
          title: "Budget Exceeded",
          desc: `You've spent ₹${spent.toLocaleString()} on ${category}, exceeding your ₹${budget.toLocaleString()} budget!`,
        }),
      });
    },
  });

  // Monitor for budget breaches
  useEffect(() => {
    categoryAggregation.forEach(cat => {
      if (cat.budget > 0 && cat.value > cat.budget) {
        triggerAlert.mutate({ category: cat.name, spent: cat.value, budget: cat.budget });
        // Individual toast for immediate feedback
        toast.error(`Budget exceeded for ${cat.name}! Check alerts.`, { id: `budget-alert-${cat.name}` });
      }
    });
  }, [categoryAggregation]);



  const topCategory = categoryAggregation?.length > 0 ? categoryAggregation[0] : null;
  const changeFromLastMonth = currentMonthTotal - lastMonthTotal;
  const budgetDiff = totalMonthlyBudget - currentMonthTotal;

  const monthlySalary = savingsData?.monthlySalary || 0;

  // 50/30/20 Rule
  const totalIncomeAssumed = monthlySalary || Math.max(totalMonthlyBudget * 2, 60000); 
  const needsSpent = categoryAggregation.reduce((acc, c) => ["Food & Dining", "Transport", "Utilities"].includes(c.name) ? acc + c.value : acc, 0);
  const wantsSpent = categoryAggregation.reduce((acc, c) => ["Shopping", "Others"].includes(c.name) ? acc + c.value : acc, 0);
  
  const rule503020 = [
    { name: "Needs (50%)", actual: Math.round((needsSpent / totalIncomeAssumed) * 100), target: 50, color: "hsl(217, 91%, 60%)" },
    { name: "Wants (30%)", actual: Math.round((wantsSpent / totalIncomeAssumed) * 100), target: 30, color: "hsl(38, 92%, 50%)" },
    { name: "Savings (20%)", actual: Math.max(0, Math.round(((totalIncomeAssumed - needsSpent - wantsSpent) / totalIncomeAssumed) * 100)), target: 20, color: "hsl(160, 84%, 39%)" },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading expenses...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-destructive">Failed to load expenses. Is the backend running?</div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Expense Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and optimize your spending</p>
        </div>
        
        <div className="flex flex-wrap gap-2 shrink-0">
          {/* SALARY INPUT BOX */}
          <Card className="flex flex-col p-4 bg-muted/40 border border-primary/20 hover:border-primary/40 transition-colors w-44">
            <div className="flex items-center gap-2 mb-1.5">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Monthly Income</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">₹</span>
              <input 
                type="number" 
                defaultValue={savingsData?.monthlySalary || 0}
                onBlur={(e) => handleSalaryBlur(e.target.value)}
                className="bg-transparent font-bold text-xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
              {(saveSavingsMutation.isPending || savingSalaryInline) && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
          </Card>

          {/* SET BUDGETS BUTTON */}
          <Button variant="outline" className="gap-2 h-auto py-4 px-6 border-primary/20 hover:bg-primary/5 transition-all" onClick={openBudgetDialog}>
            <Settings2 className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold uppercase tracking-tight">Budgets</span>
              <span className="text-[10px] text-muted-foreground">Manage Limits</span>
            </div>
          </Button>

          {/* ADD EXPENSE DIALOG */}
          <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense. Click save when you're done.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="E.g., Groceries" />
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save Expense"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard 
          title="This Month" 
          value={`₹${currentMonthTotal.toLocaleString("en-IN")}`} 
          change={budgetDiff >= 0 ? `Under budget by ₹${budgetDiff.toLocaleString("en-IN")}` : `Over budget by ₹${Math.abs(budgetDiff).toLocaleString("en-IN")}`}
          changeType={budgetDiff >= 0 ? "positive" : "negative"} 
          icon={Receipt} 
        />
        <MetricCard 
          title="Monthly Budget" 
          value={`₹${totalMonthlyBudget.toLocaleString("en-IN")}`} 
          change={`${changeFromLastMonth > 0 ? '+' : ''}₹${Math.abs(changeFromLastMonth).toLocaleString("en-IN")} vs last month`}
          changeType="neutral" 
          icon={TrendingDown} 
        />
        <MetricCard 
          title="Top Category" 
          value={topCategory?.name || "N/A"} 
          change={topCategory ? `₹${topCategory.value.toLocaleString("en-IN")}` : ""} 
          changeType="negative" 
          icon={topCategory?.icon || ShoppingBag} 
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={item}>
          <Card className="p-5 glass-card">
            <h3 className="font-display font-semibold mb-4">Monthly Spending vs Budget</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyChartData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `₹${(v / 1000)}k`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`]} />
                <Bar dataKey="spent" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budget" fill="hsl(220, 14%, 85%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5 glass-card">
            <h3 className="font-display font-semibold mb-4">50/30/20 Rule Analysis</h3>
            <div className="space-y-6 mt-6">
              {rule503020.map((r) => (
                <div key={r.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground">{r.actual}% / {r.target}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((r.actual / r.target) * 100, 100)}%`, backgroundColor: r.color, maxWidth: "100%" }} />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Target Monthly Savings</p>
                  <p className="text-xs text-muted-foreground">Amount set aside for investments</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">₹{monthlySavingsGoal.toLocaleString("en-IN")}</p>
                  <Button variant="link" className="h-auto p-0 text-xs" onClick={() => { 
                    setSavingsInput(monthlySavingsGoal.toString()); 
                    setSalaryInput((savingsData?.monthlySalary || 0).toString());
                    setIsSavingsOpen(true); 
                  }}>Edit Profile</Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card className="p-5 glass-card h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold">Category Budgets</h3>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={openBudgetDialog}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
            <div className="space-y-4">
              {categoryAggregation.map((c) => {
                const pct = c.budget > 0 ? Math.min((c.value / c.budget) * 100, 100) : 0;
                const isOver = c.value > c.budget && c.budget > 0;
                return (
                  <div key={c.name} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center cursor-default" style={{ backgroundColor: `${c.color}20` }}>
                      <c.icon className="h-4 w-4" style={{ color: c.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{c.name}</span>
                        <div className="flex items-center gap-2">
                          {isOver && <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">OVER BUDGET</motion.span>}
                          <span className={`text-muted-foreground ${isOver ? "text-destructive font-bold" : ""}`}>
                            ₹{c.value.toLocaleString("en-IN")} / ₹{c.budget.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                      <Progress value={pct} className={`h-2 ${isOver ? "bg-destructive/20 [&>div]:bg-destructive" : ""}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5 glass-card h-full flex flex-col">
            <h3 className="font-display font-semibold mb-4">Recent Expenses</h3>
            {expenses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground opacity-50 space-y-3 py-10">
                <Receipt className="h-10 w-10" />
                <p>No expenses found. <br/> Add your first expense to get started.</p>
              </div>
            ) : (
              <div className="overflow-auto pr-2 max-h-[350px] space-y-3">
                {expenses.slice(0, 10).map((exp) => {
                  const CategoryIcon = CATEGORY_META[exp.category]?.icon || Receipt;
                  const catColor = CATEGORY_META[exp.category]?.color || "hsl(0, 0%, 50%)";
                  return (
                    <div key={exp._id} className="flex items-center p-3 rounded-lg border border-border/50 bg-background/50 group">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3 shrink-0" style={{ backgroundColor: `${catColor}15` }}>
                         <CategoryIcon className="h-4 w-4" style={{ color: catColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{exp.description || exp.category}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(exp.date), "MMM dd, yyyy")} &bull; {exp.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">₹{exp.amount.toLocaleString("en-IN")}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(exp)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate(exp._id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* EDIT EXPENSE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={(val) => { setIsEditOpen(val); if (!val) { setEditingExpense(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Make changes to your expense entry here.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Amount (₹)</Label>
              <Input id="edit-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="E.g., Groceries" />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SET BUDGETS DIALOG */}
      <Dialog open={isBudgetOpen} onOpenChange={(val) => { setIsBudgetOpen(val); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Set Category Budgets</DialogTitle>
            <DialogDescription>Set a monthly spending limit for each category. These will be used to track your progress.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBudgetSubmit} className="grid gap-4 py-4">
            {CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}20` }}>
                    <Icon className="h-4 w-4" style={{ color: meta.color }} />
                  </div>
                  <Label className="flex-1 text-sm font-medium">{cat}</Label>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      value={budgetForm[cat] ?? ""}
                      onChange={(e) => setBudgetForm(prev => ({ ...prev, [cat]: e.target.value }))}
                      placeholder="₹ 0"
                      className="text-right"
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-semibold">Total Monthly Budget</span>
              <span className="text-sm font-bold text-primary">
                ₹{CATEGORIES.reduce((acc, cat) => acc + (Number(budgetForm[cat]) || 0), 0).toLocaleString("en-IN")}
              </span>
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setIsBudgetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveBudgetsMutation.isPending}>
                {saveBudgetsMutation.isPending ? "Saving..." : "Save Budgets"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SET SAVINGS DIALOG */}
      <Dialog open={isSavingsOpen} onOpenChange={setIsSavingsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Monthly Savings Goal</DialogTitle>
            <DialogDescription>Set how much you aim to save each month for investments and emergency funds.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavingsSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Monthly Salary (₹)</Label>
              <Input type="number" min="0" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)} placeholder="e.g. 100000" />
            </div>
            <div className="grid gap-2">
              <Label>Target Monthly Savings (₹)</Label>
              <Input type="number" min="0" value={savingsInput} onChange={(e) => setSavingsInput(e.target.value)} placeholder="e.g. 20000" />
            </div>
            <DialogFooter className="mt-2">
               <Button type="button" variant="outline" onClick={() => setIsSavingsOpen(false)}>Cancel</Button>
               <Button type="submit" disabled={saveSavingsMutation.isPending}>
                 {saveSavingsMutation.isPending ? "Saving..." : "Save Goal"}
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
