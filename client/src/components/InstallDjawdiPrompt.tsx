import { Download, PlusSquare, Share2, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isAppleMobileDevice } from "@/lib/pwa";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * Gives Android users the native PWA install action and iOS users the precise
 * Safari path, which Apple does not expose through beforeinstallprompt.
 */
export function InstallDjawdiPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [installed, setInstalled] = useState(() => typeof window !== "undefined" && isStandalone());
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(isAppleMobileDevice(navigator.userAgent, navigator.maxTouchPoints));
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPrompt);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (installed) return null;

  return (
    <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left shadow-sm" aria-label="Installer l'application Djawdi">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Installez Djawdi</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-600">Ajoutez l'application à votre écran d'accueil pour y accéder comme une application mobile.</p>
          {isIos ? (
            <p className="mt-3 flex items-start gap-1.5 text-xs font-medium leading-5 text-slate-700">
              <Share2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
              Sur Safari : touchez Partager, puis <span className="inline-flex items-center gap-1">Sur l'écran d'accueil <PlusSquare className="h-3.5 w-3.5" /></span>.
            </p>
          ) : deferredPrompt ? (
            <Button type="button" size="sm" onClick={handleInstall} className="mt-3 h-8 gap-1.5 bg-emerald-700 px-3 text-xs hover:bg-emerald-800">
              <Download className="h-3.5 w-3.5" /> Installer l'application
            </Button>
          ) : (
            <p className="mt-3 text-xs font-medium text-slate-700">Sur Android, ouvrez le menu du navigateur puis choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ».</p>
          )}
        </div>
      </div>
    </aside>
  );
}
