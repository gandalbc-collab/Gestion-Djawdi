import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useCurrentMonth } from "@/hooks/useCurrentMonth";
import { formatAmount, type Currency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
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

export default function Revenues() {
  const { month, setMonth } = useCurrentMonth();
  const { data: profile } = trpc.profile.get.useQuery();
  const currency = (profile?.currency ?? "GNF") as Currency;
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.revenues.list.useQuery({ month });
  const addMutation = trpc.revenues.add.useMutation({
    onSuccess: () => { utils.revenues.list.invalidate(); toast.success("Revenu ajouté"); reset(); },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });
  const deleteMutation = trpc.revenues.delete.useMutation({
    onSuccess: () => { utils.revenues.list.invalidate(); toast.success("Revenu supprimé"); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) as any });
  const total = useMemo(() => (data ?? []).reduce((s, r) => s + parseFloat(r.amount), 0), [data]);

  const onSubmit = (values: FormData) => {
    addMutation.mutate({ ...values, month });
  };

  return (
    <AppLayout title="Revenus">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Revenus</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Gérez vos entrées d'argent mensuelles</p>
          </div>
          <MonthPicker month={month} setMonth={setMonth} />
        </div>

        {/* Total card */}
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total du mois</p>
              <p className="text-3xl font-bold text-emerald-600">{formatAmount(total, currency)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Add form */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" />Ajouter un revenu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-medium">Description</Label>
                <Input id="description" placeholder="ex: Salaire, Freelance…" {...register("description")} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-medium">Montant ({currency})</Label>
                <Input id="amount" type="number" placeholder="0" min="0" step="any" {...register("amount")} className="w-40" />
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
            <CardTitle className="text-base">Entrées du mois</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !data?.length ? (
              <div className="p-12 text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucun revenu enregistré pour ce mois.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {data.map((rev, i) => (
                  <div key={rev.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-emerald-700">{i + 1}</span>
                      </div>
                      <span className="text-sm font-medium truncate">{rev.description}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-bold text-emerald-600">{formatAmount(parseFloat(rev.amount), currency)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: rev.id })} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="px-6 py-3 bg-muted/20 flex justify-between items-center">
                  <span className="text-sm font-semibold text-muted-foreground">Total</span>
                  <span className="text-base font-bold text-emerald-600">{formatAmount(total, currency)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
