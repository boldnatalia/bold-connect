import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Search, Loader2, User, Building, MapPin } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TICKET_STATUS_LABELS, TicketStatus, Ticket } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminTickets() {
  const { tickets, isLoading, updateTicket, isUpdating } = useTickets();
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const filteredTickets = tickets
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    );

  const getStatusClass = (status: TicketStatus) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'in_progress':
        return 'status-in-progress';
      case 'resolved':
        return 'status-resolved';
    }
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    updateTicket({ id: ticketId, status: newStatus, admin_notes: adminNotes || undefined });
  };

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.admin_notes || '');
  };

  return (
    <AdminLayout title="Gestão de Chamados">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar chamados..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Tabs - Scrollable on mobile */}
        <div className="overflow-x-auto -mx-4 px-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as TicketStatus | 'all')}>
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
              <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm">
                Todos
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1 sm:flex-none text-xs sm:text-sm">
                Pendentes
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex-1 sm:flex-none text-xs sm:text-sm">
                Em andamento
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1 sm:flex-none text-xs sm:text-sm">
                Resolvidos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground">
          {filteredTickets.length} chamado(s) encontrado(s)
        </p>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openTicketDetails(ticket)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Status and time */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getStatusClass(ticket.status))}
                      >
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(ticket.created_at), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Title and description */}
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Status selector */}
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => {
                        handleStatusChange(ticket.id, value as TicketStatus);
                      }}
                    >
                      <SelectTrigger 
                        className="w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum chamado encontrado</p>
            </CardContent>
          </Card>
        )}

        {/* Ticket Details Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-left pr-6">{selectedTicket?.title}</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn('text-xs', getStatusClass(selectedTicket.status))}>
                    {TICKET_STATUS_LABELS[selectedTicket.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Aberto em {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Alterar Status</label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => {
                      handleStatusChange(selectedTicket.id, value as TicketStatus);
                      setSelectedTicket({ ...selectedTicket, status: value as TicketStatus });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notas do Administrador</label>
                  <Textarea
                    placeholder="Adicione observações sobre este chamado..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                  <Button 
                    onClick={() => {
                      updateTicket({ 
                        id: selectedTicket.id, 
                        admin_notes: adminNotes 
                      });
                      setSelectedTicket(null);
                    }}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
