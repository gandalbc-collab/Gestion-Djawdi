import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Tag,
  MessageSquare,
  Users,
  Bell,
  Megaphone,
  Phone,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { href: "/djawdi-cimbailo-admin-7944", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/djawdi-cimbailo-admin-7944/courses", label: "Cours", icon: BookOpen },
  { href: "/djawdi-cimbailo-admin-7944/categories", label: "Catégories", icon: Tag },
  { href: "/djawdi-cimbailo-admin-7944/comments", label: "Commentaires", icon: MessageSquare },
  { href: "/djawdi-cimbailo-admin-7944/users", label: "Utilisateurs", icon: Users },
  { href: "/djawdi-cimbailo-admin-7944/notifications", label: "Notifications", icon: Bell },
  { href: "/djawdi-cimbailo-admin-7944/ads", label: "Publicités", icon: Megaphone },
  { href: "/djawdi-cimbailo-admin-7944/contact", label: "Page Contact", icon: Phone },
  { href: "/djawdi-cimbailo-admin-7944/settings", label: "Paramètres", icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href) && href !== "/djawdi-cimbailo-admin-7944";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Admin Panel</p>
            <p className="text-xs text-slate-400">Djawdi</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-red-600/20 text-red-400 border border-red-600/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-3 h-3" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2">
          <Link href="/">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer">
              <LayoutDashboard className="w-4 h-4" />
              <span>Retour à l'app</span>
            </div>
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-600/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center">
            <Shield className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Admin</span>
        </div>
        <Link href="/">
          <span className="text-xs text-slate-400 hover:text-slate-100 transition-colors">← App</span>
        </Link>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex overflow-x-auto">
        {navItems.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px] text-xs transition-colors cursor-pointer ${
                  active ? "text-red-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate max-w-[48px] text-center leading-tight">{item.label.split(" ")[0]}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="px-4 py-6 md:px-8 md:py-8 mt-12 md:mt-0 mb-16 md:mb-0">
          <h1 className="text-xl font-bold text-white mb-6">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
