import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Brain } from "lucide-react";

export function Login() {
  const { user, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // On success, AuthContext will update 'user', triggering re-render and navigate
    } catch (error) {
      console.error("Failed to sign in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 -left-10 md:-left-20 w-72 md:w-96 h-72 md:h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 md:w-[28rem] h-80 md:h-[28rem] bg-emerald-400/20 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
      
      <div className="w-full max-w-md space-y-8 glass-card rounded-2xl p-8 relative z-10 shadow-2xl border border-border/40">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6 shadow-inner ring-1 ring-primary/20">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground font-display">
            Welcome to FinWise AI
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs mx-auto">
            Your intelligent personal finance companion. Sign in to continue your journey.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-xl border border-border/50 bg-card px-4 py-4 text-sm font-medium text-foreground hover:bg-muted/80 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <svg className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </span>
            {isLoading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground text-xs rounded-full">Secure authenticaton</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
