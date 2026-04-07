import { useState } from "react";
import { useListTasks, getListTasksQueryKey, useUpdateTask, useCreateTask, useDeleteTask, useListSubjects, ListTasksStatus } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

function parseDateLocal(dateStr: string): Date {
  return parse(dateStr, "yyyy-MM-dd", new Date());
}

export default function Tasks() {
  const [filter, setFilter] = useState<ListTasksStatus>("pending");
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useListTasks({ status: filter }, { query: { queryKey: getListTasksQueryKey({ status: filter }) } });
  const { data: subjects } = useListSubjects();
  
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string>("none");
  const [priority, setPriority] = useState<"low"|"medium"|"high">("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const toggleTask = (id: number, completed: boolean) => {
    updateTask.mutate({ id, data: { completed } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ status: filter }) });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Excluir esta tarefa?")) {
      deleteTask.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ status: filter }) });
        }
      });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate({ 
      data: { 
        title, 
        description, 
        priority,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
        subjectId: subjectId !== "none" ? Number(subjectId) : undefined 
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Tarefa criada!" });
        setIsOpen(false);
        setTitle("");
        setDescription("");
        setSubjectId("none");
        setPriority("medium");
        setDueDate(undefined);
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ status: filter }) });
      },
      onError: () => {
        toast({ title: "Erro ao criar tarefa", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas lições e trabalhos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-lg">
            {(["pending", "completed", "all"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {f === 'pending' ? 'Pendentes' : f === 'completed' ? 'Concluídas' : 'Todas'}
              </button>
            ))}
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="shrink-0"><Plus className="h-5 w-5" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex: Fazer exercícios pág 45" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Matéria</Label>
                    <Select value={subjectId} onValueChange={setSubjectId}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Geral</SelectItem>
                        {subjects?.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label>Data de Entrega</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`justify-start text-left font-normal ${!dueDate && "text-muted-foreground"}`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes opcionais..." />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createTask.isPending}>Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              Nenhuma tarefa encontrada.
            </div>
          ) : (
            tasks?.map(task => (
              <Card key={task.id} className={`p-4 flex items-start gap-4 transition-all group ${task.completed ? 'opacity-60 bg-muted/30' : 'bg-card hover:border-primary/50'}`}>
                <Checkbox 
                  checked={task.completed} 
                  onCheckedChange={(checked) => toggleTask(task.id, !!checked)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    {task.priority === 'high' && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Alta</Badge>}
                    {task.priority === 'medium' && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Média</Badge>}
                    {task.priority === 'low' && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Baixa</Badge>}
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs mt-2">
                    {task.subjectName && (
                      <span 
                        className="px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: task.subjectColor || 'var(--primary)' }}
                      >
                        {task.subjectName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`flex items-center px-2 py-0.5 rounded-full ${parseDateLocal(task.dueDate) < new Date() && !task.completed ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                        Vencimento: {parseDateLocal(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive -mt-2 -mr-2"
                  onClick={() => handleDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
