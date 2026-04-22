import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Shield, DoorOpen, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import facadeImage from '@/assets/bold-facade.jpg';
import logoBold from '@/assets/logo-bold-workplace.png';

const SUPPORT_WHATSAPP = 'https://wa.me/5547991281130';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, isLoading, isCentralAtendimento, isRecepcao } = useAuth();
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  useEffect(() => {
    if (user && !isLoading) {
      if (isCentralAtendimento) {
        navigate('/admin');
      } else if (isRecepcao) {
        navigate('/recepcao');
      } else {
        navigate('/');
      }
    }
  }, [user, isLoading, isCentralAtendimento, isRecepcao, navigate]);

  const startPress = () => {
    longPressTriggered.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      setStaffMenuOpen(true);
    }, 3000);
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen min-h-[100dvh] flex flex-col bg-cover bg-center"
      style={{ backgroundImage: `url(${facadeImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-16 pb-6 max-w-lg mx-auto w-full">
        {/* Logo + slogan (with long-press easter egg) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <button
            type="button"
            aria-label="Bold Workplace"
            className="select-none focus:outline-none"
            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onTouchCancel={cancelPress}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => {
              if (longPressTriggered.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <img
              src={logoBold}
              alt="Bold Workplace"
              draggable={false}
              className="w-[230px] h-auto object-contain mx-auto pointer-events-none"
            />
          </button>

          <p className="mt-6 text-white/90 text-base leading-relaxed font-light max-w-xs italic">
            Escritórios corporativos desenhados para grandes decisões
          </p>
        </div>

        {/* Action area */}
        <div className="space-y-4">
          <Button
            size="lg"
            className="relative z-20 w-full h-14 text-base font-semibold bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-transform"
            onClick={() => navigate('/login')}
          >
            Acessar Workplace
          </Button>

          <a
            href={SUPPORT_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-20 flex items-center justify-center gap-2 text-sm text-white hover:text-white min-h-[44px] drop-shadow-md cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            Precisa de ajuda? Fale conosco
          </a>

          {/* Footer address */}
          <p className="relative z-20 text-center text-[11px] text-white/80 pt-4 leading-snug drop-shadow">
            Rua Ministro Calógeras, 343 — Bucarein, Joinville/SC
          </p>
        </div>
      </div>

      {/* Staff easter-egg menu */}
      <Dialog open={staffMenuOpen} onOpenChange={setStaffMenuOpen}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>Acesso restrito</DialogTitle>
            <DialogDescription>Selecione o painel desejado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => {
                setStaffMenuOpen(false);
                navigate('/reception-login');
              }}
            >
              <DoorOpen className="mr-2 h-4 w-4" />
              Acesso Recepção
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => {
                setStaffMenuOpen(false);
                navigate('/admin-login');
              }}
            >
              <Shield className="mr-2 h-4 w-4" />
              Acesso Central
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
