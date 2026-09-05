import { useState } from "react";
import { useLocation, Link } from "wouter";
import { requireFirebaseAuth } from "@/lib/firebase";
import { setAuthToken } from "@/lib/authToken";
import { isStrongPassword } from "@/lib/passwordPolicy";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, updateProfile } from "firebase/auth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstallDjawdiPrompt } from "@/components/InstallDjawdiPrompt";
import { ArrowLeft, LockKeyhole, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";

const phonePattern = /^[0-9+().\s-]{7,32}$/;

export default function Register() {
  const [, navigate] = useLocation();
  const completeProfile = trpc.registration.completeProfile.useMutation();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim() || !phone.trim() || !city.trim() || !email.trim() || !password || !confirm) {
      toast.error("Tous les champs sont obligatoires.");
      return;
    }
    if (!phonePattern.test(phone.trim())) {
      toast.error("Veuillez entrer un numéro de téléphone valide.");
      return;
    }
    if (!isStrongPassword(password)) {
      toast.error("Le mot de passe doit contenir au moins 12 caractères, avec majuscule, minuscule, chiffre et symbole.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const auth = requireFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      const token = await credential.user.getIdToken(true);
      setAuthToken(token);
      await completeProfile.mutateAsync({ fullName: fullName.trim(), phone: phone.trim(), city: city.trim() });
      await sendEmailVerification(credential.user, { url: `${window.location.origin}/login` });
      await signOut(auth);
      setAuthToken(null);
      toast.success("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
      navigate("/login");
    } catch (error: any) {
      if (error?.code === "auth/email-already-in-use") {
        toast.error("Cet email est déjà utilisé. Essayez de vous connecter.");
      } else {
        toast.error(error?.message ?? "La création du compte a échoué. Réessayez dans quelques instants.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#d1fae5_0,_transparent_30%),radial-gradient(circle_at_bottom_left,_#dbeafe_0,_transparent_34%),linear-gradient(135deg,_#f8fafc_0%,_#eef2f5_52%,_#f8fafc_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-800"><ArrowLeft className="h-4 w-4" /> Retour à l'accueil</Link>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/90 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.32)] backdrop-blur-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-white via-emerald-50/70 to-slate-50 px-7 pb-6 pt-7 text-center sm:px-9">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-amber-300 shadow-lg shadow-emerald-900/15"><UserRound className="h-7 w-7" aria-hidden="true" /></div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Djawdi</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Créez votre espace</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Commencez un suivi plus serein de vos finances personnelles.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 px-7 py-6 sm:px-9">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet" htmlFor="fullName" icon={<UserRound className="h-4 w-4" />}>
                <Input id="fullName" type="text" placeholder="Prénom Nom" value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" maxLength={128} className="h-11 border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20" />
              </Field>
              <Field label="Ville de résidence" htmlFor="city" icon={<MapPin className="h-4 w-4" />}>
                <Input id="city" type="text" placeholder="Conakry" value={city} onChange={(event) => setCity(event.target.value)} required autoComplete="address-level2" maxLength={120} className="h-11 border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Numéro de téléphone" htmlFor="phone" icon={<Phone className="h-4 w-4" />}>
                <Input id="phone" type="tel" placeholder="+224 000 00 00 00" value={phone} onChange={(event) => setPhone(event.target.value)} required autoComplete="tel" inputMode="tel" maxLength={32} className="h-11 border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20" />
              </Field>
              <Field label="Adresse email" htmlFor="email" icon={<Mail className="h-4 w-4" />}>
                <Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" maxLength={320} className="h-11 border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mot de passe" htmlFor="password" icon={<LockKeyhole className="h-4 w-4" />} hint="12 caractères, avec majuscule, minuscule, chiffre et symbole">
                <Input id="password" type="password" placeholder="Créez un mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" className="h-11 border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20" />
              </Field>
              <Field label="Confirmer le mot de passe" htmlFor="confirm" icon={<LockKeyhole className="h-4 w-4" />}>
                <Input id="confirm" type="password" placeholder="Confirmez le mot de passe" value={confirm} onChange={(event) => setConfirm(event.target.value)} required autoComplete="new-password" className="h-11 border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20" />
              </Field>
            </div>
            <Button type="submit" disabled={loading || completeProfile.isPending} className="mt-2 h-11 w-full bg-emerald-700 font-semibold shadow-md shadow-emerald-900/15 transition hover:bg-emerald-800">{loading ? "Création en cours…" : "Créer mon compte"}</Button>
          </form>
          <div className="border-t border-slate-100 bg-slate-50/70 px-7 py-5 text-center sm:px-9"><p className="text-sm text-slate-600">Déjà un compte ? <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline">Se connecter</Link></p></div>
        </section>

        <div className="mt-5"><InstallDjawdiPrompt /></div>
      </div>
    </main>
  );
}

function Field({ label, htmlFor, icon, hint, children }: { label: string; htmlFor: string; icon: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-700">{label}</Label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">{icon}</span>{children}</div>{hint && <p className="text-xs leading-4 text-slate-500">{hint}</p>}</div>;
}
