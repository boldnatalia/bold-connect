import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import floor3Corridor from '@/assets/floor-3-corridor.jpg';
import floor3Corridor2 from '@/assets/floor-3-corridor-2.jpg';

const FLOOR_GALLERIES: Record<string, { title: string; images: { src: string; alt: string }[] }> = {
  '3': {
    title: '3º Andar',
    images: [
      { src: floor3Corridor, alt: 'Corredor com divisórias de vidro e área de recepção do 3º andar' },
      { src: floor3Corridor2, alt: 'Corredor do 3º andar com salas privativas e área de espera' },
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
      <div className="max-w-lg mx-auto p-4 animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/floors')}
          className="mb-3 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Andares
        </Button>

        <Carousel className="w-full">
          <CarouselContent>
            {gallery.images.map((img, idx) => (
              <CarouselItem key={idx}>
                <div className="overflow-hidden rounded-xl border bg-card">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-auto object-cover"
                  />
                  <p className="text-xs text-muted-foreground p-3">{img.alt}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {gallery.images.length > 1 && (
            <>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </>
          )}
        </Carousel>

        <p className="text-xs text-center text-muted-foreground mt-4">
          {gallery.images.length} {gallery.images.length === 1 ? 'foto' : 'fotos'} · deslize para navegar
        </p>
      </div>
    </AppLayout>
  );
}
