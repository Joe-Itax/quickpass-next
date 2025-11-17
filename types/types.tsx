export interface Event {
  id: string; // identifiant DB
  eventId: string; // identifiant lisible (slug)
  name: string;
  description?: string;
  date: string;
  location: string;
  status: "past" | "ongoing" | "upcoming";
  totalInvitations: number; // invitations ≠ personnes
  totalCapacity: number; // somme des capacity de chaque invitation
  totalScanned: number; // somme des scannedCount
}

export interface Guest {
  id: number;
  name: string;
  email?: string;
  table: string;

  capacity: number; // nombre max de personnes autorisées (1–∞)
  scannedCount: number; // combien de scans ont été réalisés
  scans?: Array<{ at: string }>;

  status: "valid" | "full";
}
