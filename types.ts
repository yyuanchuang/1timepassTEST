export enum UserRole {
  GUEST = 'GUEST',     // Viewer only
  WORKER = 'WORKER',   // Editor (Main User)
  ADMIN = 'ADMIN',     // Admin / Admin Assistant
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string; // unique username
  name: string;
  password?: string;
  workstation: string; // Y1, Y2, Y3
  role: UserRole;
  status: UserStatus;
}

export interface WeldSpec {
  id: string;
  configName?: string; // New: To group drawings (e.g. Set #1)
  drawingNo: string;
  weldNo: string;
  weight: number;
  price: number; // Keep for compatibility
}

export interface MasterItem {
  id: string;
  category: 'Mating' | 'TP' | 'JK'; 
  itemName: string;
  basePrice: number; // Total Component Bonus
  welderPrice: number; // Welder portion
  foremanPrice: number; // Foreman portion
  defaultWelders: number; // Default number of welders to populate
  defaultForemen: number; // Default number of foremen to populate
  specs: WeldSpec[]; // List of valid drawing/weld combinations for this item
}

export interface WelderAllocation {
  workerId: string;
  workerName: string;
  role: 'WELDER' | 'FOREMAN';
  amount: number;
}

export interface ApplicationLineItem {
  specId: string;
  drawingNo: string;
  weldNo: string;
  itemSerial: string; // New: Component Serial # (e.g. #005)
  weight: number;
  price: number;
  utDate?: string; // Optional completion date per weld
}

export enum AppStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Application {
  id: string;
  sheetNo: string; // Generated: YYAATT##
  workstation: string;
  applicantName: string;
  submitDate: string;
  
  masterItemId: string; // The main item category selected
  items: ApplicationLineItem[]; // The list of welds applied for in this sheet
  
  allocations: WelderAllocation[]; // Money distribution
  
  status: AppStatus;
  adminComment?: string;
  summaryDate?: string;
}

export const QUARTER_DATES = {
  Q1: { end: '03-31', summary: '04-15' },
  Q2: { end: '06-30', summary: '07-15' },
  Q3: { end: '09-30', summary: '10-15' },
  Q4: { end: '12-31', summary: '01-15' },
};