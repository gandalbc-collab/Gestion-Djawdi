import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCircle, Save, Phone, Mail, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const CURRENCY_LABELS: Record<Currency, string> = {
  GNF: "Franc Guinéen (GNF)",
  CFA: "Franc CFA (FCFA)",
  EUR: "Euro (€)",
  USD: "Dollar américain ($)",
};

export default function Profile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();

  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState<Currency>("GNF");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? user?.name ?? "");
      setCurrency((profile.currency ?? "GNF") as Currency);
      setPhone((profile as any).phone ?? "");
      setCity((profile as any).city ?? "");
      setProfileEmail((profile as any).profileEmail ?? "");
    }
  }, [profile, user]);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Profil mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const handleSave = () => {
    if (!fullName.trim()) { toast.error("Le nom ne peut pas être vide"); return; }
    if (profileEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail)) {
      toast.error("Adresse email invalide"); return;
    }
    updateMutation.mutate({
      fullName: fullName.trim(),
      currency,
      phone: phone.trim() || null,
      city: city.trim() || null,
      profileEmail: profileEmail.trim() || null,
    } as any);
  };

  return (
    <AppLayout title="Profil">
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Profil & Préférences</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Personnalisez votre espace Djawdi</p>
        </div>

        {/* Avatar */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="pt-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">
                {(fullName || user?.name || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">{fullName || user?.name || "—"}</p>
              <p className="text-sm text-muted-foreground">{profileEmail || user?.email || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Settings form */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom complet"
                    maxLength={128}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileEmail" className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Adresse email
                  </Label>
                  <Input
                    id="profileEmail"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="votre@email.com"
                    maxLength={320}
                  />
                  <p className="text-xs text-muted-foreground">Email de contact affiché dans votre profil.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Numéro de téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 89 00"
                    maxLength={32}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Ville de résidence
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Votre ville de résidence"
                    maxLength={120}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Devise d'affichage</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{CURRENCY_LABELS[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "Sauvegarde…" : "Sauvegarder les modifications"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sécurité & Mot de passe */}
      </div>
    </AppLayout>
  );
}
