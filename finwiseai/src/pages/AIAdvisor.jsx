import { Card } from "@/components/ui/card";
import { Brain, Send, Bot, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


const suggestedQuestions = [
  "What should be my emergency fund based on my salary?",
  "Give me an investment strategy for my goals",
  "How much of my income should I save monthly?",
  "Should I increase my SIP in midcap funds?",
  "Analyze my spending pattern this month",
];

const initialMessages = [
  {
    role: "assistant",
    content: "Hello! I'm your AI Financial Advisor. I can help you with investment analysis, expense optimization, goal planning, and tax strategies. What would you like to know?",
  },
];

export default function AIAdvisor() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Read initial query from route state (e.g. from Investments page)
  useEffect(() => {
    if (location.state?.initialQuery) {
      const query = location.state.initialQuery;
      // Clear state so it doesn't re-trigger on refresh
      navigate(location.pathname, { replace: true, state: {} });
      handleSend(query);
    }
  }, [location.state]);

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim() || isGenerating) return;
    
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsGenerating(true);

    try {
      const res = await fetch(`${API_URL}/api/ai-advisor/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          message: msg
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "An error occurred with the AI Advisor.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Sorry, I encountered an error connecting to the AI service. Please check your API key and try again." },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 h-[calc(100vh-7rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold font-display">AI Financial Advisor</h1>
        <p className="text-muted-foreground text-sm mt-1">Get personalized insights powered by AI</p>
      </div>

      <Card className="flex-1 glass-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl p-4 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted shadow-sm"}`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-xl p-4 flex flex-col gap-2 shadow-sm min-w-[200px]">
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Analyzing your data...
                </div>
                <div className="space-y-1.5 opacity-50">
                  <div className="h-2 bg-foreground/10 rounded w-full animate-pulse"></div>
                  <div className="h-2 bg-foreground/10 rounded w-5/6 animate-pulse"></div>
                  <div className="h-2 bg-foreground/10 rounded w-4/6 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t space-y-3">
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <button key={q} onClick={() => handleSend(q)} className="text-xs bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your finances..."
              className="flex-1 h-10 rounded-lg bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              disabled={isGenerating}
            />
            <Button onClick={() => handleSend()} size="icon" className="h-10 w-10 shrink-0" disabled={isGenerating || !input.trim()}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
