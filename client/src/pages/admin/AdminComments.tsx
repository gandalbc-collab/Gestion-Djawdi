import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type Comment = {
  id: number;
  content: string;
  isApproved: boolean;
  createdAt: Date;
  userId: number;
  courseId: number;
};

export default function AdminComments() {
  const utils = trpc.useUtils();
  const { data: comments = [], isLoading } = trpc.admin.comments.list.useQuery();

  const approveMutation = trpc.admin.comments.approve.useMutation({
    onSuccess: () => { utils.admin.comments.list.invalidate(); toast.success("Commentaire approuvé"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.comments.delete.useMutation({
    onSuccess: () => { utils.admin.comments.list.invalidate(); toast.success("Commentaire supprimé"); },
    onError: (e) => toast.error(e.message),
  });

  const pending = comments.filter((c: Comment) => !c.isApproved);
  const approved = comments.filter((c: Comment) => c.isApproved);

  return (
    <AdminLayout title="Modération des commentaires">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Aucun commentaire.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                En attente ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((c: Comment) => (
                  <div key={c.id} className="bg-slate-800 border border-orange-600/30 rounded-xl p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200">{c.content}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Cours #{c.courseId} · Utilisateur #{c.userId} · {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => approveMutation.mutate({ id: c.id })} disabled={approveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                        <CheckCircle className="w-3 h-3" /> Approuver
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ id: c.id })} disabled={deleteMutation.isPending} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {approved.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approuvés ({approved.length})
              </h2>
              <div className="space-y-3">
                {approved.map((c: Comment) => (
                  <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300">{c.content}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Cours #{c.courseId} · {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ id: c.id })} disabled={deleteMutation.isPending} className="text-red-400 hover:text-red-300 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

