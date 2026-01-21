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
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  adminOnly?: boolean;
}

const userNavItems: NavItem[] = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: MessageSquare, label: 'Chamados', href: '/tickets' },
  { icon: Bell, label: 'Avisos', href: '/announcements' },
  { icon: DoorOpen, label: 'Salas', href: '/meeting-rooms' },
  { icon: BookOpen, label: 'Manual', href: '/manual' },
];

const adminNavItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: MessageSquare, label: 'Chamados', href: '/admin/tickets' },
  { icon: Bell, label: 'Avisos', href: '/admin/announcements' },
  { icon: FileText, label: 'Templates', href: '/admin/templates' },
  { icon: UtensilsCrossed, label: 'Cardápio', href: '/admin/menu' },
  { icon: Users, label: 'Usuários', href: '/admin/users' },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin, signOut } = useAuth();

  const navItems = isAdmin ? adminNavItems.slice(0, 5) : userNavItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 px-1 transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
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
