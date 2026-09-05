import { useAuth } from "@/_core/hooks/useAuth";
import { ShieldOff, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountSuspended() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <ShieldOff className="w-10 h-10 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Compte suspendu</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Votre compte a été temporairement suspendu par un administrateur.
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
          </p>
        </div>
        <Button
          onClick={() => logout()}
          variant="outline"
          className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
