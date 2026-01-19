import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useTickets } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const MAX_DESCRIPTION_LENGTH = 150;

const QUICK_TEMPLATES = [
  'Instalar tomada',
  'Pendurar quadro',
  'Manutenção geral',
  'Trocar lâmpada',
  'Reparo de ar-condicionado',
];

export default function NewTicket() {
  const navigate = useNavigate();
  const { createTicket } = useTickets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickTemplate = (template: string) => {
    setTitle(template);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Informe o título do chamado');
      return;
    }

    if (!description.trim()) {
      setError('Descreva sua solicitação');
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(`A descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`);
      return;
    }

    setIsLoading(true);
    try {
      await createTicket.mutateAsync({ title: title.trim(), description: description.trim() });
      toast.success('Chamado aberto com sucesso!');
      navigate('/tickets');
    } catch (err) {
      setError('Erro ao abrir chamado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="Novo Chamado" showBack>
      <div className="p-4 max-w-lg mx-auto animate-fade-in">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Abrir Chamado</CardTitle>
                <CardDescription>
                  Descreva sua solicitação de forma clara e objetiva
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Sugestões rápidas</Label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEMPLATES.map((template) => (
                    <Button
                      key={template}
                      type="button"
                      variant={title === template ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => handleQuickTemplate(template)}
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título da Solicitação</Label>
                <Input
                  id="title"
                  placeholder="Ex: Instalar tomada"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Descrição</Label>
                  <span className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="description"
                  placeholder="Descreva sua solicitação com detalhes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                  maxLength={MAX_DESCRIPTION_LENGTH + 10}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Abrindo chamado...
                  </>
                ) : (
                  'Abrir Chamado'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
