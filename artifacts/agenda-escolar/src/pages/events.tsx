import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon } from "lucide-react";

export default function Events() {
  const { data: events, isLoading } = useListEvents({}, { query: { queryKey: getListEventsQueryKey() } });

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      exam: 'Prova',
      presentation: 'Apresentação',
      fieldtrip: 'Passeio',
      holiday: 'Feriado',
      other: 'Outro'
    };
    return map[type] || type;
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      exam: 'bg-destructive text-destructive-foreground',
      presentation: 'bg-primary text-primary-foreground',
      fieldtrip: 'bg-secondary text-secondary-foreground',
      holiday: 'bg-accent text-accent-foreground',
      other: 'bg-muted text-muted-foreground'
    };
    return map[type] || 'bg-muted';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Eventos e Provas</h1>
        <p className="text-muted-foreground mt-2">Fique de olho nas datas importantes.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              Nenhum evento encontrado.
            </div>
          ) : (
            events?.map(event => (
              <Card key={event.id} className="p-5 flex gap-4">
                <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-3 min-w-[80px]">
                  <span className="text-sm font-bold text-muted-foreground uppercase">
                    {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {new Date(event.date).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={`${getTypeColor(event.type)} hover:${getTypeColor(event.type)}`}>
                      {getTypeLabel(event.type)}
                    </Badge>
                    {event.subjectName && (
                      <span className="text-xs font-medium flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.subjectColor || 'currentColor' }} />
                        {event.subjectName}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg truncate mt-1">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
