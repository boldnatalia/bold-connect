import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export function AppLayout({ children, title, showBack, rightAction }: AppLayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <Header title={title} showBack={showBack} rightAction={rightAction} />
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
