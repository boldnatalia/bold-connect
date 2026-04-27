const KEY = 'ticket_last_seen_v1';
const KEY_ADMIN = 'ticket_last_seen_admin_v1';

type Map = Record<string, string>;

function read(key: string): Map {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

export function getLastSeen(ticketId: string): string | null {
  return read(KEY)[ticketId] ?? null;
}

export function markTicketSeen(ticketId: string) {
  const m = read(KEY);
  m[ticketId] = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(m));
}

export function hasUnreadAdminUpdate(ticketId: string, lastAdminAt?: string | null): boolean {
  if (!lastAdminAt) return false;
  const seen = getLastSeen(ticketId);
  if (!seen) return true;
  return new Date(lastAdminAt) > new Date(seen);
}

// Admin-side: tracks when admin last opened a ticket (to flag new client messages)
export function getAdminLastSeen(ticketId: string): string | null {
  return read(KEY_ADMIN)[ticketId] ?? null;
}

export function markTicketSeenByAdmin(ticketId: string) {
  const m = read(KEY_ADMIN);
  m[ticketId] = new Date().toISOString();
  localStorage.setItem(KEY_ADMIN, JSON.stringify(m));
}

export function hasUnreadClientUpdate(ticketId: string, lastClientAt?: string | null): boolean {
  if (!lastClientAt) return false;
  const seen = getAdminLastSeen(ticketId);
  if (!seen) return true;
  return new Date(lastClientAt) > new Date(seen);
}

