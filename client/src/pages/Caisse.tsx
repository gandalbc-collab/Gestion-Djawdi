import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { formatAmount, type Currency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Vault, TrendingUp, PiggyBank } from "lucide-react";

export default function Caisse() {
  const { data: profile } = trpc.profile.get.useQuery();
  const currency = (profile?.currency ?? "GNF") as Currency;
  const { data, isLoading } = trpc.caisse.get.useQuery();

  return (
    <AppLayout title="Caisse">
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Caisse</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Votre trésorerie cumulée sur l'ensemble des mois</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Surplus cumulatif */}
          <Card className="shadow-md border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Vault className="h-4 w-4" />
                Excédent cumulatif
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-48" />
              ) : (
                <>
                  <p className={`text-4xl font-bold ${(data?.cumulativeSurplus ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatAmount(data?.cumulativeSurplus ?? 0, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Somme des excédents mensuels (revenus − dépenses) depuis le début
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Épargne cumulative */}
          <Card className="shadow-md border-amber-200 bg-gradient-to-br from-amber-50/50 to-amber-100/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Épargne cumulative
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-48" />
              ) : (
                <>
                  <p className="text-4xl font-bold text-amber-600">
                    {formatAmount(data?.cumulativeSavings ?? 0, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total des dépenses dans la catégorie "Épargne" depuis le début
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info card */}
        <Card className="shadow-sm border-border/60 bg-muted/20">
          <CardContent className="pt-5 flex items-start gap-4">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Excédent cumulatif</strong> : somme de tous les excédents mensuels (revenus − dépenses totales) depuis votre premier mois enregistré.</p>
              <p><strong className="text-foreground">Épargne cumulative</strong> : total des montants enregistrés dans la catégorie "Épargne" sur tous les mois.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
