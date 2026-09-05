import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.settings.get.useQuery();
  const [form, setForm] = useState({
    youtubeChannelUrl: "",
    allowLikes: true,
    allowRatings: true,
    allowComments: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        youtubeChannelUrl: data.youtubeChannelUrl ?? "",
        allowLikes: data.allowLikes ?? true,
        allowRatings: data.allowRatings ?? true,
        allowComments: data.allowComments ?? true,
      });
    }
  }, [data]);

  const updateMutation = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      utils.admin.settings.get.invalidate();
      utils.learning.settings.invalidate();
      toast.success("Paramètres enregistrés");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AdminLayout title="Paramètres globaux">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-12" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* YouTube */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Lien YouTube
            </h2>
            <div>
              <Label className="text-slate-400 text-xs mb-1 block">URL de la chaîne YouTube</Label>
            <Input
              value={form.youtubeChannelUrl}
              onChange={(e) => setForm((f) => ({ ...f, youtubeChannelUrl: e.target.value }))}
              className="bg-slate-900 border-slate-600 text-white"
                placeholder="https://youtube.com/@..."
              />
              <p className="text-xs text-slate-500 mt-1">Affiché sur la page Apprendre et le Dashboard.</p>
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Fonctionnalités du module Apprendre</h2>
            <div className="space-y-3">
              {[
                { key: "allowLikes" as const, label: "Autoriser les likes", desc: "Les utilisateurs peuvent liker les cours" },
                { key: "allowRatings" as const, label: "Autoriser les notes", desc: "Les utilisateurs peuvent noter les cours (1–5 étoiles)" },
                { key: "allowComments" as const, label: "Autoriser les commentaires", desc: "Les utilisateurs peuvent commenter les cours" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm text-white">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <Switch
                    checked={form[key]}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  />
                </div>
              ))}
            </div>
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
