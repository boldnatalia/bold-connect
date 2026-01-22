import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTickets } from '@/hooks/useTickets';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useMenu } from '@/hooks/useMenu';
import { MessageSquare, Bell, UtensilsCrossed, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { tickets } = useTickets();
  const { announcements } = useAnnouncements();
  const { menuItems } = useMenu();

  const pendingTickets = tickets.filter(t => t.status === 'pending').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const activeAnnouncements = announcements.filter(a => a.is_active).length;
  const availableMenuItems = menuItems.filter(m => m.is_available).length;

  const stats = [
    {
      title: 'Chamados Pendentes',
      value: pendingTickets,
      icon: AlertCircle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      link: '/admin/tickets?status=pending'
    },
    {
      title: 'Em Andamento',
      value: inProgressTickets,
      icon: Clock,
      color: 'text-info',
      bgColor: 'bg-info/10',
      link: '/admin/tickets?status=in_progress'
    },
    {
      title: 'Resolvidos',
      value: resolvedTickets,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      link: '/admin/tickets?status=resolved'
    },
    {
      title: 'Total de Chamados',
      value: tickets.length,
      icon: MessageSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/admin/tickets'
    },
    {
      title: 'Avisos Ativos',
      value: activeAnnouncements,
      icon: Bell,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      link: '/admin/announcements'
    },
    {
      title: 'Itens no Cardápio',
      value: availableMenuItems,
      icon: UtensilsCrossed,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      link: '/admin/menu'
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.link}>
                <Card className="card-premium cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent pending tickets */}
        {pendingTickets > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Chamados Pendentes Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tickets
                  .filter(t => t.status === 'pending')
                  .slice(0, 5)
                  .map((ticket) => (
                    <Link 
                      key={ticket.id} 
                      to={`/admin/tickets`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 transition-all duration-200 active:scale-[0.98] active:bg-muted"
                    >
                      <div>
                        <p className="font-medium text-sm">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                      </div>
                      <AlertCircle className="h-4 w-4 text-warning" />
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
