import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useTickets } from '@/hooks/useTickets';
import { useTicketComments } from '@/hooks/useTicketComments';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Clock, Search, Loader2, User, Building, MapPin, Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TICKET_STATUS_LABELS, TicketStatus, Ticket } from '@/types';
import { cn } from '@/lib/utils';

function TicketCommentsSection({ ticketId }: { ticketId: string }) {
  const { comments, isLoading, addComment, isAdding } = useTicketComments(ticketId);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.length > 50) return;
    
    addComment(newComment.trim(), {
      onSuccess: () => setNewComment(''),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageCircle className="h-4 w-4" />
        <span>Atualizações</span>
      </div>

      {/* Comments list */}
      <div className="max-h-48 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhuma atualização
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                'p-2 rounded-lg text-sm',
                comment.is_admin
                  ? 'bg-primary/10 border border-primary/20'
                  : 'bg-muted'
              )}
            >
              <p>{comment.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {comment.is_admin ? 'Admin • ' : 'Cliente • '}
                {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Adicionar atualização..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value.slice(0, 50))}
            maxLength={50}
            className="pr-12 h-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            {newComment.length}/50
          </span>
        </div>
        <Button 
          type="submit" 
          size="icon"
          disabled={!newComment.trim() || isAdding}
          className="shrink-0 h-10 w-10"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

export default function AdminTickets() {
  const { tickets, isLoading, updateTicket, isUpdating } = useTickets();
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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
    updateTicket({ id: ticketId, status: newStatus });
  };

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
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
                className="active:scale-[0.99] transition-transform"
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

                    {/* User info */}
                    {ticket.profile && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.profile.full_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {ticket.profile.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ticket.profile.room}
                        </span>
                      </div>
                    )}

                    {/* Quick status change */}
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => {
                        handleStatusChange(ticket.id, value as TicketStatus);
                      }}
                    >
                      <SelectTrigger 
                        className="w-full h-10"
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

        {/* Ticket Details Sheet (mobile-friendly) */}
        <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
            <SheetHeader className="text-left pb-4">
              <SheetTitle className="pr-6">{selectedTicket?.title}</SheetTitle>
            </SheetHeader>
            {selectedTicket && (
              <div className="space-y-4 overflow-y-auto h-[calc(100%-4rem)] pb-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn('text-xs', getStatusClass(selectedTicket.status))}>
                    {TICKET_STATUS_LABELS[selectedTicket.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Aberto em {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {/* User info */}
                {selectedTicket.profile && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                    <p className="text-sm font-medium">{selectedTicket.profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedTicket.profile.company} • {selectedTicket.profile.room}
                    </p>
                  </div>
                )}

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
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Comments Section */}
                <TicketCommentsSection ticketId={selectedTicket.id} />

                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTicket(null)}
                  className="w-full h-12"
                >
                  Fechar
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
