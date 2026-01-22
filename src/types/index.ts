// Bold Workplace Types

export type TicketStatus = 'pending' | 'in_progress' | 'resolved';

export type AppRole = 'admin' | 'tenant';

export interface Floor {
  id: string;
  floor_number: number;
  name: string;
  description: string | null;
  is_available: boolean;
  is_premium: boolean;
  features: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string;
  company: string;
  floor_id: string | null;
  room: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  floor?: Floor;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TicketStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  comments?: TicketComment[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  category: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingRoom {
  id: string;
  name: string;
  floor: string;
  capacity: number | null;
  description: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Status translations
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
};

// Floor options for registration
export const AVAILABLE_FLOORS = [
  { value: 3, label: '3º andar', available: true },
  { value: 5, label: '5º andar', available: true },
  { value: 6, label: '6º andar', available: true },
  { value: 9, label: '9º andar', available: true },
  { value: 11, label: '11º andar', available: true },
  { value: 12, label: '12º andar', available: true },
  { value: 2, label: '2º andar (em reforma)', available: false },
];
