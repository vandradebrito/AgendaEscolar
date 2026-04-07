import { useState } from "react";
import { useListSubjects, getListSubjectsQueryKey, useCreateSubject, useDeleteSubject } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, User, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", 
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#0ea5e9", "#3b82f6", 
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"
];

export default function Subjects() {
  const { data: subjects, isLoading } = useListSubjects({ query: { queryKey: getListSubjectsQueryKey() } });
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSubject.mutate({ data: { name, teacher, color } }, {
      onSuccess: () => {
        toast({ title: "Matéria criada com sucesso!" });
        setIsOpen(false);
        setName("");
        setTeacher("");
        setColor(PRESET_COLORS[0]);
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro ao criar matéria", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta matéria?")) {
      deleteSubject.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Matéria excluída!" });
          queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matérias</h1>
          <p className="text-muted-foreground mt-2">Suas disciplinas escolares.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Matéria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Matéria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Matéria</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="Ex: Matemática"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Professor(a) (Opcional)</Label>
                <Input 
                  id="teacher" 
                  value={teacher} 
                  onChange={e => setTeacher(e.target.value)} 
                  placeholder="Ex: Prof. João"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-primary scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createSubject.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              Nenhuma matéria cadastrada.
            </div>
          ) : (
            subjects?.map(subject => (
              <Card key={subject.id} className="overflow-hidden group relative">
                <div 
                  className="h-12 w-full"
                  style={{ backgroundColor: subject.color }}
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(subject.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="p-5">
                  <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    {subject.name}
                  </h3>
                  {subject.teacher ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Prof. {subject.teacher}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Sem professor cadastrado</div>
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
