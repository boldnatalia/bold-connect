import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import ReceptionLogin from "./pages/ReceptionLogin";
import ForgotPassword from "./pages/ForgotPassword";

// Client pages
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Tickets from "./pages/Tickets";
import TicketDetail from "./pages/TicketDetail";
import NewTicket from "./pages/NewTicket";
import Announcements from "./pages/Announcements";
import Menu from "./pages/Menu";
import Floors from "./pages/Floors";
import Manual from "./pages/Manual";
import MeetingRooms from "./pages/MeetingRooms";

// Central de Atendimento (admin) pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTickets from "./pages/admin/Tickets";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminTemplates from "./pages/admin/Templates";
import AdminMenu from "./pages/admin/Menu";
import AdminUsers from "./pages/admin/Users";

// Reception pages
import ReceptionDashboard from "./pages/reception/Dashboard";
import ReceptionSendNotification from "./pages/reception/SendNotification";
import ReceptionHistory from "./pages/reception/History";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/reception-login" element={<ReceptionLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected client routes */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
            <Route path="/tickets/new" element={<ProtectedRoute><NewTicket /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
            <Route path="/floors" element={<ProtectedRoute><Floors /></ProtectedRoute>} />
            <Route path="/manual" element={<ProtectedRoute><Manual /></ProtectedRoute>} />
            <Route path="/meeting-rooms" element={<ProtectedRoute><MeetingRooms /></ProtectedRoute>} />

            {/* Protected Central de Atendimento (admin) routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute requireAdmin><AdminTickets /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute requireAdmin><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/templates" element={<ProtectedRoute requireAdmin><AdminTemplates /></ProtectedRoute>} />
            <Route path="/admin/menu" element={<ProtectedRoute requireAdmin><AdminMenu /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />

            {/* Protected Reception routes */}
            <Route path="/recepcao" element={<ProtectedRoute requireRole="recepcao"><ReceptionDashboard /></ProtectedRoute>} />
            <Route path="/recepcao/enviar" element={<ProtectedRoute requireRole="recepcao"><ReceptionSendNotification /></ProtectedRoute>} />
            <Route path="/recepcao/historico" element={<ProtectedRoute requireRole="recepcao"><ReceptionHistory /></ProtectedRoute>} />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
