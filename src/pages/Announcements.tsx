import { AppLayout } from '@/components/AppLayout';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Announcements() {
  const { announcements, isLoading } = useAnnouncements();
  const activeAnnouncements = announcements.filter((a) => a.is_active);

  return (
    <AppLayout title="Avisos">
      <div className="p-4 space-y-4 max-w-lg mx-auto animate-fade-in">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activeAnnouncements.length > 0 ? (
          <div className="space-y-3">
            {activeAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="card-premium">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-warning/10 shrink-0">
                      <Bell className="h-4 w-4 text-warning" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{announcement.title}</p>
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
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
        ) : (
          <Card className="card-premium">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="font-medium mb-1">Nenhum aviso no momento</p>
              <p className="text-sm text-muted-foreground">
                Você será notificado quando houver avisos importantes
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
