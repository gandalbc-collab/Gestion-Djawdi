import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Mail, Phone, Facebook, Youtube, Music2, ExternalLink, BookOpen, Lightbulb, Target, ChevronLeft, TrendingUp, PiggyBank, BarChart3, ShieldCheck, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function ContactSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="w-32 h-32 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-16 w-full max-w-lg" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export default function Contact() {
  const [, navigate] = useLocation();
  const { data: contact, isLoading } = trpc.contact.get.useQuery();

  if (isLoading) return <ContactSkeleton />;

  const socialLinks = [
    contact?.email && {
      icon: <Mail className="w-4 h-4" />,
      label: contact.email,
      href: `mailto:${contact.email}`,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    },
    contact?.phone && {
      icon: <Phone className="w-4 h-4" />,
      label: contact.phone,
      href: `tel:${contact.phone?.replace(/\s/g, "")}`,
      color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    },
    contact?.facebook && {
      icon: <Facebook className="w-4 h-4" />,
      label: "Facebook",
      href: contact.facebook.startsWith("http") ? contact.facebook : `https://facebook.com/${contact.facebook}`,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
    },
    contact?.youtube && {
      icon: <Youtube className="w-4 h-4" />,
      label: "YouTube",
      href: contact.youtube.startsWith("http") ? contact.youtube : `https://youtube.com/@${contact.youtube}`,
      color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    },
    contact?.tiktok && {
      icon: <Music2 className="w-4 h-4" />,
      label: "TikTok",
      href: contact.tiktok.startsWith("http") ? contact.tiktok : `https://tiktok.com/@${contact.tiktok}`,
      color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; href: string; color: string }[];

  const sections = [
    {
      icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
      title: "À propos de Djawdi",
      content: contact?.appDescription || "Djawdi est une application de gestion financière personnelle conçue pour vous aider à suivre vos revenus, planifier votre budget, contrôler vos dépenses et développer votre épargne — le tout en un seul endroit, accessible depuis n'importe quel appareil.",
      bg: "bg-emerald-50/60 border-emerald-100",
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      title: "Comment ça fonctionne ?",
      content: contact?.howItWorks || "Djawdi fonctionne autour d'un cycle mensuel simple : vous enregistrez vos revenus, planifiez votre budget par catégorie, puis saisissez vos dépenses au fil du temps. L'application calcule automatiquement votre excédent ou déficit et votre taux d'exécution budgétaire.",
      bg: "bg-amber-50/60 border-amber-100",
    },
    {
      icon: <Target className="w-5 h-5 text-blue-500" />,
      title: "Comment l'utiliser efficacement ?",
      content: contact?.howToUse || "Commencez par renseigner vos revenus du mois, définissez votre budget par catégorie, puis enregistrez chaque dépense. Consultez votre tableau de bord pour une vue d'ensemble et explorez la section Apprendre pour approfondir vos connaissances.",
      bg: "bg-blue-50/60 border-blue-100",
    },
  ];

  const benefits = [
    { icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, text: "Visualisez en temps réel l'état de vos finances chaque mois." },
    { icon: <PiggyBank className="w-4 h-4 text-emerald-600" />, text: "Développez une épargne régulière grâce au suivi de votre excédent mensuel." },
    { icon: <BarChart3 className="w-4 h-4 text-emerald-600" />, text: "Identifiez vos postes de dépenses excessifs et ajustez votre budget en conséquence." },
    { icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, text: "Anticipez vos dépenses récurrentes grâce aux paiements programmés." },
    { icon: <Target className="w-4 h-4 text-emerald-600" />, text: "Fixez-vous des objectifs budgétaires réalistes et mesurez votre taux d'exécution." },
    { icon: <BookOpen className="w-4 h-4 text-emerald-600" />, text: "Renforcez vos connaissances financières grâce aux cours disponibles dans l'app." },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      {/* Back button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/dashboard")}
        className="border-2 border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-medium gap-2 shadow-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Tableau de bord
      </Button>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }}
          />
        </div>

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          {/* Avatar — chevauchant la bannière */}
          <div className="flex items-end gap-4 -mt-12 mb-3">
            <div className="relative shrink-0">
              <img
                src={contact?.photoUrl || "/manus-storage/cimbailo_5a8e74dc.jpeg"}
                alt={contact?.displayName || "Cim Bailo"}
                className="w-24 h-24 rounded-full object-cover object-top border-4 border-white shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Cim+Bailo&background=10b981&color=fff&size=96`;
                }}
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
          </div>
          {/* Nom et titre — entièrement sous la bannière */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {contact?.displayName || "Cim Bailo"}
            </h1>
            <Badge variant="secondary" className="mt-1 bg-emerald-100 text-emerald-700 border-0 text-xs font-medium">
              {contact?.title || "Coach en gestion financière"}
            </Badge>
          </div>

          {/* Bio */}
          {contact?.bio && (
            <p className="text-slate-600 text-sm leading-relaxed mb-5">
              {contact.bio}
            </p>
          )}

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target={link.href.startsWith("mailto") || link.href.startsWith("tel") ? "_self" : "_blank"}
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${link.color}`}
                >
                  {link.icon}
                  {link.label}
                  {!link.href.startsWith("mailto") && !link.href.startsWith("tel") && (
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* App description sections */}
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className={`rounded-2xl border p-5 ${section.bg}`}>
            <div className="flex items-center gap-2 mb-3">
              {section.icon}
              <h2 className="font-semibold text-slate-800 text-base">{section.title}</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>

      {/* Benefits section */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-800 text-base">Ce que Djawdi peut vous apporter</h2>
        </div>
        <ul className="space-y-3">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                {b.icon}
              </span>
              <span className="text-slate-600 text-sm leading-relaxed">{b.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Important à savoir</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Djawdi n'est connecté à aucun compte bancaire et ne récupère aucune donnée automatiquement.
            Toutes les informations (revenus, dépenses, budgets) doivent être saisies manuellement.
            Un suivi rigoureux et régulier est indispensable pour tirer le maximum de bénéfices de l'application.
          </p>
        </div>
      </div>
    </div>
  );
}
