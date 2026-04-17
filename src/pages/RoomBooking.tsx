import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, MapPin, Clock, CalendarCheck, Trash2, CalendarDays } from 'lucide-react';
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

// Mock estático para a aba "Minhas Reservas" (visual apenas)
const MOCK_BOOKINGS = [
  { id: 'm1', roomName: 'Sala de Reunião 1', floor: '12º Andar', date: '2026-04-20', startTime: '09:00', endTime: '10:00' },
  { id: 'm2', roomName: 'Sala Privativa 311', floor: '3º Andar', date: '2026-04-22', startTime: '14:30', endTime: '15:30' },
  { id: 'm3', roomName: 'Sala de Reunião 3', floor: '12º Andar', date: '2026-04-25', startTime: '11:00', endTime: '12:00' },
];

// Gera horários de 08:00 até 20:00 em intervalos de 30 minutos
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export default function RoomBooking() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <AppLayout title="Reservar Sala">
      <div className="px-4 py-4 space-y-3 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground">
          Escolha uma sala para visualizar disponibilidade
        </p>

        {ROOMS.map((room) => (
          <Card
            key={room.id}
            onClick={() => setSelectedRoom(room)}
            className="p-4 cursor-pointer transition-all active:scale-[0.98] hover:border-primary min-h-[80px]"
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
      </div>

      <Dialog open={!!selectedRoom} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto rounded-xl p-0 max-h-[90dvh] overflow-y-auto">
          <DialogHeader className="p-4 pb-2 text-left">
            <DialogTitle className="text-lg">{selectedRoom?.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {selectedRoom?.floor} • {selectedRoom?.capacity} pessoas
            </p>
          </DialogHeader>

          <div className="px-4 pb-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Selecione a data</p>
              <div className="rounded-lg border bg-card flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  locale={ptBR}
                  className={cn('p-2 pointer-events-auto')}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Horário de início
              </p>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.slice(0, -1).map((time) => (
                  <button
                    key={`start-${time}`}
                    onClick={() => {
                      setStartTime(time);
                      if (endTime && toMinutes(endTime) <= toMinutes(time)) {
                        setEndTime(null);
                      }
                    }}
                    className={cn(
                      'px-3 py-2 rounded-full text-sm font-medium min-h-[40px] min-w-[64px] transition-all active:scale-95 border',
                      startTime === time
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary',
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Horário de fim
              </p>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((time) => {
                  const disabled =
                    !startTime || toMinutes(time) <= toMinutes(startTime);
                  return (
                    <button
                      key={`end-${time}`}
                      onClick={() => !disabled && setEndTime(time)}
                      disabled={disabled}
                      className={cn(
                        'px-3 py-2 rounded-full text-sm font-medium min-h-[40px] min-w-[64px] transition-all active:scale-95 border',
                        endTime === time
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary',
                        disabled && 'opacity-40 cursor-not-allowed active:scale-100',
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Funcionamento: 08:00 às 20:00 (intervalos de 30 min)
              </p>
            </div>

            <Button
              onClick={handleConfirmClick}
              disabled={!selectedDate || !startTime || !endTime || isSubmitting}
              className="w-full min-h-[48px] text-base font-semibold"
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
