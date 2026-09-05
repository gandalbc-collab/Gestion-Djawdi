import { useState } from "react";
import { requireFirebaseAuth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Veuillez entrer votre adresse email.");
      return;
    }
    setLoading(true);
    try {
      try {
        await sendPasswordResetEmail(requireFirebaseAuth(), email, {
          url: `${window.location.origin}/update-password`,
        });
      } catch (error: any) {
        toast.error(error?.message ?? "L'envoi du lien a échoué.");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.13_0.03_250)] via-[oklch(0.17_0.04_250)] to-[oklch(0.13_0.03_250)] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto shadow-xl">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-white/50 text-sm">
            {sent
              ? "Email envoyé ! Vérifiez votre boîte de réception."
              : "Entrez votre email pour recevoir un lien de réinitialisation."}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-5 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 text-sm font-medium">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
            >
              {loading ? "Envoi en cours…" : "Envoyer le lien"}
            </Button>
          </form>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
            <div className="text-5xl">📧</div>
            <p className="text-white/70 text-sm leading-relaxed">
              Un lien de réinitialisation a été envoyé à <strong className="text-white">{email}</strong>.
              Vérifiez également vos spams.
            </p>
            <Button
              variant="outline"
              onClick={() => setSent(false)}
              className="border-white/20 text-white/70 hover:text-white"
            >
              Renvoyer l'email
            </Button>
          </div>
        )}

        <p className="text-center">
          <Link href="/login" className="text-white/30 text-xs hover:text-white/50">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
