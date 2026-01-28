import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, Send, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReceptionNotifications } from '@/hooks/useReceptionNotifications';

export default function ReceptionDashboard() {
  const { notifications, pendingResponses } = useReceptionNotifications();

  const todayNotifications = notifications.filter(n => {
    const today = new Date().toDateString();
    return new Date(n.created_at).toDateString() === today;
  });

  const stats = [
    {
      title: 'Avisos Enviados Hoje',
      value: todayNotifications.length,
      icon: Send,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Aguardando Resposta',
      value: pendingResponses.length,
      icon: MessageSquare,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <AppLayout title="Recepção">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/recepcao/enviar">
            <Button className="w-full h-20 flex flex-col gap-2" size="lg">
              <Bell className="h-6 w-6" />
              <span className="text-sm">Enviar Aviso</span>
            </Button>
          </Link>
          <Link to="/recepcao/historico">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" size="lg">
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Histórico</span>
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pending Responses */}
        {pendingResponses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-warning" />
                Aguardando Respostas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingResponses.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id} 
                  className="p-3 bg-warning/10 rounded-lg border border-warning/20"
                >
                  <p className="text-sm font-medium">
                    {notification.recipient?.full_name || 'Cliente'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.message?.title || notification.custom_content}
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
