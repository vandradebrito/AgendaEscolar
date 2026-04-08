import { useEffect, useState, ReactNode } from "react";
import { useUser, useClerk } from "@clerk/react";
import { BookOpen, Clock, ShieldX, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type AccessStatus = "loading" | "approved" | "pending" | "denied";

interface AccessInfo {
  status: AccessStatus;
  role: string;
}

let cachedAccess: AccessInfo | null = null;

interface Props {
  children: (role: string) => ReactNode;
}

export function AccessGate({ children }: Props) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [access, setAccess] = useState<AccessInfo>(
    cachedAccess ?? { status: "loading", role: "user" }
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (cachedAccess) {
      setAccess(cachedAccess);
      return;
    }

    fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: { status: string; role: string }) => {
        const info: AccessInfo = {
          status: data.status as AccessStatus,
          role: data.role,
        };
        cachedAccess = info;
        setAccess(info);
      })
      .catch(() => {
        setAccess({ status: "pending", role: "user" });
      });
  }, [isLoaded, user]);

  if (access.status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <BookOpen className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-sm">Verificando acesso…</p>
      </div>
    );
  }

  if (access.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-yellow-100 flex items-center justify-center">
          <Clock className="h-10 w-10 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Aguardando aprovação</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Seu cadastro foi recebido. Aguarde o administrador liberar o seu acesso.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Conectado como <strong>{user?.emailAddresses?.[0]?.emailAddress}</strong>
          </p>
        </div>
        <Button variant="outline" onClick={() => { cachedAccess = null; signOut({ redirectUrl: "/" }); }}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    );
  }

  if (access.status === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Acesso negado</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Sua conta não tem permissão para acessar este aplicativo.
          </p>
        </div>
        <Button variant="outline" onClick={() => { cachedAccess = null; signOut({ redirectUrl: "/" }); }}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    );
  }

  return <>{children(access.role)}</>;
}

export function clearAccessCache() {
  cachedAccess = null;
}
