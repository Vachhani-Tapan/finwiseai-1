import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({ title, value, change, changeType = "neutral", icon: Icon, className }) {
  return (
    <Card className={cn("p-5 glass-card", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-display">{value}</p>
          {change && (
            <p className={cn(
              "text-xs font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
