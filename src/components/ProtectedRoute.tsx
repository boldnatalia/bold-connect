import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

type RequireRole = 'admin' | 'central_atendimento' | 'recepcao' | 'cliente' | 'staff';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireRole?: RequireRole;
}

export function ProtectedRoute({ children, requireAdmin = false, requireRole }: ProtectedRouteProps) {
  const { user, isAdmin, isCentralAtendimento, isRecepcao, isCliente, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  // Auto-redirect staff away from client routes when no specific role required
  if (location.pathname === '/' && !requireRole && !requireAdmin) {
    if (isCentralAtendimento) {
      return <Navigate to="/admin" replace />;
    }
    if (isRecepcao) {
      return <Navigate to="/recepcao" replace />;
    }
  }

  // Legacy support for requireAdmin
  if (requireAdmin && !isAdmin && !isCentralAtendimento) {
    // Recepção tentando entrar no admin -> volta para sua área
    if (isRecepcao) return <Navigate to="/recepcao" replace />;
    return <Navigate to="/" replace />;
  }

  // Role-based access control
  if (requireRole) {
    switch (requireRole) {
      case 'admin':
        if (!isAdmin) {
          if (isRecepcao) return <Navigate to="/recepcao" replace />;
          if (isCentralAtendimento) return <Navigate to="/admin" replace />;
          return <Navigate to="/" replace />;
        }
        break;
      case 'central_atendimento':
        if (!isCentralAtendimento) {
          if (isRecepcao) return <Navigate to="/recepcao" replace />;
          return <Navigate to="/" replace />;
        }
        break;
      case 'recepcao':
        if (!isRecepcao && !isCentralAtendimento) {
          return <Navigate to="/" replace />;
        }
        break;
      case 'cliente':
        if (!isCliente) {
          if (isCentralAtendimento) return <Navigate to="/admin" replace />;
          if (isRecepcao) return <Navigate to="/recepcao" replace />;
          return <Navigate to="/welcome" replace />;
        }
        break;
      case 'staff':
        if (isCliente) return <Navigate to="/" replace />;
        break;
    }
  }

  return <>{children}</>;
}
