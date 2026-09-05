import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Users, BookOpen, MessageSquare, Megaphone, TrendingUp } from "lucide-react";
import { Link } from "wouter";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  return (
    <AdminLayout title="Tableau de bord">
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-slate-700 rounded w-24 mb-3" />
              <div className="h-7 bg-slate-700 rounded w-12" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Utilisateurs"
              value={stats?.totalUsers ?? 0}
              icon={Users}
              color="bg-blue-600"
              href="/djawdi-cimbailo-admin-7944/users"
            />
            <StatCard
              title="Cours"
              value={stats?.totalCourses ?? 0}
              icon={BookOpen}
              color="bg-emerald-600"
              href="/djawdi-cimbailo-admin-7944/courses"
            />
            <StatCard
              title="Commentaires en attente"
              value={stats?.pendingComments ?? 0}
              icon={MessageSquare}
              color="bg-orange-600"
              href="/djawdi-cimbailo-admin-7944/comments"
            />
            <StatCard
              title="Pubs actives"
              value={stats?.activeAds ?? 0}
              icon={Megaphone}
              color="bg-purple-600"
              href="/djawdi-cimbailo-admin-7944/ads"
            />
          </div>

          {/* Quick actions */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Actions rapides
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Nouveau cours", href: "/djawdi-cimbailo-admin-7944/courses" },
                { label: "Modérer commentaires", href: "/djawdi-cimbailo-admin-7944/comments" },
                { label: "Envoyer notification", href: "/djawdi-cimbailo-admin-7944/notifications" },
                { label: "Gérer publicités", href: "/djawdi-cimbailo-admin-7944/ads" },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-3 text-sm text-slate-200 text-center transition-colors cursor-pointer">
                    {action.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
