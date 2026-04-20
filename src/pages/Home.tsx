import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { ClientNotifications } from '@/components/ClientNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Clock,
  ChevronRight,
  CalendarCheck,
  MapPin,
  Megaphone,
  Building2,
  BookOpen,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TICKET_STATUS_LABELS } from '@/types';

interface NextBooking {
  id: string;
  roomName: string;
  floor: string;
  date: string;
  startTime: string;
  endTime: string;
}

const roomNames: Record<number, string> = {
  2106: 'Sala de Reunião 1',
  2108: 'Sala de Reunião 2',
  2109: 'Sala de Reunião 3',
  2226: 'Sala de Reunião 6',
  2213: 'Sala Privativa 311',
};
const roomFloors: Record<number, string> = {
  2106: '12º Andar',
  2108: '12º Andar',
  2109: '12º Andar',
  2226: '3º Andar',
  2213: '3º Andar',
};

const extractTime = (val?: string) => {
  if (!val) return '';
  const m = val.match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
};
const extractDate = (val?: string) => {
  if (!val) return '';
  const m = val.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
};

export default function Home() {
  const { displayName } = useAuth();
  const { tickets } = useTickets();
  const { announcements } = useAnnouncements();
  const [nextBooking, setNextBooking] = useState<NextBooking | null>(null);

  const firstName = displayName ? displayName.split(' ')[0] : 'Usuário Bold';
  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const activeAnnouncements = announcements.filter((a) => a.is_active);
  const latestAnnouncement = activeAnnouncements[0];

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.functions.invoke('conexa-get-bookings');
        const list = Array.isArray(data?.bookings) ? data.bookings : [];
        const now = new Date();
        const parsed = list
          .map((b: Record<string, unknown>, i: number) => {
            const place = (b.place ?? b.room) as { id?: number; name?: string } | undefined;
            const roomId = Number(b.roomId ?? b.roomsId ?? b.room_id ?? place?.id ?? 0);
            const startRaw = String(
              b.startTime ?? b.bookingDateTime ?? b.bookingDateTimeFrom ?? b.startDateTime ?? b.dateTimeFrom ?? '',
            );
            const endRaw = String(
              b.finalTime ?? b.endTime ?? b.bookingFinalDateTime ?? b.bookingDateTimeTo ?? b.endDateTime ?? b.dateTimeTo ?? '',
            );
            const dateRaw = String(b.date ?? b.bookingDate ?? '') || startRaw;
            return {
              id: String(b.bookingId ?? b.id ?? `b-${i}`),
              roomName: roomNames[roomId] || place?.name || `Sala ${roomId}`,
              floor: roomFloors[roomId] || '',
              date: extractDate(dateRaw),
              startTime: extractTime(startRaw),
              endTime: extractTime(endRaw),
            } as NextBooking;
          })
          .filter((b: NextBooking) => {
            if (!b.date || !b.startTime) return false;
            const dt = new Date(`${b.date}T${b.startTime}:00`);
            return dt.getTime() >= now.getTime() - 30 * 60 * 1000;
          })
          .sort((a: NextBooking, b: NextBooking) => {
            const da = new Date(`${a.date}T${a.startTime}:00`).getTime();
            const db = new Date(`${b.date}T${b.startTime}:00`).getTime();
            return da - db;
          });
        setNextBooking(parsed[0] ?? null);
      } catch {
        setNextBooking(null);
      }
    };
    load();
  }, []);

  return (
    <AppLayout>
      <div className="bg-[#F8F9FA] min-h-full -mb-20 pb-20">
      <div className="p-5 space-y-6 max-w-lg mx-auto animate-fade-in">
        {/* Saudação */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h2 className="text-2xl font-semibold tracking-tight">{firstName}</h2>
        </div>

        {/* Notificações da Recepção */}
        <ClientNotifications />

        {/* Próxima Reserva — só aparece se houver */}
        {nextBooking && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Sua Próxima Reserva
            </h3>
            <Link to="/reserva-salas">
              <Card className="bg-white border-border/60 hover:border-primary/40 transition-colors rounded-2xl shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                      <CalendarCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium text-base">{nextBooking.roomName}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {nextBooking.floor}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {nextBooking.date
                          ? format(parseISO(nextBooking.date), "dd 'de' MMM", { locale: ptBR })
                          : ''}{' '}
                        • {nextBooking.startTime} – {nextBooking.endTime}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </section>
        )}

        {/* Acesso Rápido — Grid de 3 */}
        <section>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/tickets/new">
              <Card className="bg-white border-border/60 rounded-2xl shadow-sm active:scale-95 transition-transform">
                <CardContent className="p-3 flex flex-col items-center justify-center gap-2 h-24">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-center leading-tight">Abrir Chamado</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/announcements">
              <Card className="bg-white border-border/60 rounded-2xl shadow-sm active:scale-95 transition-transform">
                <CardContent className="p-3 flex flex-col items-center justify-center gap-2 h-24">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Megaphone className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-center leading-tight">Ver Avisos</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/floors">
              <Card className="bg-white border-border/60 rounded-2xl shadow-sm active:scale-95 transition-transform">
                <CardContent className="p-3 flex flex-col items-center justify-center gap-2 h-24">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-center leading-tight">Andares</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Avisos Recentes — slim */}
        {latestAnnouncement && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Avisos Recentes
              </h3>
              <Link to="/announcements" className="text-xs text-primary font-medium">
                Ver tudo
              </Link>
            </div>
            <Link to="/announcements">
              <Card className="bg-white border-border/60 rounded-2xl shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted shrink-0">
                    <Megaphone className="h-4 w-4 text-foreground/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{latestAnnouncement.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(latestAnnouncement.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          </section>
        )}

        {/* Meus Chamados — apenas 2 */}
        {pendingTickets.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Meus Chamados
              </h3>
              <Link to="/tickets" className="text-xs text-primary font-medium">
                Ver tudo
              </Link>
            </div>
            <div className="space-y-2">
              {pendingTickets.slice(0, 2).map((ticket) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                  <Card className="bg-white border-border/60 rounded-2xl shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Pendente há{' '}
                            {formatDistanceToNow(new Date(ticket.created_at), { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
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
          </section>
        )}

        {/* Manual do Usuário — rodapé de utilidade */}
        <section className="pt-2">
          <Link to="/manual">
            <Card className="bg-white border-border/60 rounded-2xl shadow-sm active:scale-[0.99] transition-transform">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Manual do Usuário</p>
                  <p className="text-xs text-muted-foreground">Wi-Fi, acessos e serviços do edifício</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </section>
      </div>
      </div>
    </AppLayout>
  );
}
