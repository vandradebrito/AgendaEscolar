import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Calendar, BookOpen, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { parse } from "date-fns";

function parseDateLocal(dateStr: string): Date {
  return parse(dateStr, "yyyy-MM-dd", new Date());
}

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { user } = useUser();

  const greeting = user?.firstName ? `Olá, ${user.firstName}!` : "Olá!";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{greeting} Aqui está a agenda escolar da Bella!</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{greeting} Aqui está a agenda escolar da Bella!</h1>
        <p className="text-muted-foreground mt-2">Veja o que temos programado para hoje e próximos dias.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summary.pendingTasksCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/20 border-secondary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary-foreground">{summary.upcomingEventsCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-muted border-muted-foreground/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{summary.completedTasksCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-accent/30 border-accent/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Matérias</CardTitle>
            <BookOpen className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-foreground">{summary.subjectsCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.todaySchedule.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Sem aulas cadastradas para hoje.</p>
            ) : (
              <div className="space-y-4">
                {summary.todaySchedule.map(entry => (
                  <div key={entry.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="text-sm font-medium w-16 shrink-0">{entry.startTime}</div>
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: entry.subjectColor || 'var(--primary)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{entry.subjectName}</p>
                      {entry.room && <p className="text-xs text-muted-foreground truncate">Sala: {entry.room}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Próximas Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.upcomingTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">Oba! Nenhuma tarefa pendente.</p>
              ) : (
                <div className="space-y-3">
                  {summary.upcomingTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex gap-2 text-xs mt-1">
                          {task.subjectName && (
                            <span 
                              className="px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: task.subjectColor || 'var(--primary)' }}
                            >
                              {task.subjectName}
                            </span>
                          )}
                          {task.dueDate && <span className="text-muted-foreground">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
