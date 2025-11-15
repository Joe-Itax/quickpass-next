export interface Event {
  id?: string | number;
  EventId?: string;
  name: string;
  description?: string;
  date?: string;
  location?: string;
  guestsCount?: number;
  status: string;
}
