import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, ShieldX, Clock, Users, History, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserRecord {
  id: number;
  clerkUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface LoginRecord {
  id: number;
  clerkUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  loggedInAt: string;
}

const STATUS_CONFIG = {
  approved: { label: "Aprovado", className: "bg-green-100 text-green-800 border-green-200" },
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  denied: { label: "Negado", className: "bg-red-100 text-red-800 border-red-200" },
};

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
  return email[0]?.toUpperCase() ?? "?";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Admin() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [history, setHistory] = useState<LoginRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoadingUsers(true);
    fetch("/api/admin/users", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setUsers(data); setLoadingUsers(false); })
      .catch(() => setLoadingUsers(false));
  };

  const fetchHistory = () => {
    setLoadingHistory(true);
    fetch("/api/admin/login-history", { credentials: "include" })
      .then(r => r.json())
      .then(data => { setHistory(data); setLoadingHistory(false); })
      .catch(() => setLoadingHistory(false));
  };

  useEffect(() => {
    fetchUsers();
    fetchHistory();
  }, []);

  const updateStatus = async (clerkUserId: string, status: "approved" | "denied" | "pending") => {
    setUpdating(clerkUserId + status);
    try {
      const res = await fetch(`/api/admin/users/${clerkUserId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast({ title: status === "approved" ? "Acesso liberado!" : "Acesso negado." });
      fetchUsers();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const updateRole = async (clerkUserId: string, role: "admin" | "user") => {
    setUpdating(clerkUserId + role);
    try {
      const res = await fetch(`/api/admin/users/${clerkUserId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      toast({ title: role === "admin" ? "Usuário promovido a admin!" : "Admin removido." });
      fetchUsers();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const pendingCount = users.filter(u => u.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          Painel Admin
        </h1>
        <p className="text-muted-foreground mt-2">Gerencie quem tem acesso à Agenda Escolar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">{users.length}</div></CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-yellow-800">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-yellow-700">{pendingCount}</div></CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-800">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-700">{users.filter(u => u.status === "approved").length}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Usuários
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-yellow-500 text-white rounded-full">{pendingCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            Histórico de Logins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          {loadingUsers ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
              Nenhum usuário cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(u => {
                const cfg = STATUS_CONFIG[u.status as keyof typeof STATUS_CONFIG];
                return (
                  <Card key={u.clerkUserId} className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={u.imageUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {initials(u.name, u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{u.name ?? u.email}</p>
                        <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Desde {formatDate(u.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {u.role === "admin" && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">Admin</Badge>
                        )}
                        <Badge className={`${cfg?.className} text-xs border`}>{cfg?.label ?? u.status}</Badge>
                        {u.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-300 hover:bg-green-50 h-7 text-xs"
                            disabled={updating !== null}
                            onClick={() => updateStatus(u.clerkUserId, "approved")}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Aprovar
                          </Button>
                        )}
                        {u.status !== "denied" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-300 hover:bg-red-50 h-7 text-xs"
                            disabled={updating !== null}
                            onClick={() => updateStatus(u.clerkUserId, "denied")}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Negar
                          </Button>
                        )}
                        {u.role !== "admin" && u.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={updating !== null}
                            onClick={() => updateRole(u.clerkUserId, "admin")}
                          >
                            Tornar Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {loadingHistory ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
              Nenhum login registrado.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={h.imageUrl ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials(h.name, h.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.name ?? h.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{h.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{formatDate(h.loggedInAt)}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
