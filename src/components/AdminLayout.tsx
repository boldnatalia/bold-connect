import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bell, 
  FileText, 
  UtensilsCrossed,
  LogOut,
  ChevronLeft,
  Menu,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Usuários', icon: Users },
  { path: '/admin/tickets', label: 'Chamados', icon: MessageSquare },
  { path: '/admin/announcements', label: 'Avisos', icon: Bell },
  { path: '/admin/templates', label: 'Templates', icon: FileText },
  { path: '/admin/menu', label: 'Cardápio', icon: UtensilsCrossed },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-lg text-primary">Bold Admin</h2>
        <p className="text-xs text-muted-foreground">{profile?.full_name}</p>
      </div>
      
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95',
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground active:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border space-y-1">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground active:bg-muted transition-all duration-200 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
          Voltar ao App
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive active:bg-destructive/10 transition-all duration-200 active:scale-95"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
        <NavContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-3 p-4 border-b border-border bg-card">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <NavContent />
            </SheetContent>
          </Sheet>
          <h1 className="font-semibold">{title}</h1>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between p-6 border-b border-border">
          <h1 className="text-2xl font-bold">{title}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
