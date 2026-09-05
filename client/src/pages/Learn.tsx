import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { BookOpen, CheckCircle2, Clock, Heart, Play, Star, Youtube } from "lucide-react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { AdBanner } from "@/components/AdBanner";

const CATEGORY_COLORS: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-0">
        <div className="p-5 space-y-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Learn() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: courses, isLoading: loadingCourses } = trpc.learning.list.useQuery();
  const { data: categories } = trpc.learning.categories.useQuery();
  const { data: settings } = trpc.learning.settings.useQuery();
  const { data: myProgress } = trpc.learning.myProgress.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myLikes } = trpc.learning.myLikes.useQuery(undefined, { enabled: isAuthenticated });

  const completedIds = new Set((myProgress ?? []).map((p) => p.courseId));
  const likedIds = new Set((myLikes ?? []).map((l) => l.courseId));

  const totalCourses = courses?.length ?? 0;
  const completedCount = (courses ?? []).filter((c) => completedIds.has(c.id)).length;
  const progressPct = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

  const categoryMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      <AdBanner position="learn_page" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 px-4 py-2 rounded-xl transition-colors mb-4 group shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
            Tableau de bord
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Apprendre</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Formations sur la gestion financière et l'investissement</p>
        </div>
        {settings?.showYoutubeButton !== false && (
          <a
            href={settings?.youtubeChannelUrl ?? "https://youtube.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-red-200 transition-all duration-200 hover:scale-105 active:scale-95 self-start sm:self-auto"
          >
            <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-20 group-hover:opacity-30" />
            <Youtube className="h-5 w-5 relative z-10" />
            <span className="relative z-10">Voir Plus</span>
            <ExternalLink className="h-3.5 w-3.5 relative z-10" />
          </a>
        )}
      </div>

      {/* Progress banner (only when authenticated and there are courses) */}
      {isAuthenticated && totalCourses > 0 && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Ma progression</span>
              </div>
              <span className="text-sm font-bold text-emerald-700">{completedCount} / {totalCourses} cours</span>
            </div>
            <Progress value={progressPct} className="h-2 bg-emerald-100 [&>div]:bg-emerald-500" />
            <p className="text-xs text-emerald-600 mt-1.5">{progressPct}% complété</p>
          </CardContent>
        </Card>
      )}

      {/* Course grid */}
      {loadingCourses ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : totalCourses === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-6xl">📚</div>
          <h3 className="text-lg font-semibold text-foreground">Aucun cours disponible</h3>
          <p className="text-muted-foreground text-sm max-w-xs">Les cours seront publiés prochainement. Revenez bientôt !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(courses ?? []).map((course) => {
            const cat = course.categoryId ? categoryMap[course.categoryId] : null;
            const isCompleted = completedIds.has(course.id);
            const isLiked = likedIds.has(course.id);
            const colorClass = cat ? (CATEGORY_COLORS[cat.color] ?? CATEGORY_COLORS.emerald) : CATEGORY_COLORS.emerald;

            return (
              <Link key={course.id} href={`/learn/${course.slug}`}>
                <Card className={`group overflow-hidden border-border/60 hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full ${isCompleted ? "ring-1 ring-emerald-300" : ""}`}>
                  <CardContent className="p-5 flex flex-col h-full gap-3">
                    {/* Emoji + completed badge */}
                    <div className="flex items-start justify-between">
                      <div className="text-3xl leading-none">{course.coverEmoji}</div>
                      {isCompleted && (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-semibold">Terminé</span>
                        </div>
                      )}
                    </div>

                    {/* Category */}
                    {cat && (
                      <Badge variant="outline" className={`w-fit text-[10px] font-medium border ${colorClass}`}>
                        {cat.icon} {cat.name}
                      </Badge>
                    )}

                    {/* Title + excerpt */}
                    <div className="flex-1 space-y-1.5">
                      <h3 className="font-semibold text-sm leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      {course.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{course.excerpt}</p>
                      )}
                    </div>

                    {/* Footer: reading time + likes */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-[11px]">{course.readingMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {course.allowLikes && (
                          <div className={`flex items-center gap-1 ${isLiked ? "text-rose-500" : "text-muted-foreground"}`}>
                            <Heart className={`h-3 w-3 ${isLiked ? "fill-rose-500" : ""}`} />
                          </div>
                        )}
                        {course.allowRatings && (
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="h-3 w-3 fill-amber-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
