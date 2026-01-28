import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReceptionMessages } from '@/hooks/useReceptionMessages';
import { useReceptionNotifications } from '@/hooks/useReceptionNotifications';
import { useProfiles } from '@/hooks/useProfiles';
import { useToast } from '@/hooks/use-toast';
import { Send, User, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SendNotification() {
  const { messages, isLoading: messagesLoading } = useReceptionMessages();
  const { sendNotification, isSending } = useReceptionNotifications();
  const { profiles, isLoading: profilesLoading } = useProfiles();
  const { toast } = useToast();

  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<string>('');
  const [inputValue, setInputValue] = useState('');

  const selectedMessageData = messages.find(m => m.id === selectedMessage);
  const activeClients = profiles.filter(p => p.is_active);

  // Group messages by category
  const messagesByCategory = messages.reduce((acc, msg) => {
    const category = msg.category || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(msg);
    return acc;
  }, {} as Record<string, typeof messages>);

  const handleSend = async () => {
    if (!selectedRecipient || !selectedMessage) {
      toast({
        title: 'Erro',
        description: 'Selecione o destinatário e a mensagem',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMessageData?.has_input_field && !inputValue.trim()) {
      toast({
        title: 'Erro',
        description: `Preencha o campo: ${selectedMessageData.input_field_label}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await sendNotification({
        recipientId: selectedRecipient,
        messageId: selectedMessage,
        inputValue: inputValue.trim() || undefined,
        requiresResponse: selectedMessageData?.has_input_field && selectedMessageData.category === 'Códigos',
      });

      toast({
        title: 'Aviso enviado!',
        description: 'O cliente foi notificado.',
      });

      // Reset form
      setSelectedRecipient('');
      setSelectedMessage('');
      setInputValue('');
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  if (messagesLoading || profilesLoading) {
    return (
      <AppLayout title="Enviar Aviso" showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Enviar Aviso" showBack>
      <div className="p-4 space-y-4">
        {/* Select Recipient */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Destinatário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {activeClients.map((profile) => (
                  <SelectItem key={profile.id} value={profile.user_id}>
                    <div className="flex flex-col">
                      <span>{profile.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {profile.company} - {profile.floor?.name || ''} Sala {profile.room}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Select Message */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Tipo de Aviso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(messagesByCategory).map(([category, msgs]) => (
              <div key={category}>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  {category}
                </Label>
                <div className="mt-2 space-y-2">
                  {msgs.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessage(msg.id);
                        setInputValue('');
                      }}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-all duration-200',
                        'active:scale-[0.98]',
                        selectedMessage === msg.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:bg-muted/50'
                      )}
                    >
                      <p className="font-medium text-sm">{msg.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {msg.content}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Input Field (if required) */}
        {selectedMessageData?.has_input_field && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedMessageData.input_field_label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedMessageData.input_field_placeholder || ''}
                className="min-h-[44px]"
              />
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {selectedMessageData && selectedRecipient && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Prévia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {selectedMessageData.content}
                {inputValue && (
                  <span className="font-medium"> {inputValue}</span>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!selectedRecipient || !selectedMessage || isSending}
          className="w-full min-h-[48px]"
          size="lg"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Send className="h-5 w-5 mr-2" />
          )}
          Enviar Aviso
        </Button>
      </div>
    </AppLayout>
  );
}
