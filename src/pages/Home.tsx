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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Clock,
  ChevronRight,
  AlertCircle,
  CalendarCheck,
  Wifi,
  Copy,
  Check,
  MapPin,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TICKET_STATUS_LABELS } from '@/types';
import { toast } from 'sonner';

const WIFI_NETWORK = 'Bold Workplace';
const WIFI_PASSWORD = 'bold@2024';

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
  const [wifiOpen, setWifiOpen] = useState(false);
  const [copied, setCopied] = useState<'net' | 'pass' | null>(null);

  const firstName = displayName ? displayName.split(' ')[0] : 'Usuário Bold';
  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const recentAnnouncements = announcements.filter((a) => a.is_active).slice(0, 3);

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

  const copy = async (value: string, kind: 'net' | 'pass') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success('Copiado');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <AppLayout>
      <div className="p-5 space-y-7 max-w-lg mx-auto animate-fade-in">
        {/* Saudação */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h2 className="text-2xl font-semibold tracking-tight">{firstName}</h2>
        </div>

        {/* Notificações da Recepção */}
        <ClientNotifications />

        {/* Próxima Reserva */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Sua Próxima Reserva
            </h3>
          </div>

          {nextBooking ? (
            <Link to="/reservas">
              <Card className="border-border/60 hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
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
          ) : (
            <Link to="/reservas">
              <Button variant="outline" className="w-full h-12 font-medium">
                <CalendarCheck className="h-4 w-4 mr-2" />
                Nova Reserva
              </Button>
            </Link>
          )}
        </section>

        {/* Acesso Rápido — Wi-Fi */}
        <section>
          <button
            type="button"
            onClick={() => setWifiOpen(true)}
            className="w-full text-left active:scale-[0.99] transition-transform"
          >
            <Card className="border-border/60">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                  <Wifi className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Wi-Fi do Edifício</p>
                  <p className="text-xs text-muted-foreground">Toque para ver rede e senha</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </button>
        </section>

        {/* Avisos */}
        {recentAnnouncements.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Avisos Recentes
              </h3>
              <Link to="/announcements" className="text-xs text-primary font-medium">
                Ver todos
              </Link>
            </div>
            <div className="space-y-2">
              {recentAnnouncements.map((a) => (
                <Card key={a.id} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        <AlertCircle className="h-4 w-4 text-foreground/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {a.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Meus Chamados */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Meus Chamados
            </h3>
            <Link to="/tickets" className="text-xs text-primary font-medium">
              Ver todos
            </Link>
          </div>

          {pendingTickets.length > 0 ? (
            <div className="space-y-2">
              {pendingTickets.slice(0, 3).map((ticket) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                  <Card className="border-border/60">
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
          ) : (
            <Link to="/tickets/new">
              <Button variant="outline" className="w-full h-12 font-medium">
                <MessageSquare className="h-4 w-4 mr-2" />
                Abrir Chamado
              </Button>
            </Link>
          )}
        </section>
      </div>

      {/* Wi-Fi Dialog */}
      <Dialog open={wifiOpen} onOpenChange={setWifiOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              Wi-Fi do Edifício
            </DialogTitle>
            <DialogDescription>
              Use a rede e senha abaixo para se conectar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Rede</p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="font-medium">{WIFI_NETWORK}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copy(WIFI_NETWORK, 'net')}
                  className="h-8 px-2"
                >
                  {copied === 'net' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Senha</p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="font-medium font-mono">{WIFI_PASSWORD}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copy(WIFI_PASSWORD, 'pass')}
                  className="h-8 px-2"
                >
                  {copied === 'pass' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
