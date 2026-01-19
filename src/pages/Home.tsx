import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Bell, 
  Building2, 
  UtensilsCrossed, 
  BookOpen,
  Plus,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TICKET_STATUS_LABELS } from '@/types';

export default function Home() {
  const { profile } = useAuth();
  const { tickets } = useTickets();
  const { announcements } = useAnnouncements();

  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const recentAnnouncements = announcements.filter((a) => a.is_active).slice(0, 3);

  const quickActions = [
    { icon: MessageSquare, label: 'Abrir Chamado', href: '/tickets/new', color: 'bg-info/10 text-info' },
    { icon: Bell, label: 'Ver Avisos', href: '/announcements', color: 'bg-warning/10 text-warning' },
    { icon: Building2, label: 'Andares', href: '/floors', color: 'bg-primary/10 text-primary' },
    { icon: UtensilsCrossed, label: 'Cardápio', href: '/menu', color: 'bg-success/10 text-success' },
  ];

  return (
    <AppLayout>
      <div className="p-4 space-y-6 max-w-lg mx-auto animate-fade-in">
        {/* Welcome Section */}
        <div className="space-y-1">
          <p className="text-muted-foreground">Olá,</p>
          <h2 className="text-2xl font-bold">{profile?.full_name?.split(' ')[0]}</h2>
          <p className="text-sm text-muted-foreground">
            {profile?.company} • Sala {profile?.room}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                to={action.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:shadow-md transition-shadow"
              >
                <div className={`p-2.5 rounded-lg ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Recent Announcements */}
        {recentAnnouncements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Avisos Recentes</h3>
              <Link to="/announcements" className="text-sm text-primary font-medium">
                Ver todos
              </Link>
            </div>
            <div className="space-y-2">
              {recentAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="card-premium">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-warning/10 shrink-0">
                        <AlertCircle className="h-4 w-4 text-warning" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{announcement.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(announcement.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My Tickets Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Meus Chamados</h3>
            <Link to="/tickets" className="text-sm text-primary font-medium">
              Ver todos
            </Link>
          </div>

          {pendingTickets.length > 0 ? (
            <div className="space-y-2">
              {pendingTickets.slice(0, 3).map((ticket) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                  <Card className="card-premium hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Pendente há{' '}
                            {formatDistanceToNow(new Date(ticket.created_at), {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="status-pending text-xs">
                            {TICKET_STATUS_LABELS[ticket.status]}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="card-premium">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  Nenhum chamado pendente
                </p>
                <Link to="/tickets/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Abrir Chamado
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Manual Quick Access */}
        <Link to="/manual">
          <Card className="card-premium hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Manual do Usuário</p>
                  <p className="text-xs text-muted-foreground">
                    Regras, procedimentos e informações úteis
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
