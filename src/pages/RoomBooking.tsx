import { AppLayout } from '@/components/AppLayout';

export default function RoomBooking() {
  return (
    <AppLayout title="Reserva de Salas">
      <div className="flex flex-col flex-1 w-full" style={{ height: 'calc(100dvh - 56px - 56px)' }}>
        <div className="flex-1 w-full overflow-hidden">
          <iframe
            src="https://bold.conexa.app/index.php?r=booking/default/search"
            title="Reserva de Salas - Conexa"
            className="w-full h-full border-none"
            allow="geolocation; microphone; camera"
          />
        </div>
      </div>
    </AppLayout>
  );
}
