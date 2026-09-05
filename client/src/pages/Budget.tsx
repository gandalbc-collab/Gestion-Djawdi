import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useCurrentMonth } from "@/hooks/useCurrentMonth";
import { formatAmount, type Currency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
    <select value={month} onChange={(e) => setMonth(e.target.value)}
      className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring capitalize">
      {months.map((m) => <option key={m.val} value={m.val}>{m.label}</option>)}
    </select>
  );
}

const catSchema = z.object({
  name: z.string().min(1).max(64),
  icon: z.string().max(8).optional(),
  description: z.string().max(128).optional(),
});
type CatForm = z.infer<typeof catSchema>;

export default function BudgetPage() {
  const { month, setMonth } = useCurrentMonth();
  const { data: profile } = trpc.profile.get.useQuery();
  const currency = (profile?.currency ?? "GNF") as Currency;
  const utils = trpc.useUtils();

  const { data: categories, isLoading: catLoading } = trpc.categories.list.useQuery();
  const { data: budgets, isLoading: budLoading } = trpc.budgets.list.useQuery({ month });
  const { data: revenues } = trpc.revenues.list.useQuery({ month });

  const [budgetInputs, setBudgetInputs] = useState<Record<number, string>>({});
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  const upsertMutation = trpc.budgets.upsert.useMutation({
    onSuccess: () => { utils.budgets.list.invalidate(); toast.success("Budget mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
  const createCatMutation = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setCatDialogOpen(false); toast.success("Catégorie créée"); catReset(); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const { register: catReg, handleSubmit: catSubmit, reset: catReset, formState: { errors: catErrors } } = useForm<CatForm>({ resolver: zodResolver(catSchema) as any });

  const budgetMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const b of budgets ?? []) map[b.categoryId] = parseFloat(b.amount);
    return map;
  }, [budgets]);

  const totalBudget = useMemo(() => Object.values(budgetMap).reduce((s, v) => s + v, 0), [budgetMap]);
  const totalRevenues = useMemo(() => (revenues ?? []).reduce((s, r) => s + parseFloat(r.amount), 0), [revenues]);
  const remaining = totalRevenues - totalBudget;

  const handleBudgetSave = (categoryId: number) => {
    const raw = budgetInputs[categoryId];
    const amount = parseFloat(raw ?? "0");
    if (isNaN(amount) || amount < 0) { toast.error("Montant invalide"); return; }
    upsertMutation.mutate({ categoryId, amount, month });
    setBudgetInputs((prev) => { const n = { ...prev }; delete n[categoryId]; return n; });
  };

  const isLoading = catLoading || budLoading;

  return (
    <AppLayout title="Budget">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Budget</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Planifiez vos dépenses par catégorie</p>
          </div>
          <div className="flex items-center gap-3">
            <MonthPicker month={month} setMonth={setMonth} />
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Catégorie</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle catégorie</DialogTitle></DialogHeader>
                <form onSubmit={catSubmit((d) => createCatMutation.mutate(d))} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Nom</Label>
                    <Input placeholder="ex: Animaux" {...catReg("name")} />
                    {catErrors.name && <p className="text-xs text-destructive">{catErrors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Icône (emoji)</Label>
                    <Input placeholder="🐾" maxLength={8} {...catReg("icon")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description (optionnel)</Label>
                    <Input placeholder="Brève description" {...catReg("description")} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createCatMutation.isPending}>
                    {createCatMutation.isPending ? "Création…" : "Créer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Revenus du mois</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatAmount(totalRevenues, currency)}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Budget alloué</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatAmount(totalBudget, currency)}</p>
            </CardContent>
          </Card>
          <Card className={`shadow-sm ${remaining < 0 ? "border-red-200 bg-red-50/50" : "border-amber-200 bg-amber-50/50"}`}>
            <CardContent className="pt-5 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Reste à allouer</p>
                <p className={`text-2xl font-bold mt-1 ${remaining < 0 ? "text-red-600" : "text-amber-600"}`}>{formatAmount(remaining, currency)}</p>
              </div>
              {remaining < 0 && <AlertCircle className="h-5 w-5 text-red-500 mt-1" />}
            </CardContent>
          </Card>
        </div>

        {/* Category budget table */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Allocation par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (
              <div className="divide-y divide-border/50">
                {(categories ?? []).map((cat) => {
                  const current = budgetMap[cat.id] ?? 0;
                  const inputVal = budgetInputs[cat.id] ?? String(current === 0 ? "" : current);
                  const pct = totalBudget > 0 ? Math.round((current / totalBudget) * 100) : 0;
                  return (
                    <div key={cat.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/20 transition-colors">
                      <span className="text-xl shrink-0">{cat.icon}</span>
                      {/* Mobile: stack name above input. Desktop: name left, input right */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{cat.name}</span>
                          {cat.isCustom && <Badge variant="secondary" className="text-xs py-0 shrink-0">Custom</Badge>}
                        </div>
                        {current > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                          </div>
                        )}
                        {/* Input shown below name on mobile */}
                        <div className="flex items-center gap-2 md:hidden">
                          <Input
                            type="number" min="0" step="any"
                            value={inputVal}
                            onChange={(e) => setBudgetInputs((p) => ({ ...p, [cat.id]: e.target.value }))}
                            onBlur={() => handleBudgetSave(cat.id)}
                            onKeyDown={(e) => e.key === "Enter" && handleBudgetSave(cat.id)}
                            className="w-full max-w-[160px] text-right text-sm"
                            placeholder="0"
                          />
                          <span className="text-xs text-muted-foreground shrink-0">{currency}</span>
                        </div>
                      </div>
                      {/* Input shown on the right only on md+ */}
                      <div className="hidden md:flex items-center gap-2 shrink-0">
                        <Input
                          type="number" min="0" step="any"
                          value={inputVal}
                          onChange={(e) => setBudgetInputs((p) => ({ ...p, [cat.id]: e.target.value }))}
                          onBlur={() => handleBudgetSave(cat.id)}
                          onKeyDown={(e) => e.key === "Enter" && handleBudgetSave(cat.id)}
                          className="w-32 text-right text-sm"
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground w-10">{currency}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
