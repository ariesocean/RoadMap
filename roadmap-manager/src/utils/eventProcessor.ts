export interface EventData {
  id?: string;
  type: string;
  [key: string]: unknown;
}

export function processEvent(eventId: string, handler: () => void, processedEvents: Set<string>): void {
  if (processedEvents.has(eventId)) return;
  processedEvents.add(eventId);
  handler();
}