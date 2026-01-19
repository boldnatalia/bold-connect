import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFloors } from '@/hooks/useFloors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  company: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').max(100),
  floor_id: z.string().uuid('Selecione um andar'),
  room: z.string().min(1, 'Informe o número da sala').max(10),
});

export default function Register() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { floors, isLoading: floorsLoading } = useFloors();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    cpf: '',
    company: '',
    floor_id: '',
    room: '',
  });

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'cpf') {
      value = formatCPF(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    const result = registerSchema.pick({ email: true, password: true }).safeParse(formData);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.full_name,
      cpf: formData.cpf,
      company: formData.company,
      floor_id: formData.floor_id,
      room: formData.room,
    });
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } else {
      navigate('/');
    }
  };

  const availableFloors = floors.filter((f) => f.is_available);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-3xl">B</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Bold Workplace</h1>
            <p className="text-muted-foreground text-sm">Crie sua conta</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {step === 1 ? 'Dados de Acesso' : 'Dados do Inquilino'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Escolha seu email e senha'
                : 'Informe os dados da sua empresa'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        disabled={isLoading}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                  </div>

                  <Button type="submit" className="w-full">
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome completo</Label>
                    <Input
                      id="full_name"
                      placeholder="João Silva"
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      disabled={isLoading}
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="00000000000"
                      value={formData.cpf}
                      onChange={(e) => handleChange('cpf', e.target.value)}
                      disabled={isLoading}
                      maxLength={11}
                    />
                    <p className="text-xs text-muted-foreground">Apenas números</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      placeholder="Nome da sua empresa"
                      value={formData.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      disabled={isLoading}
                      autoComplete="organization"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="floor">Andar</Label>
                      <Select
                        value={formData.floor_id}
                        onValueChange={(value) => handleChange('floor_id', value)}
                        disabled={isLoading || floorsLoading}
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
                      <Label htmlFor="room">Sala</Label>
                      <Input
                        id="room"
                        placeholder="301"
                        value={formData.room}
                        onChange={(e) => handleChange('room', e.target.value)}
                        disabled={isLoading}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Conta'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
