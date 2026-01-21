import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFloors } from '@/hooks/useFloors';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Search, UserPlus, Edit, UserX, UserCheck } from 'lucide-react';
import type { Profile } from '@/types';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  company: z.string().min(2, 'Empresa deve ter pelo menos 2 caracteres'),
  floor_id: z.string().uuid('Selecione um andar'),
  room: z.string().min(1, 'Informe a sala'),
});

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { floors } = useFloors();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    cpf: '',
    company: '',
    floor_id: '',
    room: '',
  });

  // Fetch all profiles (admin only)
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, floor:floors(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (data: typeof formData) => {
      // First, create the auth user using edge function (since we can't use admin API client-side)
      const { data: authData, error: authError } = await supabase.functions.invoke('create-user', {
        body: { email: data.email, password: data.password },
      });

      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error('Erro ao criar usuário');

      // Create the profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        full_name: data.full_name,
        cpf: data.cpf,
        company: data.company,
        floor_id: data.floor_id,
        room: data.room,
      });

      if (profileError) throw profileError;

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast({
        title: 'Usuário criado',
        description: 'O usuário foi criado com sucesso.',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar usuário.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      cpf: '',
      company: '',
      floor_id: '',
      room: '',
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = userSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const displayCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf.includes(searchTerm)
  );

  const availableFloors = floors.filter((f) => f.is_available);

  return (
    <AdminLayout title="Gestão de Usuários">
      <div className="p-4 space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empresa ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo usuário.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    placeholder="João da Silva"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="00000000000"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    maxLength={11}
                  />
                  <p className="text-xs text-muted-foreground">Apenas números</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  <Input
                    id="company"
                    placeholder="Nome da empresa"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Andar *</Label>
                    <Select
                      value={formData.floor_id}
                      onValueChange={(value) => setFormData({ ...formData, floor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFloors.map((floor) => (
                          <SelectItem key={floor.id} value={floor.id}>
                            {floor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room">Sala *</Label>
                    <Input
                      id="room"
                      placeholder="301"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Usuário'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Count */}
        <p className="text-sm text-muted-foreground">
          {filteredProfiles.length} usuário(s) encontrado(s)
        </p>

        {/* Users List - Mobile Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProfiles.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="font-medium truncate">{profile.full_name}</p>
                        <p className="text-sm text-muted-foreground">{profile.company}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline" className="font-mono">
                          {displayCPF(profile.cpf)}
                        </Badge>
                        <Badge variant="secondary">
                          {profile.floor?.name || 'N/A'} • Sala {profile.room}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cadastrado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
