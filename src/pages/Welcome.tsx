import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Loader2, Shield, DoorOpen } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, isLoading, isCentralAtendimento, isRecepcao } = useAuth();

  useEffect(() => {
    if (user && !isLoading) {
      // Redirect based on role
      if (isCentralAtendimento) {
        navigate('/admin');
      } else if (isRecepcao) {
        navigate('/recepcao');
      } else {
        navigate('/');
      }
    }
  }, [user, isLoading, isCentralAtendimento, isRecepcao, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Logo and branding */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="h-24 w-24 rounded-3xl bg-primary flex items-center justify-center shadow-xl">
            <span className="text-primary-foreground font-bold text-5xl">B</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Bold Workplace</h1>
            <p className="text-muted-foreground mt-2">
              Seu espaço corporativo inteligente
            </p>
          </div>
        </div>

        {/* Main action button */}
        <Button 
          size="lg" 
          className="w-full max-w-sm h-14 text-lg font-semibold"
          onClick={() => navigate('/login')}
        >
          Entrar
        </Button>
      </div>

      {/* Footer with staff access */}
      <div className="p-6 pb-8 space-y-2">
        <Button
          variant="ghost"
          className="w-full text-muted-foreground active:bg-muted min-h-[44px]"
          onClick={() => navigate('/reception-login')}
        >
          <DoorOpen className="mr-2 h-4 w-4" />
          Acesso Recepção
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground active:bg-muted min-h-[44px]"
          onClick={() => navigate('/admin-login')}
        >
          <Shield className="mr-2 h-4 w-4" />
          Central de Atendimento
        </Button>
      </div>
    </div>
  );
}
