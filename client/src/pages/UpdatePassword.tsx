import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { requireFirebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function UpdatePassword() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [actionCode, setActionCode] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("oobCode");
    if (!code) return;
    verifyPasswordResetCode(requireFirebaseAuth(), code)
      .then(() => { setActionCode(code); setReady(true); })
      .catch(() => toast.error("Ce lien de réinitialisation est invalide ou a expiré."));
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      if (!actionCode) return;
      try {
        await confirmPasswordReset(requireFirebaseAuth(), actionCode, password);
      } catch (error: any) {
        toast.error(error?.message ?? "La mise à jour du mot de passe a échoué.");
        return;
      }
      toast.success("Mot de passe mis à jour avec succès !");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.13_0.03_250)] via-[oklch(0.17_0.04_250)] to-[oklch(0.13_0.03_250)] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto shadow-xl">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Nouveau mot de passe</h1>
          <p className="text-white/50 text-sm">Choisissez un mot de passe sécurisé.</p>
        </div>

        {!ready ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-white/50 text-sm">
            Vérification du lien de réinitialisation…
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-5 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                Nouveau mot de passe
                <span className="text-white/30 font-normal ml-1">(min. 8 car., maj + min + chiffre)</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-white/80 text-sm font-medium">Confirmer le mot de passe</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
            >
              {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
