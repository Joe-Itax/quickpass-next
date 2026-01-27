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

export interface Table {
  id: number;
  name: string;
  capacity: number;
  eventId: number;
  createdAt: string;
  updatedAt: string;
  allocations?: TableAllocation[];
}

export interface TableAllocation {
  id: number;
  tableId: number;
  invitationId: number;
  seatsAssigned: number;
  createdAt: string;
  updatedAt: string;
  table: Table;
}

export interface Invitation {
  id: number;
  label: string;
  email?: string;
  whatsapp?: string;
  peopleCount: number;
  eventId: number;
  event?: Event2;
  qrCode: string;
  table: string;
  scannedCount: number;
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
  allocations?: TableAllocation[];
}

export interface EventAssignment {
  id: number;
  userId: string;
  eventId: number;
  assignedAt: string;
}

export interface Stat {
  id: number;
  eventId: number;
  totalInvitations: number;
  totalCapacity: number;
  totalPeople: number;
  totalScanned: number;
  totalAssignedSeats: number;
  availableSeats: number;
  updatedAt: string;
}

export interface Event2 {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  eventCode: string;
  status: "FINISHED" | "ONGOING" | "UPCOMING" | "CANCELLED";
  createdById: string;
  createdAt: string;
  updatedAt: string;
  tables: Table[];
  invitations: Invitation[];
  assignments: EventAssignment[];
  stats: Stat;
  terminals: Terminal[];
  durationHours: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string | null;
  role: string;
  isActive: boolean;
  searchableName: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  image: string | null;
}

export interface EventAssignment {
  id: number;
  userId: string;
  eventId: number;
  assignedAt: string;
  user?: User;
}

export interface Log {
  id: number;
  eventCode: string;
  terminalCode?: string;
  terminal?: Terminal;
  invitationId?: number;
  guestName?: string;
  status: string;
  errorMessage?: string;
  scannedAt: Date;
}

export interface Terminal {
  id: number;
  name: string;
  code: string;
  eventId: number;
  isActive: boolean;
  deletedAt: Date | null;
  logs: Log[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
