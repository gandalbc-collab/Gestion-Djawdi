import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Ad = {
  id: number;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
  position: string;
  isActive: boolean;
  clickCount: number;
};

const positions = [
  { value: "dashboard_top", label: "Dashboard — haut" },
  { value: "dashboard_bottom", label: "Dashboard — bas" },
  { value: "sidebar", label: "Sidebar" },
  { value: "learn_page", label: "Page Apprendre" },
];

const emptyForm = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  position: "dashboard_top" as const,
  isActive: true,
};

export default function AdminAds() {
  const utils = trpc.useUtils();
  const { data: ads = [], isLoading } = trpc.admin.ads.list.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = trpc.admin.ads.create.useMutation({
    onSuccess: () => { utils.admin.ads.list.invalidate(); toast.success("Publicité créée"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.admin.ads.update.useMutation({
    onSuccess: () => { utils.admin.ads.list.invalidate(); toast.success("Publicité mise à jour"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.ads.delete.useMutation({
    onSuccess: () => { utils.admin.ads.list.invalidate(); toast.success("Publicité supprimée"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(a: Ad) {
    setEditing(a);
    setForm({
      title: a.title,
      imageUrl: a.imageUrl ?? "",
      linkUrl: a.linkUrl ?? "",
      position: a.position as typeof emptyForm.position,
      isActive: a.isActive,
    });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) { toast.error("Le titre est requis"); return; }
    const payload = {
      title: form.title,
      imageUrl: form.imageUrl || undefined,
      linkUrl: form.linkUrl || undefined,
      position: form.position,
      isActive: form.isActive,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload as any);
    }
  }

  return (
    <AdminLayout title="Gestion des publicités">
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Nouvelle publicité
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Aucune publicité.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((a: Ad) => (
            <div key={a.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{a.title}</p>
              <p className="text-xs text-slate-400">{positions.find(p => p.value === a.position)?.label ?? a.position} · {a.clickCount} clics</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${a.isActive ? "bg-emerald-600/20 text-emerald-400" : "bg-slate-600/40 text-slate-400"}`}>
                {a.isActive ? "Actif" : "Inactif"}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => openEdit(a)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteId(a.id)}>
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
            <DialogTitle>{editing ? "Modifier la publicité" : "Nouvelle publicité"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Titre *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">URL de l'image</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" placeholder="https://..." />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">URL de destination</Label>
              <Input value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" placeholder="https://..." />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Position</Label>
              <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v as typeof emptyForm.position }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {positions.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-white">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
              <Label className="text-slate-300 text-sm">Actif</Label>
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
          <DialogHeader><DialogTitle>Supprimer cette publicité ?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="text-slate-400">Annuler</Button>
            <Button onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
