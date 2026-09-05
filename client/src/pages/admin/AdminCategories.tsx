import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = { id: number; name: string; icon: string; color: string; sortOrder: number };

const emptyForm = { name: "", icon: "📚", color: "emerald", sortOrder: 0 };

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const { data: categories = [], isLoading } = trpc.learning.categories.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = trpc.admin.courseCategories.create.useMutation({
    onSuccess: () => { utils.learning.categories.invalidate(); toast.success("Catégorie créée"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.admin.courseCategories.update.useMutation({
    onSuccess: () => { utils.learning.categories.invalidate(); toast.success("Catégorie mise à jour"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.courseCategories.delete.useMutation({
    onSuccess: () => { utils.learning.categories.invalidate(); toast.success("Catégorie supprimée"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, icon: c.icon, color: c.color, sortOrder: c.sortOrder });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) { toast.error("Le nom est requis"); return; }
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  return (
    <AdminLayout title="Catégories de cours">
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-14" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Aucune catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((c: Category) => (
            <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <span className="text-xl">{c.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs text-slate-400">Couleur : {c.color} · Ordre : {c.sortOrder}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => openEdit(c)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteId(c.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Nom *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Icône</Label>
                <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" maxLength={4} />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Couleur</Label>
                <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" placeholder="emerald" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Ordre</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Supprimer cette catégorie ?</DialogTitle></DialogHeader>
          <p className="text-slate-400 text-sm">Les cours associés perdront leur catégorie.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="text-slate-400">Annuler</Button>
            <Button onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
