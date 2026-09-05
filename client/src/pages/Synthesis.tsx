import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { formatAmount, type Currency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

function monthLabel(month: string) {
  const [y, m] = month.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function Synthesis() {
  const { data: profile } = trpc.profile.get.useQuery();
  const currency = (profile?.currency ?? "GNF") as Currency;
  const { data, isLoading } = trpc.synthesis.history.useQuery();

  return (
    <AppLayout title="Synthèse">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Synthèse mensuelle</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Historique complet de vos finances mois par mois</p>
        </div>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tableau historique
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !data?.length ? (
              <div className="p-12 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune donnée disponible. Commencez par enregistrer des revenus et des dépenses.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Mois</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Revenus</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Budget prévu</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Dépenses réelles</th>
                      <th className="text-right px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Écart</th>
                      <th className="text-right px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Taux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.map((row) => {
                      const rate = row.budget > 0 ? Math.round((row.expenses / row.budget) * 100) : 0;
                      const surplus = row.revenues - row.expenses;
                      return (
                        <tr key={row.month} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium capitalize">{monthLabel(row.month)}</td>
                          <td className="px-4 py-4 text-right font-semibold text-emerald-600">{formatAmount(row.revenues, currency)}</td>
                          <td className="px-4 py-4 text-right text-blue-600">{formatAmount(row.budget, currency)}</td>
                          <td className="px-4 py-4 text-right text-red-600">{formatAmount(row.expenses, currency)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-semibold ${surplus >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {surplus >= 0 ? "+" : ""}{formatAmount(surplus, currency)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge variant={rate > 100 ? "destructive" : rate > 80 ? "secondary" : "outline"}
                              className={rate > 100 ? "" : rate > 80 ? "text-amber-700 bg-amber-100" : "text-emerald-700 bg-emerald-50"}>
                              {rate}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
