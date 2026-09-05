import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Heart,
  MessageCircle,
  Send,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useUtils();
  const [commentText, setCommentText] = useState("");

  const { data: course, isLoading } = trpc.learning.get.useQuery({ slug: slug ?? "" }, { enabled: !!slug });
  const { data: myProgress } = trpc.learning.myProgress.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myLikes } = trpc.learning.myLikes.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myRating } = trpc.learning.myRating.useQuery(
    { courseId: course?.id ?? 0 },
    { enabled: isAuthenticated && !!course?.id }
  );
  const { data: avgRating } = trpc.learning.avgRating.useQuery(
    { courseId: course?.id ?? 0 },
    { enabled: !!course?.id }
  );
  const { data: likesCount } = trpc.learning.likesCount.useQuery(
    { courseId: course?.id ?? 0 },
    { enabled: !!course?.id }
  );
  const { data: comments } = trpc.learning.comments.useQuery(
    { courseId: course?.id ?? 0 },
    { enabled: !!course?.id }
  );

  const isCompleted = (myProgress ?? []).some((p) => p.courseId === course?.id);
  const isLiked = (myLikes ?? []).some((l) => l.courseId === course?.id);

  const markComplete = trpc.learning.markComplete.useMutation({
    onSuccess: () => { utils.learning.myProgress.invalidate(); toast.success("Cours marqué comme terminé !"); },
  });
  const unmarkComplete = trpc.learning.unmarkComplete.useMutation({
    onSuccess: () => { utils.learning.myProgress.invalidate(); toast.success("Progression réinitialisée."); },
  });
  const toggleLike = trpc.learning.toggleLike.useMutation({
    onSuccess: () => { utils.learning.myLikes.invalidate(); utils.learning.likesCount.invalidate({ courseId: course?.id }); },
  });
  const rateMutation = trpc.learning.rate.useMutation({
    onSuccess: () => { utils.learning.myRating.invalidate(); utils.learning.avgRating.invalidate({ courseId: course?.id }); toast.success("Note enregistrée !"); },
  });
  const commentMutation = trpc.learning.comment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.learning.comments.invalidate({ courseId: course?.id });
      toast.success("Commentaire envoyé — il sera visible après modération.");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-24 sm:pb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="text-5xl">🔍</div>
        <h3 className="text-lg font-semibold">Cours introuvable</h3>
        <Link href="/learn"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour aux cours</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 sm:pb-6">
      {/* Back */}
      <Link href="/learn">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Retour aux cours
        </Button>
      </Link>

      {/* Course header */}
      <div className="space-y-3">
        <div className="text-5xl">{course.coverEmoji}</div>
        <h1 className="text-2xl font-bold tracking-tight leading-snug">{course.title}</h1>
        {course.excerpt && <p className="text-muted-foreground leading-relaxed">{course.excerpt}</p>}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{course.readingMinutes} min de lecture</span>
          </div>
          {avgRating && (
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{avgRating.average}/5 ({avgRating.count} avis)</span>
            </div>
          )}
          {(likesCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
              <span>{likesCount}</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Content */}
      <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
        {course.content}
      </div>

      <Separator />

      {/* Interaction bar */}
      {isAuthenticated ? (
        <div className="flex flex-wrap items-center gap-3">
          {/* Mark complete */}
          <Button
            variant={isCompleted ? "default" : "outline"}
            size="sm"
            className={`gap-2 ${isCompleted ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
            onClick={() => {
              if (!course?.id) return;
              isCompleted
                ? unmarkComplete.mutate({ courseId: course.id })
                : markComplete.mutate({ courseId: course.id });
            }}
          >
            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            {isCompleted ? "Terminé" : "Marquer comme terminé"}
          </Button>

          {/* Like */}
          {course.allowLikes && (
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 transition-colors ${isLiked ? "border-rose-300 text-rose-600 bg-rose-50 hover:bg-rose-100" : ""}`}
              onClick={() => course?.id && toggleLike.mutate({ courseId: course.id })}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500" : ""}`} />
              {isLiked ? "Aimé" : "J'aime"}
              {(likesCount ?? 0) > 0 && <span className="text-xs text-muted-foreground">({likesCount})</span>}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
          <User className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground flex-1">Connectez-vous pour interagir avec ce cours.</p>
          <Button size="sm" onClick={() => startLogin()}>Se connecter</Button>
        </div>
      )}

      {/* Rating */}
      {isAuthenticated && course.allowRatings && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Votre note</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <StarRating
              value={myRating ?? 0}
              onChange={(v) => course?.id && rateMutation.mutate({ courseId: course.id, rating: v })}
            />
            {myRating ? (
              <p className="text-xs text-muted-foreground mt-2">Vous avez noté ce cours {myRating}/5.</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">Cliquez sur une étoile pour noter.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {course.allowComments && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            Commentaires
            {(comments?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="text-xs">{comments?.length}</Badge>
            )}
          </h3>

          {/* Comment form */}
          {isAuthenticated ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Partagez votre avis ou posez une question..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                maxLength={1000}
                className="resize-none text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{commentText.length}/1000 · Les commentaires sont modérés avant publication.</span>
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={commentText.trim().length === 0 || commentMutation.isPending}
                  onClick={() => course?.id && commentMutation.mutate({ courseId: course.id, content: commentText.trim() })}
                >
                  <Send className="h-3.5 w-3.5" />
                  Envoyer
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              <button onClick={() => startLogin()} className="text-emerald-600 hover:underline font-medium">Connectez-vous</button> pour laisser un commentaire.
            </p>
          )}

          {/* Comments list */}
          {(comments?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {comments?.map((c) => (
                <div key={c.id} className="flex gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">Utilisateur</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucun commentaire pour l'instant. Soyez le premier !</p>
          )}
        </div>
      )}
    </div>
  );
}
