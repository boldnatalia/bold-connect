import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Loader2, AlertCircle } from 'lucide-react';

export default function MassAnnouncement() {
  const { createAnnouncement, isCreating, announcements } = useAnnouncements();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const activeAnnouncements = announcements.filter(a => a.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha o título e o conteúdo do aviso',
        variant: 'destructive',
      });
      return;
    }

    try {
      createAnnouncement({ title: title.trim(), content: content.trim() });
      toast({
        title: 'Aviso enviado!',
        description: 'Todos os clientes foram notificados.',
      });
      setTitle('');
      setContent('');
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout title="Aviso Geral" showBack>
      <div className="p-4 space-y-4">
        {/* Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-warning" />
              Novo Aviso para Todos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Manutenção programada"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Descreva o aviso em detalhes..."
                  rows={4}
                />
              </div>
              <Button
                type="submit"
                className="w-full min-h-[48px]"
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Megaphone className="h-5 w-5 mr-2" />
                )}
                Enviar para Todos
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Announcements */}
        {activeAnnouncements.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Avisos Ativos ({activeAnnouncements.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeAnnouncements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="p-3 bg-muted/50 rounded-lg border"
                >
                  <p className="font-medium text-sm">{announcement.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {announcement.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
