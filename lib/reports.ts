type ExpenseRow = { amount: number; category: string; date: string };
type InvoiceRow = { amount: number; status: string; invoice_date: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function aggregateByMonth(
  expenses: ExpenseRow[],
  invoices: InvoiceRow[],
  year: string
) {
  return MONTHS.map((month, i) => {
    const monthNum = String(i + 1).padStart(2, "0");
    const prefix = `${year}-${monthNum}`;

    const monthExpenses = expenses
      .filter((e) => e.date?.startsWith(prefix))
      .reduce((s, e) => s + Number(e.amount), 0);

    const monthRevenue = invoices
      .filter((inv) => inv.status === "Paid" && inv.invoice_date?.startsWith(prefix))
      .reduce((s, inv) => s + Number(inv.amount), 0);

    return {
      month,
      expenses: monthExpenses,
      revenue: monthRevenue,
      profit: monthRevenue - monthExpenses,
    };
  }).filter((d) => d.expenses > 0 || d.revenue > 0);
}

export function aggregateByCategory(expenses: ExpenseRow[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.category] = (map[e.category] || 0) + Number(e.amount);
  }

  const colors = ["#6366f1", "#f43f5e", "#f97316", "#8b5cf6", "#06b6d4", "#84cc16", "#ec4899", "#14b8a6"];
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
}

export function topExpensesByCategory(expenses: ExpenseRow[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.category] = (map[e.category] || 0) + Number(e.amount);
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({
      name: category,
      category,
      amount,
      change: "—",
    }));
}

export function spentByCategory(expenses: { category: string; amount: number }[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.category] = (map[e.category] || 0) + Number(e.amount);
  }
  return map;
}

export function campaignMonthlyData(
  campaigns: { invested: number; returned: number; start_date: string | null; created_at: string }[]
) {
  const map: Record<string, { invested: number; returned: number }> = {};

  for (const c of campaigns) {
    const raw = c.start_date || c.created_at?.slice(0, 7) || "";
    const label = raw.length >= 7
      ? `${MONTHS[parseInt(raw.slice(5, 7), 10) - 1]} ${raw.slice(2, 4)}`
      : "Unknown";

    if (!map[label]) map[label] = { invested: 0, returned: 0 };
    map[label].invested += Number(c.invested);
    map[label].returned += Number(c.returned);
  }

  return Object.entries(map).map(([month, d]) => ({
    month,
    invested: d.invested,
    returned: d.returned,
    roi: d.invested > 0 ? Math.round(((d.returned - d.invested) / d.invested) * 100) : 0,
  }));
}
