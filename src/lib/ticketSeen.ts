const KEY = 'ticket_last_seen_v1';

type Map = Record<string, string>;

function read(): Map {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function getLastSeen(ticketId: string): string | null {
  return read()[ticketId] ?? null;
}

export function markTicketSeen(ticketId: string) {
  const m = read();
  m[ticketId] = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(m));
}

export function hasUnreadAdminUpdate(ticketId: string, lastAdminAt?: string | null): boolean {
  if (!lastAdminAt) return false;
  const seen = getLastSeen(ticketId);
  if (!seen) return true;
  return new Date(lastAdminAt) > new Date(seen);
}
