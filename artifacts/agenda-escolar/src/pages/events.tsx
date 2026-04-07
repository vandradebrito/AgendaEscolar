import { useState } from "react";
import {
  useListEvents,
  getListEventsQueryKey,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useListSubjects,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type EventType = "exam" | "presentation" | "fieldtrip" | "holiday" | "other";

const TYPE_LABELS: Record<EventType, string> = {
  exam: "Prova",
  presentation: "Apresentação",
  fieldtrip: "Passeio",
  holiday: "Feriado",
  other: "Outro",
};

const TYPE_COLORS: Record<EventType, string> = {
  exam: "bg-destructive text-destructive-foreground",
  presentation: "bg-primary text-primary-foreground",
  fieldtrip: "bg-secondary text-secondary-foreground",
  holiday: "bg-accent text-accent-foreground",
  other: "bg-muted text-muted-foreground",
};

type EditingEvent = {
  id: number;
  title: string;
  description?: string | null;
  subjectId?: number | null;
  date: string;
  type: EventType;
} | null;

function emptyForm() {
  return {
    title: "",
    description: "",
    subjectId: "none",
    date: undefined as Date | undefined,
    type: "other" as EventType,
  };
}

export default function Events() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events, isLoading } = useListEvents(
    {},
    { query: { queryKey: getListEventsQueryKey() } }
  );
  const { data: subjects } = useListSubjects();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditingEvent>(null);

  const [form, setForm] = useState(emptyForm());

  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm());
    setIsOpen(true);
  };

  const openEdit = (ev: NonNullable<typeof events>[number]) => {
    setEditingEvent({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      subjectId: ev.subjectId,
      date: ev.date,
      type: ev.type as EventType,
    });
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      subjectId: ev.subjectId ? ev.subjectId.toString() : "none",
      date: parseISO(ev.date),
      type: ev.type as EventType,
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingEvent(null);
    setForm(emptyForm());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) return;

    const payload = {
      title: form.title,
      description: form.description || undefined,
      subjectId: form.subjectId !== "none" ? Number(form.subjectId) : undefined,
      date: format(form.date, "yyyy-MM-dd"),
      type: form.type,
    };

    const onSuccess = () => {
      toast({ title: editingEvent ? "Evento atualizado!" : "Evento criado!" });
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
      handleClose();
    };
    const onError = () => {
      toast({ title: "Erro ao salvar evento", variant: "destructive" });
    };

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: payload }, { onSuccess, onError });
    } else {
      createEvent.mutate({ data: payload }, { onSuccess, onError });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Excluir este evento?")) return;
    deleteEvent.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Evento excluído." });
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        },
      }
    );
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos e Provas</h1>
          <p className="text-muted-foreground mt-2">Fique de olho nas datas importantes.</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events?.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              <p className="font-medium">Nenhum evento encontrado.</p>
              <p className="text-sm mt-1">Clique em "Novo Evento" para adicionar.</p>
            </div>
          ) : (
            events?.map((event) => (
              <Card key={event.id} className="p-5 flex gap-4 group hover:border-primary/40 transition-colors">
                <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-3 min-w-[72px]">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    {parseISO(event.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {parseISO(event.date).getDate() + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${TYPE_COLORS[event.type as EventType]} text-xs`}>
                      {TYPE_LABELS[event.type as EventType] ?? event.type}
                    </Badge>
                    {event.subjectName && (
                      <span className="text-xs font-medium flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: event.subjectColor ?? "var(--primary)" }}
                        />
                        {event.subjectName}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-base truncate mt-1">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(event)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Ex: Prova de Matemática"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as EventType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Prova</SelectItem>
                    <SelectItem value="presentation">Apresentação</SelectItem>
                    <SelectItem value="fieldtrip">Passeio</SelectItem>
                    <SelectItem value="holiday">Feriado</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Matéria</Label>
                <Select
                  value={form.subjectId}
                  onValueChange={(v) => setForm({ ...form, subjectId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral</SelectItem>
                    {subjects?.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 flex flex-col">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className={`justify-start text-left font-normal ${!form.date && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.date ? format(form.date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date}
                    onSelect={(d) => setForm({ ...form, date: d })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes do evento..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !form.date}>
                {editingEvent ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
