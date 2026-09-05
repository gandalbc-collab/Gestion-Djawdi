import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Notification = {
  id: number;
  title: string;
  message: string;
  sentAt: Date;
  recipientCount: number;
};

export default function AdminNotifications() {
  const utils = trpc.useUtils();
  const { data: notifications = [], isLoading } = trpc.admin.notifications.list.useQuery();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const sendMutation = trpc.admin.notifications.send.useMutation({
    onSuccess: (data) => {
      utils.admin.notifications.list.invalidate();
      toast.success(`Notification enregistrée (${data.sent} destinataires)`);
      setTitle("");
      setMessage("");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSend() {
    if (!title.trim() || !message.trim()) { toast.error("Titre et message requis"); return; }
    sendMutation.mutate({ title, message });
  }

  return (
    <AdminLayout title="Notifications globales">
      {/* Compose */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Send className="w-4 h-4" /> Envoyer une notification
        </h2>
        <div className="space-y-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-900 border-slate-600 text-white" placeholder="Titre de la notification..." />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1 block">Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="bg-slate-900 border-slate-600 text-white min-h-[100px]" placeholder="Contenu du message..." />
          </div>
          <Button onClick={handleSend} disabled={sendMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Send className="w-4 h-4" /> Envoyer à tous
          </Button>
        </div>
      </div>

      {/* History */}
      <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <Bell className="w-4 h-4" /> Historique
      </h2>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucune notification envoyée.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: Notification) => (
            <div key={n.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">{new Date(n.sentAt).toLocaleDateString("fr-FR")}</p>
                  <p className="text-xs text-slate-500">{n.recipientCount} destinataires</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
