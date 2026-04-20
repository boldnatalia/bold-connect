import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useFloors } from '@/hooks/useFloors';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Loader2, Star, AlertTriangle, Images } from 'lucide-react';
import boldFacade from '@/assets/bold-facade.jpg';

// Tags que recebem destaque dourado da marca Bold
const HIGHLIGHT_TAGS = new Set(['Em Obras', 'Premium']);

// Andares que possuem galeria dedicada
const FLOORS_WITH_GALLERY = new Set([3]);

export default function Floors() {
  const { floors, isLoading } = useFloors();
  const navigate = useNavigate();

  return (
    <AppLayout title="Andares">
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* Hero com fachada */}
        <div className="relative w-full h-[220px] overflow-hidden">
          <img
            src={boldFacade}
            alt="Fachada do Edifício Bold Workplace"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Overlay preto suave para legibilidade do título */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">
              Edifício Bold
            </h1>
            <p className="text-sm text-white/90 drop-shadow mt-0.5">
              Conheça nossos pavimentos
            </p>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {floors.map((floor) => {
                const hasGallery = FLOORS_WITH_GALLERY.has(floor.floor_number);
                return (
                  <Card
                    key={floor.id}
                    onClick={hasGallery ? () => navigate(`/floors/${floor.floor_number}/galeria`) : undefined}
                    className={`card-premium relative ${!floor.is_available ? 'opacity-60' : ''} ${
                      hasGallery ? 'cursor-pointer transition-transform active:scale-[0.98]' : ''
                    }`}
                  >
                    {hasGallery && (
                      <div className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/70 text-muted-foreground">
                        <Images className="h-4 w-4" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg shrink-0 ${
                            floor.is_premium
                              ? 'bg-accent/10'
                              : floor.is_available
                                ? 'bg-primary/10'
                                : 'bg-muted'
                          }`}
                        >
                          {floor.is_premium ? (
                            <Star className="h-5 w-5 text-accent" />
                          ) : (
                            <Building2
                              className={`h-5 w-5 ${
                                floor.is_available ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{floor.name}</p>
                            {!floor.is_available && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-warning text-warning"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Indisponível
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {floor.description}
                          </p>
                          {floor.features && floor.features.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {floor.features.map((feature, idx) => {
                                const isHighlight = HIGHLIGHT_TAGS.has(feature);
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                      isHighlight
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-[#F1F1F1] text-[#3A3A3A]'
                                    }`}
                                  >
                                    {feature}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
