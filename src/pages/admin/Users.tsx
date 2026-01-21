import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFloors } from '@/hooks/useFloors';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Search, UserPlus, MoreVertical, UserX, UserCheck, Trash2, Edit, Filter, X } from 'lucide-react';
import type { Profile } from '@/types';
import { z } from 'zod';

const ITEMS_PER_PAGE = 20;

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  company: z.string().min(2, 'Empresa deve ter pelo menos 2 caracteres'),
  floor_id: z.string().uuid('Selecione um andar'),
  room: z.string().min(1, 'Informe a sala'),
});

const editUserSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  company: z.string().min(2, 'Empresa deve ter pelo menos 2 caracteres'),
  floor_id: z.string().uuid('Selecione um andar'),
  room: z.string().min(1, 'Informe a sala'),
});

type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { floors } = useFloors();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
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

  const [editFormData, setEditFormData] = useState({
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
        .order('company', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  // Get unique companies for filter
  const companies = useMemo(() => {
    const uniqueCompanies = [...new Set(profiles.map(p => p.company))];
    return uniqueCompanies.sort();
  }, [profiles]);

  // Filtered and paginated profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch = 
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf.includes(searchTerm);
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.is_active) ||
        (statusFilter === 'inactive' && !p.is_active);
      
      const matchesCompany = 
        companyFilter === 'all' || p.company === companyFilter;

      return matchesSearch && matchesStatus && matchesCompany;
    });
  }, [profiles, searchTerm, statusFilter, companyFilter]);

  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: authData, error: authError } = await supabase.functions.invoke('create-user', {
        body: { email: data.email, password: data.password },
      });

      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error('Erro ao criar usuário');

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
      setIsCreateDialogOpen(false);
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

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editFormData }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          cpf: data.cpf,
          company: data.company,
          floor_id: data.floor_id,
          room: data.room,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast({
        title: 'Usuário atualizado',
        description: 'Os dados do usuário foram atualizados.',
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar usuário.',
        variant: 'destructive',
      });
    },
  });

  // Toggle user active status mutation
  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast({
        title: variables.is_active ? 'Usuário ativado' : 'Usuário desativado',
        description: variables.is_active
          ? 'O usuário foi ativado com sucesso.'
          : 'O usuário foi desativado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status do usuário.',
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'delete', user_id: userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi excluído permanentemente.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir usuário.',
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = editUserSchema.safeParse(editFormData);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await updateUser.mutateAsync({ id: selectedUser.id, data: editFormData });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (profile: Profile) => {
    setSelectedUser(profile);
    setEditFormData({
      full_name: profile.full_name,
      cpf: profile.cpf,
      company: profile.company,
      floor_id: profile.floor_id || '',
      room: profile.room,
    });
    setError('');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (profile: Profile) => {
    setSelectedUser(profile);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = (profile: Profile) => {
    toggleUserStatus.mutate({ id: profile.id, is_active: !profile.is_active });
  };

  const handleDelete = () => {
    if (selectedUser) {
      deleteUser.mutate(selectedUser.user_id);
    }
  };

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const displayCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCompanyFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || companyFilter !== 'all';

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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="pl-9"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2">
            <Select 
              value={statusFilter} 
              onValueChange={(value: StatusFilter) => {
                setStatusFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={companyFilter} 
              onValueChange={(value) => {
                setCompanyFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
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
              <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
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
                    onClick={() => setIsCreateDialogOpen(false)}
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

        {/* Users Count & Stats */}
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
          <span>{filteredProfiles.length} usuário(s)</span>
          {filteredProfiles.length !== profiles.length && (
            <span className="text-xs">de {profiles.length} total</span>
          )}
          <div className="flex gap-2 ml-auto">
            <Badge variant="outline" className="text-xs">
              {profiles.filter(p => p.is_active).length} ativos
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {profiles.filter(p => !p.is_active).length} inativos
            </Badge>
          </div>
        </div>

        {/* Users List - Mobile Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedProfiles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {hasActiveFilters ? 'Nenhum usuário encontrado com os filtros aplicados.' : 'Nenhum usuário cadastrado.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedProfiles.map((profile) => (
              <Card key={profile.id} className={!profile.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{profile.full_name}</p>
                        {!profile.is_active && (
                          <Badge variant="secondary" className="text-xs">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{profile.company}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline" className="font-mono">
                          {displayCPF(profile.cpf)}
                        </Badge>
                        <Badge variant="secondary">
                          {profile.floor?.name || 'N/A'} • Sala {profile.room}
                        </Badge>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(profile)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(profile)}
                          disabled={toggleUserStatus.isPending}
                        >
                          {profile.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(profile)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize os dados do usuário.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nome Completo *</Label>
                <Input
                  id="edit_full_name"
                  placeholder="João da Silva"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_cpf">CPF *</Label>
                <Input
                  id="edit_cpf"
                  placeholder="00000000000"
                  value={editFormData.cpf}
                  onChange={(e) => setEditFormData({ ...editFormData, cpf: formatCPF(e.target.value) })}
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground">Apenas números</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_company">Empresa *</Label>
                <Input
                  id="edit_company"
                  placeholder="Nome da empresa"
                  value={editFormData.company}
                  onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Andar *</Label>
                  <Select
                    value={editFormData.floor_id}
                    onValueChange={(value) => setEditFormData({ ...editFormData, floor_id: value })}
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
                  <Label htmlFor="edit_room">Sala *</Label>
                  <Input
                    id="edit_room"
                    placeholder="301"
                    value={editFormData.room}
                    onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O usuário <strong>{selectedUser?.full_name}</strong> será 
                removido permanentemente do sistema, incluindo todos os seus dados e chamados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
