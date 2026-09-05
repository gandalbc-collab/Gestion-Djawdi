import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminContact() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.contact.get.useQuery();
  const [form, setForm] = useState({
    displayName: "",
    fullName: "",
    title: "",
    bio: "",
    photoUrl: "",
    email: "",
    phone: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    appDescription: "",
    howItWorks: "",
    howToUse: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        displayName: data.displayName ?? "",
        fullName: data.fullName ?? "",
        title: data.title ?? "",
        bio: data.bio ?? "",
        photoUrl: data.photoUrl ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        facebook: data.facebook ?? "",
        youtube: data.youtube ?? "",
        tiktok: data.tiktok ?? "",
        appDescription: data.appDescription ?? "",
        howItWorks: data.howItWorks ?? "",
        howToUse: data.howToUse ?? "",
      });
    }
  }, [data]);

  const updateMutation = trpc.admin.contact.update.useMutation({
    onSuccess: () => {
      utils.admin.contact.get.invalidate();
      utils.contact.get.invalidate();
      toast.success("Page Contact mise à jour");
    },
    onError: (e) => toast.error(e.message),
  });

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  return (
    <AdminLayout title="Éditeur — Page Contact">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-12" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Identité</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Nom affiché</Label>
                <Input value={form.displayName} onChange={set("displayName")} className="bg-slate-900 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Nom complet</Label>
                <Input value={form.fullName} onChange={set("fullName")} className="bg-slate-900 border-slate-600 text-white" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-400 text-xs mb-1 block">Titre / Fonction</Label>
                <Input value={form.title} onChange={set("title")} className="bg-slate-900 border-slate-600 text-white" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-400 text-xs mb-1 block">URL Photo</Label>
                <Input value={form.photoUrl} onChange={set("photoUrl")} className="bg-slate-900 border-slate-600 text-white" placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-400 text-xs mb-1 block">Bio</Label>
                <Textarea value={form.bio} onChange={set("bio")} className="bg-slate-900 border-slate-600 text-white min-h-[100px]" />
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Coordonnées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "email" as const, label: "Email" },
                { key: "phone" as const, label: "Téléphone" },
                { key: "facebook" as const, label: "Facebook" },
                { key: "youtube" as const, label: "YouTube" },
                { key: "tiktok" as const, label: "TikTok" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-slate-400 text-xs mb-1 block">{label}</Label>
                  <Input value={form[key]} onChange={set(key)} className="bg-slate-900 border-slate-600 text-white" />
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Contenu de la page</h2>
            {[
              { key: "appDescription" as const, label: "Description de l'app" },
              { key: "howItWorks" as const, label: "Comment ça marche" },
              { key: "howToUse" as const, label: "Comment utiliser" },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label className="text-slate-400 text-xs mb-1 block">{label}</Label>
                <Textarea value={form[key]} onChange={set(key)} className="bg-slate-900 border-slate-600 text-white min-h-[80px]" />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Save className="w-4 h-4" /> Enregistrer
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
