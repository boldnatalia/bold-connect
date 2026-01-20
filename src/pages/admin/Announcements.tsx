import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2, FileText, Loader2, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminAnnouncements() {
  const { announcements, isLoading, createAnnouncement, updateAnnouncement, deleteAnnouncement, isCreating, isUpdating } = useAnnouncements();
  const { templates } = useMessageTemplates();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    createAnnouncement(formData, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormData({ title: '', content: '' });
      }
    });
  };

  const handleUpdate = (id: string) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    updateAnnouncement({ id, ...formData }, {
      onSuccess: () => {
        setEditingId(null);
        setFormData({ title: '', content: '' });
      }
    });
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    updateAnnouncement({ id, is_active: !currentStatus });
  };

  const useTemplate = (template: { title: string; content: string }) => {
    setFormData({ title: template.title, content: template.content });
  };

  const openEdit = (announcement: { id: string; title: string; content: string }) => {
    setEditingId(announcement.id);
    setFormData({ title: announcement.title, content: announcement.content });
  };

  return (
    <AdminLayout title="Avisos em Massa">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Gerencie os avisos enviados para todos os usuários
          </p>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Aviso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Aviso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Usar Template</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Selecionar template...
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[300px]">
                        {templates.map((template) => (
                          <DropdownMenuItem
                            key={template.id}
                            onClick={() => useTemplate(template)}
                          >
                            {template.title}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Título do aviso"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Conteúdo</label>
                  <Textarea
                    placeholder="Conteúdo do aviso..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={5}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Publicar Aviso
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                          {announcement.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(announcement.created_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <h3 className="font-medium">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcement.is_active || false}
                        onCheckedChange={() => handleToggleActive(announcement.id, announcement.is_active || false)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(announcement)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteAnnouncement(announcement.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="font-medium mb-1">Nenhum aviso criado</p>
              <p className="text-sm text-muted-foreground">
                Clique em "Novo Aviso" para criar o primeiro
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Aviso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  placeholder="Título do aviso"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Conteúdo</label>
                <Textarea
                  placeholder="Conteúdo do aviso..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => editingId && handleUpdate(editingId)} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
