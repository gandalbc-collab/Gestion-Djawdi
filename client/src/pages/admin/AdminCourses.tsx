import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Course = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverEmoji: string;
  readingMinutes: number;
  isPublished: boolean;
  sortOrder: number;
  categoryId: number | null;
  allowLikes: boolean;
  allowRatings: boolean;
  allowComments: boolean;
};

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverEmoji: "📖",
  readingMinutes: 5,
  isPublished: false,
  allowLikes: true,
  allowRatings: true,
  allowComments: true,
  sortOrder: 0,
  categoryId: undefined as number | undefined,
};

export default function AdminCourses() {
  const utils = trpc.useUtils();
  const { data: courses = [], isLoading } = trpc.admin.courses.list.useQuery();
  const { data: categories = [] } = trpc.learning.categories.useQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = trpc.admin.courses.create.useMutation({
    onSuccess: () => { utils.admin.courses.list.invalidate(); toast.success("Cours créé"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.admin.courses.update.useMutation({
    onSuccess: () => { utils.admin.courses.list.invalidate(); toast.success("Cours mis à jour"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.courses.delete.useMutation({
    onSuccess: () => { utils.admin.courses.list.invalidate(); toast.success("Cours supprimé"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setForm({
      title: c.title,
      slug: c.slug,
      excerpt: c.excerpt ?? "",
      content: c.content,
      coverEmoji: c.coverEmoji,
      readingMinutes: c.readingMinutes,
      isPublished: c.isPublished,
      allowLikes: c.allowLikes,
      allowRatings: c.allowRatings,
      allowComments: c.allowComments,
      sortOrder: c.sortOrder,
      categoryId: c.categoryId ?? undefined,
    });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("Titre et slug sont requis");
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...form, categoryId: form.categoryId ?? undefined });
    } else {
      createMutation.mutate({ ...form, categoryId: form.categoryId ?? undefined } as any);
    }
  }

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  return (
    <AdminLayout title="Gestion des cours">
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Nouveau cours
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Aucun cours. Créez le premier !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c: Course) => (
            <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <span className="text-2xl">{c.coverEmoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                <p className="text-xs text-slate-400">{c.slug} · {c.readingMinutes} min</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.isPublished ? "bg-emerald-600/20 text-emerald-400" : "bg-slate-600/40 text-slate-400"}`}>
                {c.isPublished ? "Publié" : "Brouillon"}
              </span>
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

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le cours" : "Nouveau cours"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Titre *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    const t = e.target.value;
                    setForm((f) => ({ ...f, title: t, slug: editing ? f.slug : autoSlug(t) }));
                  }}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Les bases de la gestion..."
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="les-bases-gestion"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Emoji</Label>
                <Input
                  value={form.coverEmoji}
                  onChange={(e) => setForm((f) => ({ ...f, coverEmoji: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                  maxLength={4}
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Durée (min)</Label>
                <Input
                  type="number"
                  value={form.readingMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, readingMinutes: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-600 text-white"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Ordre</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Résumé</Label>
              <Input
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Courte description..."
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Contenu (Markdown)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white min-h-[200px] font-mono text-sm"
                placeholder="# Titre&#10;&#10;Contenu en Markdown..."
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
                <Label className="text-slate-300 text-sm">Publié</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.allowLikes} onCheckedChange={(v) => setForm((f) => ({ ...f, allowLikes: v }))} />
                <Label className="text-slate-300 text-sm">Likes</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.allowRatings} onCheckedChange={(v) => setForm((f) => ({ ...f, allowRatings: v }))} />
                <Label className="text-slate-300 text-sm">Notes</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.allowComments} onCheckedChange={(v) => setForm((f) => ({ ...f, allowComments: v }))} />
                <Label className="text-slate-300 text-sm">Commentaires</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Supprimer ce cours ?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm">Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="text-slate-400">Annuler</Button>
            <Button
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
