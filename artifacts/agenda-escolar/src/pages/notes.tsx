import { useState } from "react";
import { useListNotes, getListNotesQueryKey, useCreateNote, useDeleteNote, useListSubjects } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyNote, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Notes() {
  const { data: notes, isLoading } = useListNotes({ query: { queryKey: getListNotesQueryKey() } });
  const { data: subjects } = useListSubjects();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState<string>("none");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createNote.mutate({ 
      data: { 
        title, 
        content, 
        subjectId: subjectId !== "none" ? Number(subjectId) : undefined 
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Anotação salva!" });
        setIsOpen(false);
        setTitle("");
        setContent("");
        setSubjectId("none");
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro ao salvar anotação", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Excluir esta anotação?")) {
      deleteNote.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Anotação excluída!" });
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anotações</h1>
          <p className="text-muted-foreground mt-2">Ideias, lembretes e rascunhos.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white">
              <Plus className="h-4 w-4" />
              Nova Anotação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Anotação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  placeholder="Ex: Resumo de História"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Matéria (Opcional)</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral (Sem matéria)</SelectItem>
                    {subjects?.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea 
                  id="content" 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  required 
                  placeholder="Escreva sua anotação aqui..."
                  rows={5}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createNote.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              Nenhuma anotação encontrada.
            </div>
          ) : (
            notes?.map(note => (
              <Card key={note.id} className="p-5 flex flex-col bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200/50 relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(note.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex items-start justify-between mb-3 pr-8">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-yellow-600" />
                    {note.title}
                  </h3>
                  {note.subjectName && (
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white shrink-0"
                      style={{ backgroundColor: note.subjectColor || 'var(--primary)' }}
                    >
                      {note.subjectName}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex-1 whitespace-pre-wrap mb-4">
                  {note.content}
                </p>
                <div className="text-xs text-muted-foreground/70 mt-auto pt-4 border-t border-yellow-200/30">
                  Atualizado em {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
