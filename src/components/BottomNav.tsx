import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  MessageSquare, 
  Bell, 
  BookOpen, 
  Building2, 
  DoorOpen,
  UtensilsCrossed,
  Users,
  FileText,
  Settings,
  LogOut,
  Send,
  History
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const clientNavItems: NavItem[] = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: MessageSquare, label: 'Chamados', href: '/tickets' },
  { icon: Bell, label: 'Avisos', href: '/announcements' },
  { icon: DoorOpen, label: 'Salas', href: '/meeting-rooms' },
  { icon: BookOpen, label: 'Manual', href: '/manual' },
];

const centralAtendimentoNavItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: MessageSquare, label: 'Chamados', href: '/admin/tickets' },
  { icon: Bell, label: 'Avisos', href: '/admin/announcements' },
  { icon: FileText, label: 'Templates', href: '/admin/templates' },
  { icon: Users, label: 'Usuários', href: '/admin/users' },
];

const receptionNavItems: NavItem[] = [
  { icon: Home, label: 'Início', href: '/recepcao' },
  { icon: Send, label: 'Avisar Cliente', href: '/recepcao/enviar' },
  { icon: Bell, label: 'Aviso Geral', href: '/recepcao/aviso-geral' },
  { icon: History, label: 'Histórico', href: '/recepcao/historico' },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin, isCentralAtendimento, isRecepcao } = useAuth();

  let navItems: NavItem[];
  
  if (isCentralAtendimento) {
    navItems = centralAtendimentoNavItems;
  } else if (isRecepcao) {
    navItems = receptionNavItems;
  } else {
    navItems = clientNavItems;
  }

  // Only show first 5 items
  navItems = navItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-[56px] max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] py-2 px-1 transition-all duration-200 active:scale-95',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] mt-1 font-medium truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
