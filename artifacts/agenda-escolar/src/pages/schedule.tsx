import { useState } from "react";
import {
  useListSchedule,
  getListScheduleQueryKey,
  useCreateScheduleEntry,
  useUpdateScheduleEntry,
  useDeleteScheduleEntry,
  useListSubjects,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const DAYS = [
  { id: 1, name: "Segunda" },
  { id: 2, name: "Terça" },
  { id: 3, name: "Quarta" },
  { id: 4, name: "Quinta" },
  { id: 5, name: "Sexta" },
];

type EditingEntry = {
  id: number;
  subjectId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
} | null;

function emptyForm(dayOfWeek = 1) {
  return {
    subjectId: "none",
    dayOfWeek: dayOfWeek.toString(),
    startTime: "07:30",
    endTime: "08:20",
    room: "",
  };
}

export default function Schedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: schedule, isLoading } = useListSchedule({
    query: { queryKey: getListScheduleQueryKey() },
  });
  const { data: subjects } = useListSubjects();

  const createEntry = useCreateScheduleEntry();
  const updateEntry = useUpdateScheduleEntry();
  const deleteEntry = useDeleteScheduleEntry();

  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditingEntry>(null);
  const [form, setForm] = useState(emptyForm());

  const openCreate = (dayOfWeek?: number) => {
    setEditingEntry(null);
    setForm(emptyForm(dayOfWeek ?? 1));
    setIsOpen(true);
  };

  const openEdit = (entry: NonNullable<typeof schedule>[number]) => {
    setEditingEntry({
      id: entry.id,
      subjectId: entry.subjectId,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room,
    });
    setForm({
      subjectId: entry.subjectId.toString(),
      dayOfWeek: entry.dayOfWeek.toString(),
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room ?? "",
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingEntry(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.subjectId === "none") {
      toast({ title: "Selecione uma matéria", variant: "destructive" });
      return;
    }

    const payload = {
      subjectId: Number(form.subjectId),
      dayOfWeek: Number(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      room: form.room || undefined,
    };

    const onSuccess = () => {
      toast({ title: editingEntry ? "Aula atualizada!" : "Aula adicionada!" });
      queryClient.invalidateQueries({ queryKey: getListScheduleQueryKey() });
      handleClose();
    };
    const onError = () => {
      toast({ title: "Erro ao salvar aula", variant: "destructive" });
    };

    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, data: payload }, { onSuccess, onError });
    } else {
      createEntry.mutate({ data: payload }, { onSuccess, onError });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Excluir esta aula do horário?")) return;
    deleteEntry.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Aula removida." });
          queryClient.invalidateQueries({ queryKey: getListScheduleQueryKey() });
        },
      }
    );
  };

  const isPending = createEntry.isPending || updateEntry.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Horário Semanal</h1>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Horário Semanal</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas aulas da semana.</p>
        </div>
        <Button onClick={() => openCreate()} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Nova Aula
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {DAYS.map((day) => {
          const dayEntries =
            schedule
              ?.filter((e) => e.dayOfWeek === day.id)
              .sort((a, b) => a.startTime.localeCompare(b.startTime)) ?? [];

          return (
            <Card key={day.id} className="bg-card overflow-hidden">
              <div className="p-3 border-b text-center font-semibold bg-muted/30 flex items-center justify-between px-3">
                <span className="flex-1 text-center">{day.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-60 hover:opacity-100 shrink-0"
                  onClick={() => openCreate(day.id)}
                  title={`Adicionar aula na ${day.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <CardContent className="p-3 space-y-3">
                {dayEntries.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-6">
                    Livre
                  </p>
                ) : (
                  dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group p-3 rounded-lg border shadow-sm flex flex-col gap-1 relative"
                      style={{
                        borderLeftWidth: "4px",
                        borderLeftColor: entry.subjectColor || "var(--primary)",
                      }}
                    >
                      <div className="text-xs font-medium text-muted-foreground">
                        {entry.startTime} - {entry.endTime}
                      </div>
                      <div className="font-semibold text-sm">{entry.subjectName}</div>
                      {entry.room && (
                        <div className="text-xs text-muted-foreground">
                          {entry.room}
                        </div>
                      )}
                      <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => openEdit(entry)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Editar Aula" : "Nova Aula"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Matéria</Label>
              <Select
                value={form.subjectId}
                onValueChange={(v) => setForm({ ...form, subjectId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matéria..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select
                value={form.dayOfWeek}
                onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Término</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sala (opcional)</Label>
              <Input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="Ex: Sala 5, Lab Bio, Quadra..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {editingEntry ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
