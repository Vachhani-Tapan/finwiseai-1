import express from 'express';
import Groq from 'groq-sdk';
import Portfolio from '../models/Portfolio.js';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Goal from '../models/Goal.js';

const router = express.Router();

// Helper to calculate risk (volatility) of a stock using Yahoo Finance
async function fetchStockVolatility(symbol) {
  try {
    const res = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`);
    if (!res.ok) return { label: 'Medium', volatility: 15 };
    const data = await res.json();
    const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    if (closes.length < 20) return { label: 'Medium', volatility: 15 };
    
    // Calculate simple historical volatility
    const dailyReturns = [];
    for (let i = 1; i < closes.length; i++) {
      if (closes[i-1] > 0) dailyReturns.push((closes[i] - closes[i-1]) / closes[i-1]);
    }
    const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((s, r) => s + (r - mean)**2, 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

    let label = "Low";
    if (volatility > 30) label = "High";
    else if (volatility > 15) label = "Medium";

    return { label, volatility: volatility.toFixed(2) };
  } catch (err) {
    return { label: 'Medium', volatility: 15 };
  }
}

router.post('/analyze', async (req, res) => {
  try {
    const { uid, message } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(500).json({ error: 'Groq API key is missing. Please configure it in .env' });
    }

    // 1. Gather User's Financial Data
    const [portfolioItems, expenses, budgets, savingsProfile, goals] = await Promise.all([
      Portfolio.find({ userId: uid }),
      Expense.find({ userId: uid }),
      Budget.findOne({ userId: uid }),
      SavingsGoal.findOne({ userId: uid }),
      Goal.find({ userId: uid })
    ]);

    // 2. Enhance portfolio data with risk metrics
    const portfolioWithRisk = await Promise.all(portfolioItems.map(async (item) => {
      const risk = await fetchStockVolatility(item.symbol);
      return {
        symbol: item.symbol,
        name: item.name,
        investedAmount: item.entryPrice * item.quantity,
        riskLevel: risk.label,
        volatility: risk.volatility + '%'
      };
    }));

    // 3. Summarize Expenses & Budget
    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalSpentThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBudget = budgets?.budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;
    const monthlySavings = savingsProfile?.monthlySavings || 0;
    const monthlySalary = savingsProfile?.monthlySalary || 0;

    // 4. Construct the prompt for Groq
    const systemPrompt = `You are a professional, expert AI Financial Advisor for the FinWise App. 
Analyze the user's financial data and answer their specific question.
Format your response in Markdown, using bullet points and bold text for readability.

### Financial Data Context:
- **Monthly Salary/Income:** ₹${monthlySalary}
- **Total Monthly Budget:** ₹${totalBudget}
- **Total Spent This Month:** ₹${totalSpentThisMonth}
- **Target Monthly Savings:** ₹${monthlySavings}
- **Financial Goals:**
${goals.length > 0 ? goals.map(g => `  - ${g.name}: Target ₹${g.target}, Current ₹${g.current}, Deadline: ${g.deadline}`).join('\n') : '  - No specific goals set yet.'}
- **Portfolio Details:**
${portfolioWithRisk.length > 0 ? portfolioWithRisk.map(p => `  - ${p.name} (${p.symbol}): Invested ₹${p.investedAmount}, Risk Level: ${p.riskLevel} (Vol: ${p.volatility})`).join('\n') : '  - No investments yet.'}

### Instructions:
1. Direct Answer: Answer the user's specific question: "${message}"
2. Emergency Fund logic: If the user asks about an emergency fund, recommend setting aside 3-6 months of their expenses (estimated at ₹${totalBudget || 50000}) or a percentage of their salary (₹${monthlySalary}).
3. Investment Strategy: Based on their salary of ₹${monthlySalary} and current goals, suggest a balanced allocation strategy (e.g., 50/30/20 rule or custom based on goals).
4. Risk Management: Identify any high-risk investments in their portfolio. Advise them to allocate smaller amounts to high-risk stocks.
5. Keep it actionable, clear, and professional.
6. End with a standard disclaimer: "*Disclaimer: This is AI-generated financial information, not professional advice.*"`;

    // 5. Call Groq API
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a professional financial advisor.' },
        { role: 'user', content: systemPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const aiResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    res.json({ response: aiResponse });

  } catch (error) {
    console.error('AI Advisor Error:', error);
    res.status(500).json({ error: 'Failed to generate AI advice.' });
  }
});

export default router;
