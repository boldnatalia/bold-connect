import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MoreVertical, Edit, Trash2, FileText, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'energia', label: 'Energia' },
  { value: 'agua', label: 'Água' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'geral', label: 'Geral' },
];

export default function AdminTemplates() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, isCreating, isUpdating } = useMessageTemplates();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'geral' });

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    createTemplate(formData, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormData({ title: '', content: '', category: 'geral' });
      }
    });
  };

  const handleUpdate = (id: string) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    updateTemplate({ id, ...formData }, {
      onSuccess: () => {
        setEditingId(null);
        setFormData({ title: '', content: '', category: 'geral' });
      }
    });
  };

  const openEdit = (template: { id: string; title: string; content: string; category: string | null }) => {
    setEditingId(template.id);
    setFormData({ 
      title: template.title, 
      content: template.content, 
      category: template.category || 'geral' 
    });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Template copiado!');
  };

  return (
    <AdminLayout title="Templates de Mensagens">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Mensagens prontas para avisos rápidos
          </p>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Ex: Interrupção de energia"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Conteúdo</label>
                  <Textarea
                    placeholder="Conteúdo da mensagem..."
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
                    Criar Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">{template.title}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyToClipboard(template.content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {template.category && (
                    <Badge variant="outline" className="mb-2 text-xs">
                      {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="font-medium mb-1">Nenhum template criado</p>
              <p className="text-sm text-muted-foreground">
                Crie templates para agilizar o envio de avisos
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  placeholder="Ex: Interrupção de energia"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Conteúdo</label>
                <Textarea
                  placeholder="Conteúdo da mensagem..."
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
