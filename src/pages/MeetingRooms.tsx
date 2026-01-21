import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMeetingRooms } from '@/hooks/useMeetingRooms';
import { DoorOpen, Users, Loader2 } from 'lucide-react';

export default function MeetingRooms() {
  const { rooms, isLoading } = useMeetingRooms();

  // Group rooms by floor
  const roomsByFloor = rooms.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<string, typeof rooms>);

  return (
    <AppLayout title="Salas de Reunião">
      <div className="p-4 space-y-4 max-w-lg mx-auto animate-fade-in">
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <DoorOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Salas de Reunião</p>
                <p className="text-sm text-muted-foreground">
                  Espaços disponíveis para reuniões
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma sala disponível no momento.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(roomsByFloor).map(([floor, floorRooms]) => (
              <div key={floor} className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {floor}
                </h3>
                <div className="space-y-2">
                  {floorRooms.map((room) => (
                    <Card key={room.id} className="card-premium">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <DoorOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{room.name}</p>
                              {room.description && (
                                <p className="text-xs text-muted-foreground">
                                  {room.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {room.capacity && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {room.capacity}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-4">
          Para reservar uma sala, entre em contato com a recepção.
        </p>
      </div>
    </AppLayout>
  );
}
