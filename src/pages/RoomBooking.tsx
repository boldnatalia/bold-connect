import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Users, MapPin, Clock, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: string;
  description: string;
}

const MOCK_ROOMS: Room[] = [
  { id: '1', name: 'Sala de Reunião A', capacity: 4, floor: '3º Andar', description: 'TV 50", quadro branco' },
  { id: '2', name: 'Sala de Reunião B', capacity: 8, floor: '5º Andar', description: 'Videoconferência, projetor' },
  { id: '3', name: 'Sala Executiva', capacity: 6, floor: '7º Andar', description: 'Ambiente premium, café incluso' },
  { id: '4', name: 'Sala Criativa', capacity: 10, floor: '9º Andar', description: 'Lousa colaborativa, sofás' },
  { id: '5', name: 'Auditório', capacity: 20, floor: '12º Andar', description: 'Sistema de som, palco' },
];

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

export default function RoomBooking() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Selecione data e horário');
      return;
    }
    toast.success(
      `Reserva confirmada: ${selectedRoom?.name} em ${format(selectedDate, "dd/MM/yyyy")} às ${selectedTime}`
    );
    setSelectedRoom(null);
    setSelectedTime(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedRoom(null);
      setSelectedTime(null);
    }
  };

  return (
    <AppLayout title="Reservar Sala">
      <div className="px-4 py-4 space-y-3 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground">
          Escolha uma sala para visualizar disponibilidade
        </p>

        {MOCK_ROOMS.map((room) => (
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
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {room.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {room.capacity} lugares
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
              {selectedRoom?.floor} • {selectedRoom?.capacity} lugares
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
                  className={cn("p-2 pointer-events-auto")}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Horários disponíveis
              </p>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium min-h-[40px] min-w-[72px] transition-all active:scale-95 border',
                      selectedTime === time
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime}
              className="w-full min-h-[48px] text-base font-semibold"
              size="lg"
            >
              Confirmar Reserva
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
