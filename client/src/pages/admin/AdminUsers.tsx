import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Users, ShieldCheck, ShieldOff, Lock, Unlock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

type User = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  role: "user" | "admin";
  isBlocked: boolean;
  createdAt: Date;
  lastSignedIn: Date;
};

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const { data: users = [], isLoading } = trpc.admin.users.list.useQuery();

  const blockMutation = trpc.admin.users.block.useMutation({
    onSuccess: (_, vars) => {
      utils.admin.users.list.invalidate();
      toast.success(vars.blocked ? "Utilisateur bloqué" : "Utilisateur débloqué");
    },
    onError: (e) => toast.error(e.message),
  });

  const roleMutation = trpc.admin.users.setRole.useMutation({
    onSuccess: (_, vars) => {
      utils.admin.users.list.invalidate();
      toast.success(vars.role === "admin" ? "Promu administrateur" : "Rétrogradé utilisateur");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetMutation = trpc.admin.users.requestPasswordReset.useMutation({
    onSuccess: () => toast.success("Demande de réinitialisation enregistrée"),
    onError: (e) => toast.error(e.message),
  });

  return (
    <AdminLayout title="Gestion des utilisateurs">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Aucun utilisateur.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u: User) => (
            <div key={u.id} className={`bg-slate-800 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${u.isBlocked ? "border-red-600/40" : "border-slate-700"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white">{u.name ?? "Sans nom"}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-red-600/20 text-red-400" : "bg-slate-600/40 text-slate-400"}`}>
                    {u.role}
                  </span>
                  {u.isBlocked && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-300">Bloqué</span>}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{u.email ?? "Pas d'email"} · Inscrit le {new Date(u.createdAt).toLocaleDateString("fr-FR")}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-emerald-400" />{u.phone ?? "Téléphone non renseigné"}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-sky-400" />{u.city ?? "Ville non renseignée"}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => blockMutation.mutate({ userId: u.id, blocked: !u.isBlocked })}
                  disabled={blockMutation.isPending}
                  className={u.isBlocked ? "text-emerald-400 hover:text-emerald-300" : "text-red-400 hover:text-red-300"}
                >
                  {u.isBlocked ? <><Unlock className="w-3 h-3 mr-1" />Débloquer</> : <><Lock className="w-3 h-3 mr-1" />Bloquer</>}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => roleMutation.mutate({ userId: u.id, role: u.role === "admin" ? "user" : "admin" })}
                  disabled={roleMutation.isPending}
                  className="text-slate-400 hover:text-white"
                >
                  {u.role === "admin" ? <><ShieldOff className="w-3 h-3 mr-1" />Rétrograder</> : <><ShieldCheck className="w-3 h-3 mr-1" />Promouvoir</>}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resetMutation.mutate({ userId: u.id })}
                  disabled={resetMutation.isPending}
                  className="text-amber-400 hover:text-amber-300"
                >
                  Reset mdp
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
