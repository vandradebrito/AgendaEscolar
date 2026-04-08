import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { AccessGate, clearAccessCache } from "@/components/access-gate";
import Dashboard from "@/pages/dashboard";
import Schedule from "@/pages/schedule";
import Tasks from "@/pages/tasks";
import Events from "@/pages/events";
import Subjects from "@/pages/subjects";
import Notes from "@/pages/notes";
import Admin from "@/pages/admin";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function LandingPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8 p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Agenda Escolar</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Organize tarefas, horários, eventos e anotações da escola em um só lugar.
        </p>
      </div>
      <div className="flex gap-3">
        <Button size="lg" onClick={() => setLocation("/sign-in")}>
          Entrar
        </Button>
        <Button size="lg" variant="outline" onClick={() => setLocation("/sign-up")}>
          Criar conta
        </Button>
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component, role }: { component: React.ComponentType; role: string }) {
  return (
    <Show when="signed-in">
      <AccessGate>
        {() => (
          <Layout role={role}>
            <Component />
          </Layout>
        )}
      </AccessGate>
    </Show>
  );
}

function AdminRoute({ role }: { role: string }) {
  if (role !== "admin") return <Redirect to="/dashboard" />;
  return (
    <Show when="signed-in">
      <Layout role={role}>
        <Admin />
      </Layout>
    </Show>
  );
}

function AuthGuard({ children }: { children: (role: string) => React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <AccessGate>{children}</AccessGate>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/dashboard">
        {() => (
          <AuthGuard>
            {(role) => <Layout role={role}><Dashboard /></Layout>}
          </AuthGuard>
        )}
      </Route>
      <Route path="/horario">
        {() => (
          <AuthGuard>
            {(role) => <Layout role={role}><Schedule /></Layout>}
          </AuthGuard>
        )}
      </Route>
      <Route path="/tarefas">
        {() => (
          <AuthGuard>
            {(role) => <Layout role={role}><Tasks /></Layout>}
          </AuthGuard>
        )}
      </Route>
      <Route path="/eventos">
        {() => (
          <AuthGuard>
            {(role) => <Layout role={role}><Events /></Layout>}
          </AuthGuard>
        )}
      </Route>
      <Route path="/materias">
        {() => (
          <AuthGuard>
            {(role) => <Layout role={role}><Subjects /></Layout>}
          </AuthGuard>
        )}
      </Route>
      <Route path="/anotacoes">
        {() => (
          <AuthGuard>
            {(role) => <Layout role={role}><Notes /></Layout>}
          </AuthGuard>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <AuthGuard>
            {(role) => role === "admin"
              ? <Layout role={role}><Admin /></Layout>
              : <Redirect to="/dashboard" />
            }
          </AuthGuard>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
        clearAccessCache();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
