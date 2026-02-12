import type { Session } from '@/store/types';

export function sortSessionsByLastUsed(sessions: Session[]): Session[] {
  return sessions.sort((a, b) => {
    const timeA = new Date(a.lastUsedAt).getTime();
    const timeB = new Date(b.lastUsedAt).getTime();
    if (timeA !== timeB) return timeB - timeA;
    
    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();
    if (createdA !== createdB) return createdB - createdA;
    
    return a.title.localeCompare(b.title);
  });
}