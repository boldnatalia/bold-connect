import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, MapPin, Clock, CalendarCheck, Trash2, CalendarDays, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Room {
  id: number;
  name: string;
  capacity: number;
  floor: string;
}

const ROOMS: Room[] = [
  { id: 2106, name: 'Sala de Reunião 1', capacity: 12, floor: '12º Andar' },
  { id: 2108, name: 'Sala de Reunião 2', capacity: 4, floor: '12º Andar' },
  { id: 2109, name: 'Sala de Reunião 3', capacity: 6, floor: '12º Andar' },
  { id: 2226, name: 'Sala de Reunião 6', capacity: 4, floor: '3º Andar' },
  { id: 2213, name: 'Sala Privativa 311', capacity: 4, floor: '3º Andar' },
];

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

type ConexaBooking = Record<string, unknown>;

interface ParsedBooking {
  id: string;
  roomId: number;
  roomName: string;
  floor: string;
  date: string;
  startTime: string;
  endTime: string;
}

const pick = (obj: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
    if (typeof v === 'number') return String(v);
  }
  return '';
};

const pickNumber = (obj: Record<string, unknown>, keys: string[]): number => {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v && !isNaN(Number(v))) return Number(v);
  }
  return 0;
};

const extractTime = (val?: string): string => {
  if (!val) return '';
  const match = val.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : '';
};

const extractDate = (val?: string): string => {
  if (!val) return '';
  const match = val.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
};

const parseBooking = (b: ConexaBooking, idx: number): ParsedBooking => {
  const place = (b.place ?? b.room) as { id?: number; name?: string } | undefined;
  let roomId = pickNumber(b, ['roomId', 'roomsId', 'room_id']);
  if (!roomId && place?.id) roomId = Number(place.id);

  const startRaw = pick(b, [
    'startTime', 'bookingDateTime', 'bookingDateTimeFrom', 'startDateTime', 'dateTimeFrom',
  ]);
  const endRaw = pick(b, [
    'finalTime', 'endTime', 'bookingFinalDateTime', 'bookingDateTimeTo', 'endDateTime', 'dateTimeTo',
  ]);
  const dateRaw = pick(b, ['date', 'bookingDate']) || startRaw;

  const id = pick(b, ['bookingId', 'id', 'roomBookingId']) || `b-${idx}`;
  const fallbackName = place?.name || `Sala ${roomId || '—'}`;

  return {
    id,
    roomId,
    roomName: roomNames[roomId] || fallbackName,
    floor: roomFloors[roomId] || '',
    date: extractDate(dateRaw),
    startTime: extractTime(startRaw),
    endTime: extractTime(endRaw),
  };
};

// Slots de início (08:00 ao 19:30) — cada slot representa 30min até o próximo.
const generateStartSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 8; h <= 19; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
};

const SLOTS = generateStartSlots(); // ['08:00','08:30',...,'19:30']

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const addMinutes = (t: string, mins: number) => {
  const total = toMinutes(t) + mins;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
};

