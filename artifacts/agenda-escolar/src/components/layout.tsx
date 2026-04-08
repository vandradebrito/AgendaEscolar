import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Calendar, CheckSquare, Clock, BookOpen, StickyNote, Home, LogOut, UserCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useClerk } from "@clerk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { clearAccessCache } from "@/components/access-gate";

interface LayoutProps {
  children: ReactNode;
  role?: string;
}

export function Layout({ children, role }: LayoutProps) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const isAdmin = role === "admin";

  const links = [
    { href: "/dashboard", label: "Início", icon: Home },
    { href: "/horario", label: "Horário", icon: Clock },
    { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
    { href: "/eventos", label: "Eventos", icon: Calendar },
    { href: "/materias", label: "Matérias", icon: BookOpen },
    { href: "/anotacoes", label: "Notas", icon: StickyNote },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  const initials = user
    ? (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")
    : "?";

  return (
    <div className="flex min-h-screen w-full bg-background">

      {/* ── Desktop sidebar ── */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Sua companheira de estudos</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label === "Eventos" ? "Eventos e Provas" : link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={user?.imageUrl} alt={user?.firstName ?? ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials || <UserCircle className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">
                {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.emailAddresses?.[0]?.emailAddress ?? ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => { clearAccessCache(); signOut({ redirectUrl: "/" }); }}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top header */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
          <h1 className="text-lg font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Agenda Escolar
          </h1>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.imageUrl} alt={user?.firstName ?? ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials || <UserCircle className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => { clearAccessCache(); signOut({ redirectUrl: "/" }); }}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-20 bg-background border-t border-border">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
