import { useState } from 'react';
import { useReceptionNotifications } from '@/hooks/useReceptionNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, Send, CheckCircle, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function ClientNotifications() {
  const { notifications, unreadCount, respondToNotification, markAsRead, isLoading } = useReceptionNotifications();
  const { toast } = useToast();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseValue, setResponseValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const pendingResponses = notifications.filter(n => n.requires_response && !n.response_value);

  const handleRespond = async (notificationId: string) => {
    if (!responseValue.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite sua resposta',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await respondToNotification({
        notificationId,
        responseValue: responseValue.trim(),
      });
      toast({
        title: 'Resposta enviada!',
        description: 'A recepção foi notificada.',
      });
      setRespondingTo(null);
      setResponseValue('');
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const respondingNotification = notifications.find(n => n.id === respondingTo);

  if (isLoading) {
    return null;
  }

  if (unreadNotifications.length === 0 && pendingResponses.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Avisos da Recepção
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-auto">
                {unreadCount} novo{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Pending responses first */}
          {pendingResponses.map((notification) => (
            <div
              key={notification.id}
              className="p-3 rounded-lg bg-warning/10 border border-warning/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {notification.message?.title || 'Aviso'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message?.content}
                    {notification.input_value && (
                      <span className="font-medium"> {notification.input_value}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => setRespondingTo(notification.id)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Responder
              </Button>
            </div>
          ))}

          {/* Unread notifications */}
          {unreadNotifications
            .filter(n => !n.requires_response || n.response_value)
            .map((notification) => (
              <div
                key={notification.id}
                className="p-3 rounded-lg bg-card border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {notification.message?.title || 'Aviso'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message?.content}
                      {notification.input_value && (
                        <span className="font-medium"> {notification.input_value}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(open) => !open && setRespondingTo(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Responder</DialogTitle>
            <DialogDescription>
              {respondingNotification?.message?.content}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={responseValue}
              onChange={(e) => setResponseValue(e.target.value)}
              placeholder={respondingNotification?.message?.input_field_label || 'Digite sua resposta'}
              className="min-h-[44px]"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRespondingTo(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={() => respondingTo && handleRespond(respondingTo)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
