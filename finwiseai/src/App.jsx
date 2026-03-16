import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Expenses from "./pages/Expenses";
import Investments from "./pages/Investments";
import Goals from "./pages/Goals";
import NetWorth from "./pages/NetWorth";
import AIAdvisor from "./pages/AIAdvisor";
import Alerts from "./pages/Alerts";
import TaxPlanner from "./pages/TaxPlanner";
import DebtPlanner from "./pages/DebtPlanner";
import FDOptimizer from "./pages/FDOptimizer";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><DashboardLayout><Index /></DashboardLayout></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><DashboardLayout><Expenses /></DashboardLayout></ProtectedRoute>} />
            <Route path="/investments" element={<ProtectedRoute><DashboardLayout><Investments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><DashboardLayout><Goals /></DashboardLayout></ProtectedRoute>} />
            <Route path="/net-worth" element={<ProtectedRoute><DashboardLayout><NetWorth /></DashboardLayout></ProtectedRoute>} />
            <Route path="/ai-advisor" element={<ProtectedRoute><DashboardLayout><AIAdvisor /></DashboardLayout></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><DashboardLayout><Alerts /></DashboardLayout></ProtectedRoute>} />
            <Route path="/tax-planner" element={<ProtectedRoute><DashboardLayout><TaxPlanner /></DashboardLayout></ProtectedRoute>} />
            <Route path="/debt-planner" element={<ProtectedRoute><DashboardLayout><DebtPlanner /></DashboardLayout></ProtectedRoute>} />
            <Route path="/fd-optimizer" element={<ProtectedRoute><DashboardLayout><FDOptimizer /></DashboardLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
