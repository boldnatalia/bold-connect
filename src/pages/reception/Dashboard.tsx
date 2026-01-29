import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, Send, Users, Megaphone, History, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReceptionNotifications } from '@/hooks/useReceptionNotifications';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReceptionDashboard() {
  const { notifications, pendingResponses, isLoading } = useReceptionNotifications();
  const { announcements } = useAnnouncements();

  const todayNotifications = notifications.filter(n => {
    const today = new Date().toDateString();
    return new Date(n.created_at).toDateString() === today;
  });

  const activeAnnouncements = announcements.filter(a => a.is_active);

  return (
    <AppLayout title="Portaria">
      <div className="p-4 space-y-6">
        {/* Quick Actions - Two main features */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Avisos</h3>
          
          {/* Individual Notification */}
          <Link to="/recepcao/enviar">
            <Card className="card-premium hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Avisar Cliente</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar aviso individual com mensagens prontas
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Mass Announcement */}
          <Link to="/recepcao/aviso-geral">
            <Card className="card-premium hover:border-warning/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-warning/10">
                    <Megaphone className="h-6 w-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Aviso Geral</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar aviso para todos os clientes
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Send className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayNotifications.length}</p>
                  <p className="text-xs text-muted-foreground">Enviados hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <MessageSquare className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingResponses.length}</p>
                  <p className="text-xs text-muted-foreground">Aguardando resposta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Responses */}
        {pendingResponses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-warning" />
                Aguardando Respostas
              </h3>
            </div>
            <div className="space-y-2">
              {pendingResponses.slice(0, 5).map((notification) => (
                <Card key={notification.id} className="border-warning/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {notification.recipient?.full_name || 'Cliente'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message?.title || 'Aviso'}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Announcements */}
        {activeAnnouncements.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Avisos Gerais Ativos
            </h3>
            <div className="space-y-2">
              {activeAnnouncements.slice(0, 3).map((announcement) => (
                <Card key={announcement.id}>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {announcement.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* History Link */}
        <Link to="/recepcao/historico">
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Histórico de Avisos</p>
                  <p className="text-xs text-muted-foreground">
                    Ver todos os avisos enviados
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </AppLayout>
  );
}
