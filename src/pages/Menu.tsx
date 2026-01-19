import { AppLayout } from '@/components/AppLayout';
import { useMenu } from '@/hooks/useMenu';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Loader2 } from 'lucide-react';

export default function Menu() {
  const { menuItems, isLoading } = useMenu();
  const availableItems = menuItems.filter((item) => item.is_available);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const groupedItems = availableItems.reduce((acc, item) => {
    const category = item.category || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof availableItems>);

  return (
    <AppLayout title="Cardápio - 12º Andar">
      <div className="p-4 space-y-6 max-w-lg mx-auto animate-fade-in">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
            Premium
          </Badge>
          <p className="text-sm text-muted-foreground">
            Itens extras disponíveis para salas de reunião
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id} className="card-premium">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-primary shrink-0 ml-4">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <Card className="card-premium">
            <CardContent className="p-8 text-center">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="font-medium mb-1">Cardápio indisponível</p>
              <p className="text-sm text-muted-foreground">
                Os itens serão atualizados em breve
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
