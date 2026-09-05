import { trpc } from "@/lib/trpc";

type AdPosition = "dashboard_top" | "dashboard_bottom" | "sidebar" | "learn_page";

interface AdBannerProps {
  position: AdPosition;
  className?: string;
}

export function AdBanner({ position, className = "" }: AdBannerProps) {
  const { data: ads = [] } = trpc.admin.ads.listActive.useQuery();
  const clickMutation = trpc.admin.ads.click.useMutation();

  const filtered = ads.filter((a: { position: string }) => a.position === position);
  if (filtered.length === 0) return null;

  // Show the first active ad for this position
  const ad = filtered[0] as {
    id: number;
    title: string;
    imageUrl: string | null;
    linkUrl: string | null;
  };

  function handleClick() {
    clickMutation.mutate({ id: ad.id });
    if (ad.linkUrl) {
      window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className={`rounded-xl overflow-hidden border border-emerald-600/20 bg-emerald-950/20 cursor-pointer hover:border-emerald-600/40 transition-colors ${className}`}
      onClick={handleClick}
      role="banner"
      aria-label={`Publicité : ${ad.title}`}
    >
      {ad.imageUrl ? (
        <img src={ad.imageUrl} alt={ad.title} className="w-full h-auto object-cover max-h-24" />
      ) : (
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-emerald-300 font-medium">{ad.title}</p>
          {ad.linkUrl && (
            <span className="text-xs text-emerald-400 underline">En savoir plus →</span>
          )}
        </div>
      )}
    </div>
  );
}
