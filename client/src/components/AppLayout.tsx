import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children }: Props) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user && (user as any).isBlocked) {
      navigate("/suspended");
    }
  }, [user, loading, navigate]);

  return <DashboardLayout>{children}</DashboardLayout>;
}
