import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { TrendingUp, BarChart3, Search, AlertTriangle, ShieldCheck, ShieldAlert, Loader2, Star, PlusCircle, Trash2, Eye, Brain } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ─── Risk Helpers ────────────────────────────────────────────────────────────
function calcMFRisk(navData) {
  if (!navData || navData.length < 30) return { returnPct: 0, volatility: 0, label: "N/A", color: "gray" };
  const sorted = [...navData].sort((a, b) => {
    const [dA, mA, yA] = a.date.split("-").map(Number);
    const [dB, mB, yB] = b.date.split("-").map(Number);
    return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
  });
  const latest = parseFloat(sorted[sorted.length - 1].nav);
  const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  let closest = sorted[0];
  for (const pt of sorted) { const [d, m, y] = pt.date.split("-").map(Number); if (new Date(y, m - 1, d) <= oneYearAgo) closest = pt; }
  const pastNav = parseFloat(closest.nav);
  const returnPct = pastNav > 0 ? ((latest - pastNav) / pastNav) * 100 : 0;
  const monthlyReturns = []; const step = Math.floor(sorted.length / 12);
  for (let i = step; i < sorted.length; i += step) { const prev = parseFloat(sorted[i - step].nav); const curr = parseFloat(sorted[i].nav); if (prev > 0) monthlyReturns.push((curr - prev) / prev); }
  const mean = monthlyReturns.reduce((s, r) => s + r, 0) / (monthlyReturns.length || 1);
  const variance = monthlyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (monthlyReturns.length || 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(12) * 100;
  let label = "Low", color = "hsl(160, 84%, 39%)";
  if (volatility > 20) { label = "High"; color = "hsl(0, 72%, 51%)"; } else if (volatility > 10) { label = "Medium"; color = "hsl(38, 92%, 50%)"; }
  return { returnPct: returnPct.toFixed(2), volatility: volatility.toFixed(2), label, color };
}

function calcStockRisk(closes) {
  if (!closes || closes.length < 30) return { change: 0, volatility: 0, label: "N/A", color: "gray" };
  const latest = closes[closes.length - 1]; const oldest = closes[0];
  const change = oldest > 0 ? ((latest - oldest) / oldest) * 100 : 0;
  const dailyReturns = [];
  for (let i = 1; i < closes.length; i++) { if (closes[i - 1] > 0) dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]); }
  const mean = dailyReturns.reduce((s, r) => s + r, 0) / (dailyReturns.length || 1);
  const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (dailyReturns.length || 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
  let label = "Low", color = "hsl(160, 84%, 39%)";
  if (volatility > 30) { label = "High"; color = "hsl(0, 72%, 51%)"; } else if (volatility > 15) { label = "Medium"; color = "hsl(38, 92%, 50%)"; }
  return { change: change.toFixed(2), volatility: volatility.toFixed(2), label, color };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Investments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // MF state
  const [mfQuery, setMfQuery] = useState("");
  const [debouncedMfQuery, setDebouncedMfQuery] = useState("");
  const [selectedMF, setSelectedMF] = useState(null);

  // Stock state
  const [stockQuery, setStockQuery] = useState("");
  const [debouncedStockQuery, setDebouncedStockQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  // ─── Debounce: auto-search 400ms after user stops typing ───────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedStockQuery(stockQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [stockQuery]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedMfQuery(mfQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [mfQuery]);

  // ─── MF Queries ────────────────────────────────────────────────────────────
  const { data: mfResults = [], isFetching: mfSearching } = useQuery({
    queryKey: ["mf-search", debouncedMfQuery],
    queryFn: async () => { const r = await fetch(`${API_URL}/api/market/mf/search?q=${encodeURIComponent(debouncedMfQuery)}`); if (!r.ok) throw new Error('Search failed'); return r.json(); },
    enabled: debouncedMfQuery.length >= 2,
    staleTime: 60_000,
    retry: 1,
  });
  const { data: mfData, isFetching: mfLoading } = useQuery({
    queryKey: ["mf-data", selectedMF?.schemeCode],
    queryFn: async () => { const r = await fetch(`${API_URL}/api/market/mf/${selectedMF.schemeCode}`); return r.json(); },
    enabled: !!selectedMF?.schemeCode,
  });
  const mfChartData = useMemo(() => {
    if (!mfData?.data) return [];
    return mfData.data.slice(0, 365).reverse().map((pt) => ({ date: pt.date, nav: parseFloat(pt.nav) }));
  }, [mfData]);
  const mfRisk = useMemo(() => calcMFRisk(mfData?.data), [mfData]);

  // ─── Stock Search by Name ──────────────────────────────────────────────────
  const { data: stockResults = [], isFetching: stockSearching } = useQuery({
    queryKey: ["stock-name-search", debouncedStockQuery],
    queryFn: async () => { const r = await fetch(`${API_URL}/api/market/stock/search?q=${encodeURIComponent(debouncedStockQuery)}`); if (!r.ok) throw new Error('Search failed'); return r.json(); },
    enabled: debouncedStockQuery.length >= 2,
    staleTime: 60_000,
    retry: 1,
  });

  // Stock chart data for selected stock
  const { data: stockData, isFetching: stockLoading } = useQuery({
    queryKey: ["stock-chart", selectedStock?.symbol],
    queryFn: async () => { const r = await fetch(`${API_URL}/api/market/stock/${encodeURIComponent(selectedStock.symbol)}`); return r.json(); },
    enabled: !!selectedStock?.symbol,
  });

  const { stockChartData, stockMeta, sRisk } = useMemo(() => {
    const result = stockData?.chart?.result?.[0];
    if (!result) return { stockChartData: [], stockMeta: null, sRisk: null };
    const closes = result.indicators?.quote?.[0]?.close || [];
    const timestamps = result.timestamp || [];
    const chartData = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      price: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
    })).filter((d) => d.price !== null);
    const risk = calcStockRisk(closes.filter(Boolean));
    return { stockChartData: chartData, stockMeta: result.meta || {}, sRisk: risk };
  }, [stockData]);

  // ─── Watchlist ─────────────────────────────────────────────────────────────
  const { data: watchlist = [] } = useQuery({
    queryKey: ["watchlist", user?.uid],
    queryFn: async () => { const r = await fetch(`${API_URL}/api/watchlist?uid=${user.uid}`); return r.json(); },
    enabled: !!user?.uid,
  });
  const addToWatchlist = useMutation({
    mutationFn: async (stock) => {
      const r = await fetch(`${API_URL}/api/watchlist`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, symbol: stock.symbol, name: stock.name, exchange: stock.exchDisp || stock.exchange }),
      });
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries(["watchlist"]); toast.success("Added to watchlist! ⭐"); },
  });
  const removeFromWatchlist = useMutation({
    mutationFn: async (id) => { await fetch(`${API_URL}/api/watchlist/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries(["watchlist"]); toast.success("Removed from watchlist"); },
  });

  // ─── Portfolio ─────────────────────────────────────────────────────────────
  const { data: portfolio = [] } = useQuery({
    queryKey: ["portfolio", user?.uid],
    queryFn: async () => { const r = await fetch(`${API_URL}/api/portfolio?uid=${user.uid}`); return r.json(); },
    enabled: !!user?.uid,
  });

  // Live Prices for Portfolio
  const portfolioSymbols = useMemo(() => portfolio.map(h => h.symbol), [portfolio]);
  const { data: livePrices = {} } = useQuery({
    queryKey: ["portfolio-prices", portfolioSymbols],
    queryFn: async () => {
      if (portfolioSymbols.length === 0) return {};
      const prices = {};
      for (const symbol of portfolioSymbols) {
        try {
          const r = await fetch(`${API_URL}/api/market/stock/${encodeURIComponent(symbol)}?range=1d&interval=1d`);
          const data = await r.json();
          prices[symbol] = data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;
        } catch (e) {
          console.error(`Failed to fetch price for ${symbol}`, e);
          prices[symbol] = null;
        }
      }
      return prices;
    },
    enabled: portfolioSymbols.length > 0,
    refetchInterval: 60000, // Refresh every minute
  });

  const triggerAlert = useMutation({
    mutationFn: async ({ symbol, name, price, stopLoss }) => {
      await fetch(`${API_URL}/api/alerts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          type: "warning",
          icon: "TrendingDown",
          title: "Stop-Loss Triggered",
          desc: `${name} (${symbol}) dropped to ₹${price}, below your stop-loss of ₹${stopLoss}.`,
        }),
      });
    },
  });

  // Check stop-loss triggers
  useEffect(() => {
    portfolio.forEach(h => {
      const currentPrice = livePrices[h.symbol];
      if (h.stopLoss > 0 && currentPrice && currentPrice <= h.stopLoss) {
        // Here we could check if alert already exists, but for simplicity:
        triggerAlert.mutate({ symbol: h.symbol, name: h.name, price: currentPrice, stopLoss: h.stopLoss });
        toast.warning(`Stop-loss hit for ${h.symbol}! check alerts.`);
      }
    });
  }, [livePrices, portfolio]);

  const addToPortfolio = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_URL}/api/portfolio`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid, symbol: selectedStock.symbol, name: selectedStock.name,
          exchange: selectedStock.exchDisp || selectedStock.exchange,
          entryPrice: Number(entryPrice), quantity: Number(quantity),
          stopLoss: Number(stopLoss) || 0,
        }),
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["portfolio"]);
      queryClient.invalidateQueries(["networth"]);
      setPortfolioOpen(false); setEntryPrice(""); setQuantity(""); setStopLoss("");
      toast.success("Added to portfolio! 🎯");
    },
  });
  const removeFromPortfolio = useMutation({
    mutationFn: async (id) => { await fetch(`${API_URL}/api/portfolio/${id}`, { method: "DELETE" }); },
    onSuccess: () => { 
      queryClient.invalidateQueries(["portfolio"]); 
      queryClient.invalidateQueries(["networth"]);
      toast.success("Removed from portfolio"); 
    },
  });

  const totalInvested = portfolio.reduce((s, h) => s + h.entryPrice * h.quantity, 0);
  const currentTotalValue = portfolio.reduce((s, h) => s + (livePrices[h.symbol] || h.entryPrice) * h.quantity, 0);
  const totalPnL = currentTotalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;



  const RiskBadge = ({ label, color }) => (
    <Badge variant="outline" className="text-xs gap-1" style={{ borderColor: color, color }}>
      {label === "Low" ? <ShieldCheck className="h-3 w-3" /> : label === "Medium" ? <ShieldAlert className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {label} Risk
    </Badge>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display">Investment Tracking</h1>
        <p className="text-muted-foreground text-sm mt-1">Search, analyze, and track your investments in real time</p>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="stocks">
          <TabsList>
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="mf">Mutual Funds</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist ({watchlist.length})</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio ({portfolio.length})</TabsTrigger>
          </TabsList>

          {/* ═══ STOCKS TAB ═══ */}
          <TabsContent value="stocks" className="space-y-4 mt-4">
            <Card className="p-5 glass-card">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={stockQuery} onChange={(e) => { setStockQuery(e.target.value); setSelectedStock(null); }} placeholder="Search by company name (e.g. Tata, ICICI, Reliance)..." className="pl-9 pr-9" />
                {stockSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {/* Search Results Dropdown */}
              {stockResults.length > 0 && !selectedStock && (
                <div className="mt-3 max-h-[300px] overflow-auto space-y-1 border rounded-lg border-border/50">
                  {stockResults.map((s) => (
                    <button key={s.symbol} className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between" onClick={() => setSelectedStock(s)}>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.symbol}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{s.exchDisp || s.exchange}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Selected Stock Details */}
            {selectedStock && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricCard title="Current Price" value={stockMeta?.regularMarketPrice ? `₹${stockMeta.regularMarketPrice.toLocaleString("en-IN")}` : "—"} change={stockMeta?.exchangeName || "NSE"} changeType="neutral" icon={TrendingUp} />
                  <MetricCard title="1Y Return" value={`${sRisk?.change || 0}%`} change={`Volatility: ${sRisk?.volatility || 0}%`} changeType={parseFloat(sRisk?.change) >= 0 ? "positive" : "negative"} icon={BarChart3} />
                  <MetricCard title="Risk Level" value={sRisk?.label || "N/A"} change={selectedStock.symbol} changeType="neutral" icon={AlertTriangle} />
                </div>

                <Card className="p-5 glass-card">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div>
                      <h3 className="font-display font-semibold">{selectedStock.name}</h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{selectedStock.symbol}</Badge>
                        <RiskBadge label={sRisk?.label || "N/A"} color={sRisk?.color || "gray"} />
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" className="gap-1.5 text-amber-500 border-amber-500/30 hover:bg-amber-500/10" onClick={() => addToWatchlist.mutate(selectedStock)}>
                        <Star className="h-3.5 w-3.5" /> Watchlist
                      </Button>
                      <Button size="sm" className="gap-1.5" onClick={() => setPortfolioOpen(true)}>
                        <PlusCircle className="h-3.5 w-3.5" /> Add to Portfolio
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStock(null)}>← Back</Button>
                    </div>
                  </div>

                  {stockLoading ? (
                    <div className="flex items-center justify-center h-[220px] text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading chart...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={stockChartData}>
                        <defs><linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} /></linearGradient></defs>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" interval={Math.floor(stockChartData.length / 6)} />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" domain={["auto", "auto"]} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip formatter={(v) => [`₹${v}`, "Price"]} />
                        <Area type="monotone" dataKey="price" stroke="hsl(217, 91%, 60%)" fill="url(#stockGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </>
            )}

            {debouncedStockQuery.length >= 2 && !selectedStock && !stockSearching && stockResults.length === 0 && (
              <Card className="p-10 glass-card text-center text-muted-foreground">No stocks found for &quot;{debouncedStockQuery}&quot;. Try a different company name.</Card>
            )}

            {/* Add to Portfolio Dialog */}
            <Dialog open={portfolioOpen} onOpenChange={setPortfolioOpen}>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>Add to Portfolio</DialogTitle>
                  <DialogDescription>Enter your buy details for <strong>{selectedStock?.name}</strong> ({selectedStock?.symbol})</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); addToPortfolio.mutate(); }} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Entry Price (₹)</Label>
                    <Input type="number" step="0.01" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="e.g. 2450.50" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 10" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Stop-Loss Price (₹)</Label>
                    <Input type="number" step="0.01" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="Alert me if price drops below this" />
                  </div>
                  {entryPrice && quantity && (
                    <p className="text-sm text-muted-foreground">Total invested: <strong>₹{(Number(entryPrice) * Number(quantity)).toLocaleString("en-IN")}</strong></p>
                  )}
                  <DialogFooter><Button type="submit" disabled={addToPortfolio.isPending}>{addToPortfolio.isPending ? "Adding..." : "Add to Portfolio"}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ═══ MUTUAL FUNDS TAB ═══ */}
          <TabsContent value="mf" className="space-y-4 mt-4">
            <Card className="p-5 glass-card">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={mfQuery} onChange={(e) => { setMfQuery(e.target.value); setSelectedMF(null); }} placeholder="Search mutual funds (e.g. SBI, Axis, HDFC)..." className="pl-9 pr-9" />
                {mfSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {mfResults.length > 0 && !selectedMF && (
                <div className="mt-3 max-h-[300px] overflow-auto space-y-1 border rounded-lg border-border/50">
                  {mfResults.slice(0, 15).map((fund) => (
                    <button key={fund.schemeCode} className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors" onClick={() => setSelectedMF(fund)}>
                      <p className="text-sm font-medium truncate">{fund.schemeName}</p>
                      <p className="text-xs text-muted-foreground">Code: {fund.schemeCode}</p>
                    </button>
                  ))}
                </div>
              )}
            </Card>
            {selectedMF && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricCard title="Current NAV" value={mfChartData.length ? `₹${mfChartData[mfChartData.length - 1]?.nav}` : "—"} change={mfData?.meta?.scheme_category || ""} changeType="neutral" icon={TrendingUp} />
                  <MetricCard title="1Y Return" value={`${mfRisk.returnPct}%`} change={`Volatility: ${mfRisk.volatility}%`} changeType={parseFloat(mfRisk.returnPct) >= 0 ? "positive" : "negative"} icon={BarChart3} />
                  <MetricCard title="Risk Level" value={mfRisk.label} change={mfData?.meta?.fund_house || ""} changeType="neutral" icon={AlertTriangle} />
                </div>
                <Card className="p-5 glass-card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display font-semibold text-sm truncate max-w-[500px]">{selectedMF.schemeName}</h3>
                      <div className="flex gap-2 mt-1">
                        {mfData?.meta?.scheme_type && <Badge variant="secondary" className="text-xs">{mfData.meta.scheme_type}</Badge>}
                        <RiskBadge label={mfRisk.label} color={mfRisk.color} />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMF(null)}>← Back</Button>
                  </div>
                  {mfLoading ? (
                    <div className="flex items-center justify-center h-[220px] text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading chart...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={mfChartData}>
                        <defs><linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} /></linearGradient></defs>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" interval={Math.floor(mfChartData.length / 6)} />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" domain={["auto", "auto"]} />
                        <Tooltip formatter={(v) => [`₹${v}`, "NAV"]} />
                        <Area type="monotone" dataKey="nav" stroke="hsl(160, 84%, 39%)" fill="url(#navGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </>
            )}
            {!selectedMF && mfResults.length === 0 && debouncedMfQuery.length >= 2 && !mfSearching && (
              <Card className="p-10 glass-card text-center text-muted-foreground">No mutual funds found for &quot;{debouncedMfQuery}&quot;.</Card>
            )}
          </TabsContent>

          {/* ═══ WATCHLIST TAB ═══ */}
          <TabsContent value="watchlist" className="mt-4">
            <Card className="glass-card overflow-hidden">
              {watchlist.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Star className="h-10 w-10 mx-auto mb-3 text-amber-500/40" />
                  <p className="font-medium">Your watchlist is empty</p>
                  <p className="text-sm mt-1">Search for stocks and click ⭐ Watchlist to add them here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Stock</th>
                        <th className="text-left p-3 font-medium">Symbol</th>
                        <th className="text-left p-3 font-medium">Exchange</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchlist.map((w) => (
                        <tr key={w._id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-3 font-medium">{w.name}</td>
                          <td className="p-3"><Badge variant="secondary" className="text-xs">{w.symbol}</Badge></td>
                          <td className="p-3 text-muted-foreground">{w.exchange}</td>
                          <td className="p-3 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80 hover:bg-primary/10" title="Ask AI Advisor" onClick={() => {
                                navigate('/ai-advisor', { state: { initialQuery: `Analyze ${w.name} (${w.symbol}) from my watchlist. Is it a good buy right now?` } });
                              }}>
                                <Brain className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedStock({ symbol: w.symbol, name: w.name, exchange: w.exchange }); }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromWatchlist.mutate(w._id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ═══ PORTFOLIO TAB ═══ */}
          <TabsContent value="portfolio" className="space-y-4 mt-4">
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard title="Total Invested" value={`₹${totalInvested.toLocaleString("en-IN")}`} change={`${portfolio.length} holdings`} changeType="neutral" icon={TrendingUp} />
              <MetricCard title="Current Value" value={`₹${currentTotalValue.toLocaleString("en-IN")}`} change={totalPnL >= 0 ? `+₹${totalPnL.toLocaleString("en-IN")}` : `-₹${Math.abs(totalPnL).toLocaleString("en-IN")}`} changeType={totalPnL >= 0 ? "positive" : "negative"} icon={BarChart3} />
              <MetricCard title="Overall P&L" value={`${totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString("en-IN")}`} change={`${totalPnLPct.toFixed(2)}%`} changeType={totalPnL >= 0 ? "positive" : "negative"} icon={AlertTriangle} />
            </motion.div>

            <Card className="glass-card overflow-hidden">
              {portfolio.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <PlusCircle className="h-10 w-10 mx-auto mb-3 text-primary/40" />
                  <p className="font-medium">No holdings yet</p>
                  <p className="text-sm mt-1">Search for stocks and click &quot;Add to Portfolio&quot; to start tracking.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Stock</th>
                        <th className="text-right p-3 font-medium">Qty</th>
                        <th className="text-right p-3 font-medium">Avg. Cost</th>
                        <th className="text-right p-3 font-medium">Current</th>
                        <th className="text-right p-3 font-medium">Stop-Loss</th>
                        <th className="text-right p-3 font-medium">P&L</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((h) => {
                        const currentPrice = livePrices[h.symbol] || h.entryPrice;
                        const pnl = (currentPrice - h.entryPrice) * h.quantity;
                        const pnlPct = (pnl / (h.entryPrice * h.quantity)) * 100;

                        return (
                          <tr key={h._id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <p className="font-medium">{h.name}</p>
                              <p className="text-xs text-muted-foreground">{h.symbol}</p>
                            </td>
                            <td className="p-3 text-right">{h.quantity}</td>
                            <td className="p-3 text-right">₹{h.entryPrice.toLocaleString("en-IN")}</td>
                            <td className="p-3 text-right">₹{currentPrice.toLocaleString("en-IN")}</td>
                            <td className="p-3 text-right text-warning font-medium">
                              {h.stopLoss > 0 ? `₹${h.stopLoss.toLocaleString("en-IN")}` : "—"}
                            </td>
                            <td className={`p-3 text-right font-medium ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                              <div>{pnl >= 0 ? "+" : ""}₹{Math.abs(pnl).toLocaleString("en-IN")}</div>
                              <div className="text-[10px] font-normal">{pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80 hover:bg-primary/10" title="Ask AI Advisor" onClick={() => {
                                  navigate('/ai-advisor', { state: { initialQuery: `I own ${h.quantity} shares of ${h.name} (${h.symbol}) bought at ₹${h.entryPrice}. It's currently at ₹${currentPrice}. Should I hold, sell, or buy more?` } });
                                }}>
                                  <Brain className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedStock({ symbol: h.symbol, name: h.name, exchange: h.exchange }); }}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromPortfolio.mutate(h._id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