export default function RoomBooking() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookings, setBookings] = useState<ParsedBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const { data, error } = await supabase.functions.invoke('conexa-get-bookings');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const list = Array.isArray(data?.bookings) ? data.bookings : [];
      setBookings(list.map((b: ConexaBooking, i: number) => parseBooking(b, i)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar reservas';
      setBookingsError(msg);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      const { data, error } = await supabase.functions.invoke('conexa-cancel-booking', {
        body: { bookingId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data?.message || 'Reserva cancelada com sucesso!');
      await fetchBookings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao cancelar reserva';
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const resetSelection = () => {
    setSelectedRoom(null);
    setStartTime(null);
    setEndTime(null);
  };

  const handleConfirmReservation = async (
    roomId: number,
    date: Date,
    start: string,
    end: string,
  ) => {
    setIsSubmitting(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase.functions.invoke('conexa-booking', {
        body: { roomId, date: dateStr, startTime: start, endTime: end },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || 'Reserva confirmada!');
      resetSelection();
      fetchBookings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar reserva';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmClick = () => {
    if (!selectedRoom || !selectedDate || !startTime || !endTime) {
      toast.error('Selecione data, horário de início e fim');
      return;
    }
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      toast.error('O horário de fim deve ser maior que o de início');
      return;
    }
    handleConfirmReservation(selectedRoom.id, selectedDate, startTime, endTime);
  };

  const handleClose = (open: boolean) => {
    if (!open && !isSubmitting) resetSelection();
  };

  // Conjunto de slots ocupados (intervalos de 30min) para a sala+data selecionadas.
  // Usa as reservas conhecidas do próprio usuário no Conexa.
  const occupiedSlots = useMemo(() => {
    const set = new Set<string>();
    if (!selectedRoom || !selectedDate) return set;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    for (const b of bookings) {
      if (b.roomId !== selectedRoom.id) continue;
      if (b.date !== dateStr) continue;
      if (!b.startTime || !b.endTime) continue;
      const start = toMinutes(b.startTime);
      const end = toMinutes(b.endTime);
      for (const s of SLOTS) {
        const m = toMinutes(s);
        if (m >= start && m < end) set.add(s);
      }
    }
    return set;
  }, [bookings, selectedRoom, selectedDate]);

  const handleSlotClick = (slot: string) => {
    if (occupiedSlots.has(slot)) return;

    // Sem início definido → define início
    if (!startTime) {
      setStartTime(slot);
      setEndTime(null);
      return;
    }

    // Início já definido, sem fim → define fim (precisa ser depois do início)
    if (startTime && !endTime) {
      const startMin = toMinutes(startTime);
      const slotMin = toMinutes(slot);
      if (slot === startTime) {
        // clicou no mesmo: reseta
        setStartTime(null);
        return;
      }
      if (slotMin < startMin) {
        // clicou antes do início → vira novo início
        setStartTime(slot);
        return;
      }
      // valida que não há slot ocupado no meio
      for (const s of SLOTS) {
        const m = toMinutes(s);
        if (m >= startMin && m <= slotMin && occupiedSlots.has(s)) {
          toast.error('Há um horário ocupado dentro do intervalo selecionado');
          return;
        }
      }
      // o "fim" como horário final = slot + 30min
      setEndTime(addMinutes(slot, 30));
      return;
    }

    // Já tem início e fim → reinicia
    setStartTime(slot);
    setEndTime(null);
  };

  const isSlotInRange = (slot: string) => {
    if (!startTime) return false;
    const startMin = toMinutes(startTime);
    const endMin = endTime ? toMinutes(endTime) : startMin + 30;
    const m = toMinutes(slot);
    return m >= startMin && m < endMin;
  };

  const summaryDuration = startTime && endTime ? toMinutes(endTime) - toMinutes(startTime) : 0;

  return (
    <AppLayout title="Reservar Sala">
      <div className="px-4 py-4 max-w-lg mx-auto">
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="new" className="min-h-[40px]">Nova Reserva</TabsTrigger>
            <TabsTrigger value="mine" className="min-h-[40px]">Minhas Reservas</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-3 mt-0">
            <p className="text-sm text-muted-foreground">
              Escolha uma sala para visualizar disponibilidade
            </p>

            {ROOMS.map((room) => (
              <Card
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className="p-4 cursor-pointer transition-all active:scale-[0.98] hover:border-primary min-h-[80px] rounded-2xl border-border/60 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-foreground truncate">
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {room.capacity} pessoas
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {room.floor}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="mine" className="space-y-3 mt-0">
            {bookingsLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 min-h-[80px] rounded-2xl">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-1/3 mb-3" />
                    <Skeleton className="h-3 w-1/2" />
                  </Card>
                ))}
              </>
            ) : bookingsError ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm mb-3">{bookingsError}</p>
                <Button variant="outline" size="sm" onClick={fetchBookings} className="min-h-[40px]">
                  Tentar novamente
                </Button>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Você ainda não tem reservas</p>
              </div>
            ) : (
              bookings.map((b) => {
                const dateLabel = b.date
                  ? format(new Date(`${b.date}T00:00:00`), "dd 'de' MMMM", { locale: ptBR })
                  : 'Data indisponível';
                const timeLabel = b.startTime && b.endTime
                  ? `${b.startTime} - ${b.endTime}`
                  : b.startTime || b.endTime || 'Horário indisponível';
                return (
                  <Card key={b.id} className="p-4 min-h-[80px] rounded-2xl border-border/60 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-foreground truncate">
                          {b.roomName}
                        </h3>
                        {b.floor && (
                          <p className="text-xs text-muted-foreground mt-0.5">{b.floor}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {dateLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timeLabel}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CalendarCheck className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancellingId === b.id}
                      className="w-full mt-3 min-h-[40px] text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleCancel(b.id)}
                    >
                      {cancellingId === b.id ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelando...</>
                      ) : (
                        <><Trash2 className="h-4 w-4 mr-2" /> Cancelar Reserva</>
                      )}
                    </Button>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedRoom} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto rounded-2xl p-0 max-h-[92dvh] overflow-hidden flex flex-col gap-0">
          {/* Header compacto */}
          <DialogHeader className="px-5 pt-5 pb-3 text-left border-b border-border/40">
            <DialogTitle className="text-base font-semibold">{selectedRoom?.name}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedRoom?.floor} • {selectedRoom?.capacity} pessoas • Funciona 08h–20h
            </p>
          </DialogHeader>

          {/* Conteúdo rolável */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Step 1 — Data */}
            <section>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                1. Data
              </p>
              <div className="rounded-2xl border border-border/60 bg-card flex justify-center shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setStartTime(null); setEndTime(null); }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  locale={ptBR}
                  className={cn('p-2 pointer-events-auto')}
                />
              </div>
            </section>

            {/* Step 2 — Timeline */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  2. Horário
                </p>
                {(startTime || endTime) && (
                  <button
                    onClick={() => { setStartTime(null); setEndTime(null); }}
                    className="text-xs text-primary font-medium active:scale-95 transition-transform"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                {!startTime
                  ? 'Toque em um horário livre para iniciar'
                  : !endTime
                    ? 'Agora toque no horário final'
                    : 'Intervalo selecionado'}
              </p>

              <div className="space-y-1.5">
                {SLOTS.map((slot) => {
                  const occupied = occupiedSlots.has(slot);
                  const inRange = isSlotInRange(slot);
                  const isStart = startTime === slot;
                  const isEndSlot = endTime ? slot === addMinutes(endTime, -30) : false;
                  const next = addMinutes(slot, 30);

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={occupied}
                      onClick={() => handleSlotClick(slot)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all border min-h-[48px]',
                        'active:scale-[0.99]',
                        occupied
                          ? 'bg-muted/40 border-transparent text-muted-foreground/70 cursor-not-allowed'
                          : inRange
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-card border-border/60 text-foreground shadow-sm hover:border-primary/60',
                      )}
                    >
                      <span className={cn('font-medium tabular-nums', inRange && 'font-semibold')}>
                        {slot} <span className="opacity-60">– {next}</span>
                      </span>
                      <span className={cn('text-xs flex items-center gap-1', inRange && 'opacity-90')}>
                        {occupied ? (
                          'Ocupado'
                        ) : isStart ? (
                          <><Check className="h-3.5 w-3.5" /> Início</>
                        ) : isEndSlot && endTime ? (
                          <><Check className="h-3.5 w-3.5" /> Fim</>
                        ) : inRange ? (
                          ''
                        ) : (
                          'Livre'
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Footer fixo: resumo + CTA */}
          <div className="border-t border-border/40 px-5 pt-3 pb-4 bg-card/80 backdrop-blur-sm">
            <div className="mb-3 min-h-[40px] flex flex-col justify-center">
              {startTime && endTime && selectedDate ? (
                <>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Reserva para
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {format(selectedDate, "dd/MM", { locale: ptBR })} • {startTime} às {endTime}
                    <span className="text-muted-foreground font-normal"> ({formatDuration(summaryDuration)})</span>
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Selecione data e horário para confirmar
                </p>
              )}
            </div>
            <Button
              onClick={handleConfirmClick}
              disabled={!selectedDate || !startTime || !endTime || isSubmitting}
              className="w-full min-h-[48px] text-base font-semibold rounded-2xl"
              size="lg"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                'Confirmar Reserva'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
