import { Card } from "@/components/ui/card";
import { Bell, TrendingDown, TrendingUp, AlertTriangle, Target, Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const iconMap = {
  TrendingDown, TrendingUp, AlertTriangle, Target, Calendar, Bell
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Alerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts", user?.uid],
    queryFn: async () => {
      const r = await fetch(`${API_URL}/api/alerts?uid=${user.uid}`);
      return r.json();
    },
    enabled: !!user?.uid,
  });

  const markRead = useMutation({
    mutationFn: async (id) => {
      await fetch(`${API_URL}/api/alerts/${id}/read`, { method: "PATCH" });
    },
    onSuccess: () => queryClient.invalidateQueries(["alerts"]),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Smart Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time notifications for your finances</p>
        </div>
        <Badge variant="secondary">{alerts.filter((a) => !a.read).length} unread</Badge>
      </motion.div>

      {alerts.length === 0 ? (
        <motion.div variants={item}>
          <Card className="p-10 glass-card text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm mt-1">New notifications will appear here.</p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const Icon = iconMap[a.icon] || Bell;
            return (
              <motion.div key={a._id} variants={item} onClick={() => !a.read && markRead.mutate(a._id)} className="cursor-pointer">
                <Card className={`p-4 glass-card flex items-start gap-4 transition-all hover:bg-muted/30 ${!a.read ? "border-l-2 border-l-primary shadow-lg" : "opacity-70"}`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    a.type === "success" ? "bg-success/10" : a.type === "warning" ? "bg-warning/10" : a.type === "destructive" ? "bg-destructive/10" : "bg-info/10"
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      a.type === "success" ? "text-success" : a.type === "warning" ? "text-warning" : a.type === "destructive" ? "text-destructive" : "text-info"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{a.title}</h3>
                      <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.desc}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
