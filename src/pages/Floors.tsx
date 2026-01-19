import { AppLayout } from '@/components/AppLayout';
import { useFloors } from '@/hooks/useFloors';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Loader2, MapPin, Star, AlertTriangle } from 'lucide-react';

export default function Floors() {
  const { floors, isLoading } = useFloors();

  return (
    <AppLayout title="Andares">
      <div className="p-4 space-y-4 max-w-lg mx-auto animate-fade-in">
        <p className="text-sm text-muted-foreground text-center">
          Conheça os espaços do Bold Workplace
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {floors.map((floor) => (
              <Card 
                key={floor.id} 
                className={`card-premium ${!floor.is_available ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg shrink-0 ${
                      floor.is_premium 
                        ? 'bg-accent/10' 
                        : floor.is_available 
                          ? 'bg-primary/10' 
                          : 'bg-muted'
                    }`}>
                      {floor.is_premium ? (
                        <Star className="h-5 w-5 text-accent" />
                      ) : (
                        <Building2 className={`h-5 w-5 ${floor.is_available ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{floor.name}</p>
                        {floor.is_premium && (
                          <Badge className="bg-accent text-accent-foreground text-[10px]">
                            Premium
                          </Badge>
                        )}
                        {!floor.is_available && (
                          <Badge variant="outline" className="text-[10px] border-warning text-warning">
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
                          {floor.features.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px]">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
