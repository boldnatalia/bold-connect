import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReceptionNotifications } from '@/hooks/useReceptionNotifications';
import { Loader2, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReceptionHistory() {
  const { notifications, isLoading } = useReceptionNotifications();

  if (isLoading) {
    return (
      <AppLayout title="Histórico" showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <AppLayout title="Histórico" showBack>
      <div className="p-4 space-y-3">
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum aviso enviado ainda</p>
          </div>
        ) : (
          sortedNotifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {notification.recipient?.full_name || 'Cliente'}
                      </p>
                      {notification.requires_response && (
                        notification.response_value ? (
                          <Badge variant="default" className="text-xs bg-success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Respondido
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Aguardando
                          </Badge>
                        )
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message?.title || 'Aviso personalizado'}
                    </p>
                    {notification.input_value && (
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">Info: </span>
                        {notification.input_value}
                      </p>
                    )}
                    {notification.response_value && (
                      <p className="text-sm mt-1 text-success">
                        <span className="text-muted-foreground">Resposta: </span>
                        {notification.response_value}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {notification.is_read ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
}
