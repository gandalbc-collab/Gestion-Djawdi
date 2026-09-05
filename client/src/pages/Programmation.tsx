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
import { Plus, Trash2, Play, Pause, CalendarClock, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  categoryId: z.coerce.number().int().positive("Catégorie requise"),
  description: z.string().min(1).max(128),
  amount: z.coerce.number().positive().max(999_999_999),
  dayOfMonth: z.coerce.number().int().min(1).max(31),
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

export default function Programmation() {
  const { month, setMonth } = useCurrentMonth();
  const { data: profile } = trpc.profile.get.useQuery();
  const currency = (profile?.currency ?? "GNF") as Currency;
  const utils = trpc.useUtils();

  const { data: categories } = trpc.categories.list.useQuery();
  const { data, isLoading } = trpc.scheduledPayments.list.useQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLabel, setDeleteLabel] = useState("");

  const createMutation = trpc.scheduledPayments.create.useMutation({
    onSuccess: () => { utils.scheduledPayments.list.invalidate(); setCreateOpen(false); toast.success("Paiement programmé créé"); reset(); },
    onError: () => toast.error("Erreur lors de la création"),
  });
  const toggleMutation = trpc.scheduledPayments.toggle.useMutation({
    onSuccess: () => { utils.scheduledPayments.list.invalidate(); toast.success("Statut mis à jour"); },
    onError: () => toast.error("Erreur"),
  });
  const deleteMutation = trpc.scheduledPayments.delete.useMutation({
    onSuccess: () => { utils.scheduledPayments.list.invalidate(); setDeleteId(null); toast.success("Supprimé"); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
  const executeMutation = trpc.scheduledPayments.execute.useMutation({
    onSuccess: () => { utils.expenses.list.invalidate(); toast.success("Dépense enregistrée avec succès"); },
    onError: (err) => {
      if (err.message.includes("déjà été enregistrée")) toast.error("Cette dépense a déjà été exécutée ce mois.");
      else toast.error("Erreur lors de l'exécution");
    },
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) as any });
  const catMap = useMemo(() => {
    const m: Record<number, { name: string; icon: string }> = {};
    for (const c of categories ?? []) m[c.id] = { name: c.name, icon: c.icon };
    return m;
  }, [categories]);

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate(values);
  });

  return (
    <AppLayout title="Programmation">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Programmation</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Gérez vos paiements récurrents</p>
          </div>
          <div className="flex items-center gap-3">
            <MonthPicker month={month} setMonth={setMonth} />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Nouveau</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau paiement programmé</DialogTitle></DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Catégorie</Label>
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
                    <Label>Description</Label>
                    <Input placeholder="ex: Abonnement Netflix" {...register("description")} />
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Montant ({currency})</Label>
                      <Input type="number" placeholder="0" min="0" step="any" {...register("amount")} />
                      {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Jour du mois (1–31)</Label>
                      <Input type="number" placeholder="1" min="1" max="31" {...register("dayOfMonth")} />
                      {errors.dayOfMonth && <p className="text-xs text-destructive">{errors.dayOfMonth.message}</p>}
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Création…" : "Créer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4" />Paiements programmés</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !data?.length ? (
              <div className="p-12 text-center">
                <CalendarClock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucun paiement programmé. Créez-en un pour automatiser vos dépenses récurrentes.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {data.map((sp) => {
                  const cat = catMap[sp.categoryId];
                  return (
                    <div key={sp.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{cat?.icon ?? "📌"}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{sp.description}</p>
                            <Badge variant={sp.isActive ? "default" : "secondary"} className="text-xs shrink-0">
                              {sp.isActive ? "Actif" : "Pausé"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{cat?.name ?? "—"} · Jour {sp.dayOfMonth} du mois</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-foreground">{formatAmount(parseFloat(sp.amount), currency)}</span>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs"
                          onClick={() => executeMutation.mutate({ id: sp.id, month })}
                          disabled={executeMutation.isPending || !sp.isActive}
                          title="Exécuter pour ce mois">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Exécuter
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => toggleMutation.mutate({ id: sp.id })}
                          title={sp.isActive ? "Mettre en pause" : "Réactiver"}>
                          {sp.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => { setDeleteId(sp.id); setDeleteLabel(sp.description); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment supprimer le paiement programmé <strong>"{deleteLabel}"</strong> ? Cette action est irréversible.
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
