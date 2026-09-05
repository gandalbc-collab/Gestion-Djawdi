import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useCurrentMonth } from "@/hooks/useCurrentMonth";
import { formatAmount, type Currency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  categoryId: z.coerce.number().int().positive("Catégorie requise"),
  description: z.string().min(1, "Description requise").max(128),
  amount: z.coerce.number().positive("Montant invalide").max(999_999_999),
});
type FormData = z.infer<typeof schema>;

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

export default function ExpensesPage() {
  const { month, setMonth } = useCurrentMonth();
  const { data: profile } = trpc.profile.get.useQuery();
  const currency = (profile?.currency ?? "GNF") as Currency;
  const utils = trpc.useUtils();

  const { data: categories } = trpc.categories.list.useQuery();
  const { data, isLoading } = trpc.expenses.list.useQuery({ month });
  const { data: budgets } = trpc.budgets.list.useQuery({ month });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLabel, setDeleteLabel] = useState("");

  const addMutation = trpc.expenses.add.useMutation({
    onSuccess: () => { utils.expenses.list.invalidate(); toast.success("Dépense ajoutée"); reset(); },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });
  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => { utils.expenses.list.invalidate(); toast.success("Dépense supprimée"); setDeleteId(null); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) as any });

  const catMap = useMemo(() => {
    const m: Record<number, { name: string; icon: string }> = {};
    for (const c of categories ?? []) m[c.id] = { name: c.name, icon: c.icon };
    return m;
  }, [categories]);

  const budgetMap = useMemo(() => {
    const m: Record<number, number> = {};
    for (const b of budgets ?? []) m[b.categoryId] = parseFloat(b.amount);
    return m;
  }, [budgets]);

  const expByCategory = useMemo(() => {
    const m: Record<number, number> = {};
    for (const e of data ?? []) m[e.categoryId] = (m[e.categoryId] ?? 0) + parseFloat(e.amount);
    return m;
  }, [data]);

  const total = useMemo(() => (data ?? []).reduce((s, e) => s + parseFloat(e.amount), 0), [data]);
  const totalBudget = useMemo(() => Object.values(budgetMap).reduce((s, v) => s + v, 0), [budgetMap]);

  const onSubmit = (values: FormData) => {
    addMutation.mutate({ ...values, month });
  };

  return (
    <AppLayout title="Dépenses">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dépenses</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Suivez vos sorties d'argent</p>
          </div>
          <MonthPicker month={month} setMonth={setMonth} />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total dépensé</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatAmount(total, currency)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Budget prévu</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatAmount(totalBudget, currency)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Reste budget</p>
              <p className={`text-2xl font-bold mt-1 ${totalBudget - total < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {formatAmount(totalBudget - total, currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add form */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" />Ajouter une dépense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Catégorie</Label>
                <Controller name="categoryId" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Input placeholder="ex: Loyer, Courses…" {...register("description")} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Montant ({currency})</Label>
                <Input type="number" placeholder="0" min="0" step="any" {...register("amount")} className="w-36" />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <Button type="submit" disabled={addMutation.isPending} className="shrink-0">
                {addMutation.isPending ? "…" : "Ajouter"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dépenses du mois</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : !data?.length ? (
              <div className="p-12 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune dépense enregistrée pour ce mois.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {data.map((exp) => {
                  const cat = catMap[exp.categoryId];
                  const bud = budgetMap[exp.categoryId] ?? 0;
                  const spent = expByCategory[exp.categoryId] ?? 0;
                  const over = bud > 0 && spent > bud;
                  return (
                    <div key={exp.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{cat?.icon ?? "📌"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{exp.description}</p>
                          <p className="text-xs text-muted-foreground">{cat?.name ?? "—"} {over && <span className="text-red-500 font-medium">· Dépassement</span>}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-bold text-red-600">{formatAmount(parseFloat(exp.amount), currency)}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => { setDeleteId(exp.id); setDeleteLabel(exp.description); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <div className="px-6 py-3 bg-muted/20 flex justify-between items-center">
                  <span className="text-sm font-semibold text-muted-foreground">Total</span>
                  <span className="text-base font-bold text-red-600">{formatAmount(total, currency)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment supprimer la dépense <strong>"{deleteLabel}"</strong> ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
