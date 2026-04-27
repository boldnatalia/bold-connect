import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Bell, MessageSquare, Send, History, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReceptionNotifications } from '@/hooks/useReceptionNotifications';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReceptionDashboard() {
  const { notifications, pendingResponses } = useReceptionNotifications();
  const { announcements } = useAnnouncements();
  const [openAnnouncement, setOpenAnnouncement] = useState<{ title: string; content: string } | null>(null);

  const todayNotifications = notifications.filter(n => {
    const today = new Date().toDateString();
    return new Date(n.created_at).toDateString() === today;
  });

  const activeAnnouncements = announcements.filter(a => a.is_active);

  return (
    <AppLayout title="Portaria">
      <div className="p-4 space-y-5">
        {/* Primary action */}
        <Link to="/recepcao/enviar" className="block">
          <Card className="card-premium hover:border-primary/50 transition-colors active:scale-[0.99]">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">Nova Notificação</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enviar aviso individual ao cliente
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Send className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none">{todayNotifications.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Enviados hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none">{pendingResponses.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Aguardando</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending responses */}
        {pendingResponses.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-warning" />
              Aguardando Respostas
            </h3>
            <div className="space-y-2">
              {pendingResponses.slice(0, 5).map((notification) => (
                <Card key={notification.id} className="rounded-2xl border-warning/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {notification.recipient?.full_name || 'Cliente'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message?.title || 'Aviso'}
                        </p>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
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

        {/* Active announcements — single line, modal for details */}
        {activeAnnouncements.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Avisos Gerais Ativos
            </h3>
            <div className="space-y-2">
              {activeAnnouncements.slice(0, 3).map((announcement) => (
                <button
                  key={announcement.id}
                  onClick={() => setOpenAnnouncement({ title: announcement.title, content: announcement.content })}
                  className="w-full text-left active:scale-[0.99] transition-transform"
                >
                  <Card className="rounded-2xl">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <p className="font-medium text-sm truncate flex-1">{announcement.title}</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History link */}
        <Link to="/recepcao/historico" className="block">
          <Card className="card-premium active:scale-[0.99] transition-transform">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <History className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">Histórico de Avisos</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ver todos os avisos enviados
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Announcement details modal */}
      <Dialog open={!!openAnnouncement} onOpenChange={(o) => !o && setOpenAnnouncement(null)}>
        <DialogContent className="rounded-2xl max-w-[92vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <Bell className="h-4 w-4 text-primary" />
              {openAnnouncement?.title}
            </DialogTitle>
            <DialogDescription className="text-left whitespace-pre-wrap pt-2 text-foreground/80">
              {openAnnouncement?.content}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
