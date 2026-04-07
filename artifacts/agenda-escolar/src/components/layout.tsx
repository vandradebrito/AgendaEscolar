import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Calendar, CheckSquare, Clock, BookOpen, StickyNote, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/horario", label: "Horário", icon: Clock },
    { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
    { href: "/eventos", label: "Eventos", icon: Calendar },
    { href: "/materias", label: "Matérias", icon: BookOpen },
    { href: "/anotacoes", label: "Anotações", icon: StickyNote },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
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
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
