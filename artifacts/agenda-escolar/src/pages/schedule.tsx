import { useListSchedule, getListScheduleQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = [
  { id: 1, name: "Segunda" },
  { id: 2, name: "Terça" },
  { id: 3, name: "Quarta" },
  { id: 4, name: "Quinta" },
  { id: 5, name: "Sexta" },
];

export default function Schedule() {
  const { data: schedule, isLoading } = useListSchedule({ query: { queryKey: getListScheduleQueryKey() } });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Horário Semanal</h1>
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Horário Semanal</h1>
        <p className="text-muted-foreground mt-2">Visualize suas aulas da semana.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {DAYS.map(day => {
          const dayEntries = schedule?.filter(e => e.dayOfWeek === day.id).sort((a, b) => a.startTime.localeCompare(b.startTime)) || [];
          
          return (
            <Card key={day.id} className="bg-card">
              <div className="p-3 border-b text-center font-medium bg-muted/30">
                {day.name}
              </div>
              <CardContent className="p-3 space-y-3">
                {dayEntries.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-4">Livre</p>
                ) : (
                  dayEntries.map(entry => (
                    <div 
                      key={entry.id} 
                      className="p-3 rounded-lg border shadow-sm flex flex-col gap-1"
                      style={{ borderLeftWidth: '4px', borderLeftColor: entry.subjectColor || 'var(--primary)' }}
                    >
                      <div className="text-xs font-medium text-muted-foreground">
                        {entry.startTime} - {entry.endTime}
                      </div>
                      <div className="font-semibold text-sm">
                        {entry.subjectName}
                      </div>
                      {entry.room && (
                        <div className="text-xs text-muted-foreground">
                          Sala: {entry.room}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
