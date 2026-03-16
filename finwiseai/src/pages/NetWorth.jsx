import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ASSET_TYPES = ["Mutual Funds", "Stocks", "Fixed Deposits", "Gold", "Savings A/c", "Real Estate", "PPF", "Other"];
const LIABILITY_TYPES = ["Home Loan", "Education Loan", "Car Loan", "Credit Card", "Personal Loan", "Other"];

export default function NetWorth() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [isLiabilityOpen, setIsLiabilityOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetValue, setAssetValue] = useState("");
  const [liabilityName, setLiabilityName] = useState("");
  const [liabilityValue, setLiabilityValue] = useState("");

  // Fetch net worth data
  const { data: netWorthData = { assets: [], liabilities: [] }, isLoading } = useQuery({
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

  // Mutations
  const addItemMutation = useMutation({
    mutationFn: async (newItem) => {
      const res = await fetch(`${API_URL}/api/networth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, ...newItem }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["networth", user?.uid]);
      toast.success("Item added successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/api/networth/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["networth", user?.uid]);
      toast.success("Item deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!assetName || !assetValue) return toast.error("Fill all fields");
    addItemMutation.mutate({
      name: assetName,
      value: Number(assetValue),
      type: 'asset',
      category: assetName // Using name as category for simplicity or vice versa
    });
    setAssetName(""); setAssetValue(""); setIsAssetOpen(false);
  };

  const handleAddLiability = (e) => {
    e.preventDefault();
    if (!liabilityName || !liabilityValue) return toast.error("Fill all fields");
    addItemMutation.mutate({
      name: liabilityName,
      value: Number(liabilityValue),
      type: 'liability',
      category: liabilityName
    });
    setLiabilityName(""); setLiabilityValue(""); setIsLiabilityOpen(false);
  };

  const deleteItem = (id) => {
    deleteItemMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display">Net Worth</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your assets and liabilities</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          change={`${assets.length} asset${assets.length !== 1 ? "s" : ""}`}
          changeType="neutral"
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Liabilities"
          value={`₹${totalLiabilities.toLocaleString("en-IN")}`}
          change={`${liabilities.length} obligation${liabilities.length !== 1 ? "s" : ""}`}
          changeType="negative"
          icon={TrendingDown}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ASSETS */}
        <motion.div variants={item}>
          <Card className="p-5 glass-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-success">Assets</h3>
              <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 h-8">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Add Asset</DialogTitle>
                    <DialogDescription>Enter the asset type and its current value.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAsset} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Asset Type</Label>
                      <Select value={assetName} onValueChange={setAssetName}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Value (₹)</Label>
                      <Input type="number" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} placeholder="0" required />
                    </div>
                    <DialogFooter><Button type="submit" disabled={addItemMutation.isPending}>
                      {addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Asset"}
                    </Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {assets.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No assets added yet. Click "Add" to start tracking.</p>
            ) : (
              <div className="space-y-3">
                {assets.map((a) => (
                  <div key={a._id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 group">
                    <span className="text-sm">{a.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">₹{a.value.toLocaleString("en-IN")}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteItem(a._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 font-bold">
                  <span>Total</span>
                  <span className="text-success">₹{totalAssets.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* LIABILITIES */}
        <motion.div variants={item}>
          <Card className="p-5 glass-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-destructive">Liabilities</h3>
              <Dialog open={isLiabilityOpen} onOpenChange={setIsLiabilityOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 h-8">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Add Liability</DialogTitle>
                    <DialogDescription>Enter the liability type and outstanding amount.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddLiability} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Liability Type</Label>
                      <Select value={liabilityName} onValueChange={setLiabilityName}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {LIABILITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Amount (₹)</Label>
                      <Input type="number" value={liabilityValue} onChange={(e) => setLiabilityValue(e.target.value)} placeholder="0" required />
                    </div>
                    <DialogFooter><Button type="submit" disabled={addItemMutation.isPending}>
                      {addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Liability"}
                    </Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {liabilities.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No liabilities added. Click "Add" to track.</p>
            ) : (
              <div className="space-y-3">
                {liabilities.map((l) => (
                  <div key={l._id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 group">
                    <span className="text-sm">{l.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">₹{l.value.toLocaleString("en-IN")}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteItem(l._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 font-bold">
                  <span>Total</span>
                  <span className="text-destructive">₹{totalLiabilities.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
