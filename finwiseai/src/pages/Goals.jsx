import { Card } from "@/components/ui/card";
import { Target, Plus, Trash2, Wallet, Brain, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [salary, setSalary] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingSalary, setIsSavingSalary] = useState(false);

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    name: "",
    target: "",
    current: "",
    deadline: "",
    priority: "Medium"
  });

  const fetchData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [goalsRes, savingsRes] = await Promise.all([
        fetch(`${API_URL}/api/goals?uid=${user.uid}`),
        fetch(`${API_URL}/api/savings?uid=${user.uid}`)
      ]);

      const goalsData = await goalsRes.json();
      const savingsData = await savingsRes.json();

      setGoals(goalsData);
      setSalary(savingsData.monthlySalary || 0);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target || !newGoal.deadline) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsAdding(true);
      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          ...newGoal,
          target: Number(newGoal.target),
          current: Number(newGoal.current) || 0,
          sipNeeded: calculateSIP(Number(newGoal.target) - (Number(newGoal.current) || 0), newGoal.deadline)
        })
      });

      if (res.ok) {
        toast.success("Goal added successfully");
        fetchData();
        setNewGoal({ name: "", target: "", current: "", deadline: "", priority: "Medium" });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || "Failed to add goal");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Goal deleted");
        setGoals(goals.filter(g => g._id !== id));
      }
    } catch (error) {
      toast.error("Failed to delete goal");
    }
  };

  const handleSaveSalary = async () => {
    try {
      setIsSavingSalary(true);
      const res = await fetch(`${API_URL}/api/savings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          monthlySalary: Number(salary)
        })
      });

      if (res.ok) {
        toast.success("Salary updated");
      }
    } catch (error) {
      toast.error("Failed to update salary");
    } finally {
      setIsSavingSalary(false);
    }
  };

  const calculateSIP = (remaining, deadlineStr) => {
    // Simple calculation: remaining / months until deadline
    // This is a placeholder for more complex TVM calculations
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
    return months > 0 ? Math.round(remaining / months) : remaining;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Financial Goals</h1>
          <p className="text-muted-foreground text-sm mt-1">Track progress and get AI-powered strategy</p>
        </div>
        
        <div className="flex items-center gap-3">
           <Card className="flex flex-col p-4 bg-muted/40 border border-primary/20 hover:border-primary/40 transition-colors w-44">
              <div className="flex items-center gap-2 mb-1.5">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Monthly Income</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">₹</span>
                <input 
                  type="number" 
                  value={salary} 
                  onChange={(e) => setSalary(e.target.value)}
                  onBlur={handleSaveSalary}
                  className="bg-transparent font-bold text-xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                {isSavingSalary && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>
           </Card>

           <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Goal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Financial Goal</DialogTitle>
                <DialogDescription>Set a target and deadline to track your progress.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Goal Name</Label>
                  <Input id="name" placeholder="e.g. Dream House" value={newGoal.name} onChange={(e) => setNewGoal({...newGoal, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="target">Target Amount (₹)</Label>
                    <Input id="target" type="number" placeholder="100000" value={newGoal.target} onChange={(e) => setNewGoal({...newGoal, target: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="current">Current Savings (₹)</Label>
                    <Input id="current" type="number" placeholder="0" value={newGoal.current} onChange={(e) => setNewGoal({...newGoal, current: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">Deadline (Month & Year)</Label>
                    <Input id="deadline" type="month" value={newGoal.deadline} onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newGoal.priority} onValueChange={(val) => setNewGoal({...newGoal, priority: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddGoal} disabled={isAdding}>
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {goals.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 glass-card">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div className="max-w-xs">
            <h3 className="text-lg font-semibold">No goals set yet</h3>
            <p className="text-muted-foreground text-sm">Start by adding your first financial goal to get personalized AI advice.</p>
          </div>
          <Button variant="outline" onClick={() => document.querySelector('[data-state="closed"]')?.click()}>Add Your First Goal</Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => {
              const progress = Math.min((g.current / g.target) * 100, 100);
              return (
                <motion.div key={g._id} variants={item}>
                  <Card className="p-5 glass-card hover:shadow-md transition-shadow group relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => handleDeleteGoal(g._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{g.name}</h3>
                          <p className="text-xs text-muted-foreground">Deadline: {g.deadline}</p>
                        </div>
                      </div>
                      <Badge variant={g.priority === "High" ? "destructive" : "secondary"} className="text-xs">
                        {g.priority}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">₹{g.current.toLocaleString("en-IN")}</span>
                        <span className="font-medium">₹{g.target.toLocaleString("en-IN")}</span>
                      </div>
                      <Progress value={progress} className="h-2.5" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progress.toFixed(0)}% complete</span>
                        <span>SIP needed: ₹{g.sipNeeded.toLocaleString("en-IN")}/mo</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div variants={item}>
            <Card className="p-6 bg-primary/5 border-primary/20 border-dashed flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Get AI Strategy</h3>
                  <p className="text-muted-foreground text-sm">Let our AI analyze your income and goals to provide a custom strategy.</p>
                </div>
              </div>
              <Button onClick={() => navigate("/ai-advisor", { state: { initialQuery: `Based on my monthly salary of ₹${salary} and my financial goals, what should be my emergency fund strategy and investment allocation?` } })} className="shrink-0 gap-2">
                Ask AI Advisor
              </Button>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
