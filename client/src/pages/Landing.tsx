import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(209,250,229,0.8),_transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2f3_54%,#e2e8f0_100%)] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-white/90 border border-emerald-100 flex items-center justify-center shadow-[0_16px_35px_-18px_rgba(15,118,110,0.42)]">
            <span className="text-4xl">💰</span>
          </div>
          <div>
            <h1 className="text-5xl font-bold text-slate-900 tracking-tight">Djawdi</h1>
            <p className="text-emerald-700 text-lg mt-2 font-medium">Gestion Financière Personnelle</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            { icon: "📊", label: "Tableau de bord" },
            { icon: "💳", label: "Suivi des dépenses" },
            { icon: "🎯", label: "Planification budget" },
            { icon: "🏦", label: "Gestion de caisse" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3 bg-white/85 border border-slate-200/90 rounded-xl p-3 shadow-sm">
              <span className="text-xl">{icon}</span>
              <span className="text-sm text-slate-700 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link href="/login">
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/15"
            >
              Se connecter
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12 text-base font-semibold border-slate-300 bg-white/80 text-slate-800 hover:bg-white hover:text-slate-950"
            >
              Créer un compte
            </Button>
          </Link>
          <p className="text-slate-500 text-xs">Authentification sécurisée par Firebase</p>
        </div>
      </div>
    </div>
  );
}
