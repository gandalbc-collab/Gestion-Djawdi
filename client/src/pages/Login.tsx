import { useState } from "react";
import { useLocation, Link } from "wouter";
import { requireFirebaseAuth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstallDjawdiPrompt } from "@/components/InstallDjawdiPrompt";
import { ArrowLeft, LockKeyhole, Mail, WalletCards } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      const auth = requireFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await credential.user.reload();
      if (!credential.user.emailVerified) {
        await signOut(auth);
        toast.error("Veuillez confirmer votre adresse email avant de vous connecter.");
        return;
      }
      navigate("/dashboard");
    } catch (error: any) {
      if (error?.code === "auth/invalid-credential" || error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password") {
        toast.error("Email ou mot de passe incorrect.");
      } else if (error?.code === "auth/email-not-verified") {
        toast.error("Veuillez confirmer votre email avant de vous connecter.");
      } else {
        toast.error(error?.message ?? "La connexion a échoué.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#d1fae5_0,_transparent_34%),radial-gradient(circle_at_bottom_right,_#e0f2fe_0,_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#eef2f5_52%,_#f8fafc_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-800">
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/90 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.32)] backdrop-blur-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-white via-emerald-50/70 to-slate-50 px-7 pb-7 pt-8 text-center sm:px-9">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-amber-300 shadow-lg shadow-emerald-900/15">
              <WalletCards className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Djawdi</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Bon retour parmi nous</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Connectez-vous pour retrouver votre espace financier personnel.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 px-7 py-7 sm:px-9">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Adresse email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="h-11 border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Mot de passe</Label>
                <Link href="/reset-password" className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input id="password" type="password" placeholder="Votre mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="h-11 border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full bg-emerald-700 font-semibold shadow-md shadow-emerald-900/15 transition hover:bg-emerald-800">
              {loading ? "Connexion en cours…" : "Se connecter"}
            </Button>
          </form>

          <div className="border-t border-slate-100 bg-slate-50/70 px-7 py-5 text-center sm:px-9">
            <p className="text-sm text-slate-600">Vous découvrez Djawdi ? <Link href="/register" className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline">Créer un compte</Link></p>
          </div>
        </section>

        <div className="mt-5"><InstallDjawdiPrompt /></div>
      </div>
    </main>
  );
}
