import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useCurrentMonth } from "@/hooks/useCurrentMonth";
import { formatAmount, type Currency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, Target, BarChart3, ArrowUpRight, ArrowDownRight, GraduationCap, Youtube } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AdBanner } from "@/components/AdBanner";

function MonthPicker({ month, setMonth }: { month: string; setMonth: (m: string) => void }) {
  const months = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      result.push({ val, label });
    }
    return result;
  }, []);

  return (
    <select
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize"
    >
      {months.map((m) => (
        <option key={m.val} value={m.val}>{m.label}</option>
      ))}
    </select>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  loading?: boolean;
  color?: string;
  onClick?: () => void;
  extra?: React.ReactNode;
}

function KPICard({ title, value, icon, trend, subtitle, loading, color = "text-primary", onClick, extra }: KPICardProps) {
  return (
    <Card
      className={`shadow-sm hover:shadow-md transition-shadow border-border/60 ${onClick ? "cursor-pointer hover:border-primary/40 active:scale-[0.98] transition-transform" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:pt-6 sm:px-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            {loading ? (
              <Skeleton className="h-7 w-32 mt-1" />
            ) : (
              <p className={`text-base sm:text-2xl font-bold truncate ${color}`}>{value}</p>
            )}
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl bg-primary/10 shrink-0 ml-3`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            {trend === "up" ? (
              <><ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /><span className="text-xs text-emerald-600 font-medium">En hausse</span></>
            ) : trend === "down" ? (
              <><ArrowDownRight className="h-3.5 w-3.5 text-red-500" /><span className="text-xs text-red-500 font-medium">En baisse</span></>
            ) : null}
          </div>
        )}
        {extra && <div className="mt-2">{extra}</div>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { month, setMonth } = useCurrentMonth();
  const { data: profile } = trpc.profile.get.useQuery();
  const currency = (profile?.currency ?? "GNF") as Currency;

  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: learningSettings } = trpc.learning.settings.useQuery();
  const { data: coursesData } = trpc.learning.list.useQuery();
  const { data: myProgress } = trpc.learning.myProgress.useQuery(undefined, { enabled: isAuthenticated });
  const { data: revenuesData, isLoading: revLoading } = trpc.revenues.list.useQuery({ month });
  const { data: expensesData, isLoading: expLoading } = trpc.expenses.list.useQuery({ month });
  const { data: budgetsData, isLoading: budLoading } = trpc.budgets.list.useQuery({ month });
  const { data: synthesisData } = trpc.synthesis.history.useQuery();

  const totalRevenues = useMemo(() =>
    (revenuesData ?? []).reduce((s, r) => s + parseFloat(r.amount), 0), [revenuesData]);
  const totalExpenses = useMemo(() =>
    (expensesData ?? []).reduce((s, e) => s + parseFloat(e.amount), 0), [expensesData]);
  const totalBudget = useMemo(() =>
    (budgetsData ?? []).reduce((s, b) => s + parseFloat(b.amount), 0), [budgetsData]);
  const surplus = totalRevenues - totalExpenses;
  const executionRate = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

  const totalCourses = coursesData?.length ?? 0;
  const completedCourses = (coursesData ?? []).filter(c => (myProgress ?? []).some(p => p.courseId === c.id)).length;
  const learnPct = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  const isLoading = revLoading || expLoading || budLoading;

  const chartData = useMemo(() => {
    if (!synthesisData) return [];
    return synthesisData.slice(0, 6).reverse().map((row) => ({
      month: row.month.slice(5),
      Revenus: row.revenues,
      Dépenses: row.expenses,
      Budget: row.budget,
    }));
  }, [synthesisData]);

  return (
    <AppLayout title="Tableau de bord">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <AdBanner position="dashboard_top" />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Vue d'ensemble de vos finances</p>
          </div>
          <MonthPicker month={month} setMonth={setMonth} />
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4">
          <KPICard
            title="Revenus"
            value={formatAmount(totalRevenues, currency)}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            loading={isLoading}
            color="text-emerald-600"
          />
          <KPICard
            title="Budget prévu"
            value={formatAmount(totalBudget, currency)}
            icon={<Target className="h-5 w-5 text-primary" />}
            loading={isLoading}
            color="text-blue-600"
          />
          <KPICard
            title="Dépenses réelles"
            value={formatAmount(totalExpenses, currency)}
            icon={<TrendingDown className="h-5 w-5 text-primary" />}
            loading={isLoading}
            color={totalExpenses > totalBudget ? "text-red-600" : "text-foreground"}
          />
          <KPICard
            title="Excédent / Déficit"
            value={formatAmount(surplus, currency)}
            icon={<Wallet className="h-5 w-5 text-primary" />}
            loading={isLoading}
            color={surplus >= 0 ? "text-emerald-600" : "text-red-600"}
            trend={surplus >= 0 ? "up" : "down"}
          />
          <KPICard
            title="Taux d'exécution"
            value={`${executionRate}%`}
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
            loading={isLoading}
            subtitle={`${formatAmount(totalExpenses, currency)} / ${formatAmount(totalBudget, currency)}`}
            color={executionRate > 100 ? "text-red-600" : executionRate > 80 ? "text-amber-600" : "text-foreground"}
          />
          <KPICard
            title="Apprendre"
            value={totalCourses > 0 ? `${completedCourses}/${totalCourses}` : "—"}
            icon={<GraduationCap className="h-5 w-5 text-violet-500" />}
            loading={false}
            subtitle={totalCourses > 0 ? `${learnPct}% complété` : "Aucun cours"}
            color="text-violet-600"
            onClick={() => navigate("/learn")}
            extra={
              learningSettings?.showYoutubeButton !== false ? (
                <a
                  href={learningSettings?.youtubeChannelUrl ?? "https://youtube.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors group"
                >
                  <Youtube className="h-3.5 w-3.5 animate-pulse group-hover:animate-none" />
                  <span>Chaîne YouTube</span>
                </a>
              ) : null
            }
          />
        </div>

        {/* Execution rate bar */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Taux d'exécution budgétaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dépenses vs Budget</span>
                <span className={`font-semibold ${executionRate > 100 ? "text-red-600" : "text-foreground"}`}>{executionRate}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${executionRate > 100 ? "bg-red-500" : executionRate > 80 ? "bg-amber-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(executionRate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="text-amber-600 font-medium">80% seuil</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Historique 6 derniers mois</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.012 155)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => {
                    const numericValue = Number(Array.isArray(value) ? value[0] : value);
                    return Number.isFinite(numericValue) ? formatAmount(numericValue, currency) : String(value ?? "");
                  }} />
                  <Bar dataKey="Revenus" fill="oklch(0.50 0.17 155)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Dépenses" fill="oklch(0.63 0.20 30)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Budget" fill="oklch(0.70 0.15 80)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary inline-block" />Revenus</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[oklch(0.63_0.20_30)] inline-block" />Dépenses</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[oklch(0.70_0.15_80)] inline-block" />Budget</span>
              </div>
            </CardContent>
          </Card>
        )}
        <AdBanner position="dashboard_bottom" />
      </div>
    </AppLayout>
  );
}
