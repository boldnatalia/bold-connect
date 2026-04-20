import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import floor3Corridor from '@/assets/floor-3-corridor.jpg';
import floor3Corridor2 from '@/assets/floor-3-corridor-2.jpg';

const FLOOR_GALLERIES: Record<string, { title: string; images: { src: string; alt: string }[] }> = {
  '3': {
    title: '3º Andar',
    images: [
      { src: floor3Corridor, alt: 'Corredor com divisórias de vidro do 3º andar' },
      { src: floor3Corridor2, alt: 'Corredor do 3º andar com salas privativas' },
    ],
  },
};

export default function FloorGallery() {
  const { floorNumber } = useParams();
  const navigate = useNavigate();
  const gallery = floorNumber ? FLOOR_GALLERIES[floorNumber] : undefined;

  if (!gallery) {
    return (
      <AppLayout title="Galeria" showBack>
        <div className="p-6 text-center text-muted-foreground">
          Galeria indisponível para este andar.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Galeria · ${gallery.title}`} showBack>
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="px-4 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/floors')}
            className="-ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Andares
          </Button>
        </div>

        <div className="flex flex-col gap-3 p-3">
          {gallery.images.map((img, idx) => (
            <div key={idx} className="overflow-hidden rounded-xl border bg-card">
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-auto object-cover"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
