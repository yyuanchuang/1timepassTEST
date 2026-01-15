import { Application, AppStatus, MasterItem, User, UserRole, UserStatus, QUARTER_DATES, WeldSpec } from "../types";
import { v4 as uuidv4 } from 'uuid';

// --- Mock Data Initialization ---

// Helper for generic specs
const generateGenericSpecs = (drawingPrefix: string, count: number): WeldSpec[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: uuidv4(),
    configName: `${drawingPrefix}-Standard`,
    drawingNo: `${drawingPrefix}-001`,
    weldNo: `W-${String(i + 1).padStart(2, '0')}`,
    weight: 100 * (i + 1), 
    price: 0 
  }));
};

// Helper for specific drawing groups
const createSpecsFromMap = (map: Record<string, [string, number][]>): WeldSpec[] => {
  const specs: WeldSpec[] = [];
  Object.entries(map).forEach(([drawing, welds]) => {
    welds.forEach(([weldNo, weight]) => {
      specs.push({
        id: uuidv4(),
        configName: drawing, // Default config name to drawing name
        drawingNo: drawing,
        weldNo: weldNo,
        weight: weight,
        price: 0
      });
    });
  });
  return specs;
};

// Helper for Complex Sets (Config -> Drawings -> Welds)
type ConfigMap = Record<string, Record<string, [string, number][]>>;

const createSpecsFromConfigMap = (configMap: ConfigMap): WeldSpec[] => {
  const specs: WeldSpec[] = [];
  Object.entries(configMap).forEach(([configName, drawingMap]) => {
    Object.entries(drawingMap).forEach(([drawing, welds]) => {
      welds.forEach(([weldNo, weight]) => {
        specs.push({
          id: uuidv4(),
          configName: configName,
          drawingNo: drawing,
          weldNo: weldNo,
          weight: weight,
          price: 0
        });
      });
    });
  });
  return specs;
};

// Data Definition based on user provided images
const ITEMS_DATA = [
  // Mating
  { category: 'Mating', name: '最終大組對接(整層)*', welder: 90000, foreman: 10000, total: 100000, wCount: 18, fCount: 2 },
  { category: 'Mating', name: 'TP/UP大組對接(整層)', welder: 45000, foreman: 4000, total: 49000, wCount: 18, fCount: 2 },
  { category: 'Mating', name: 'MD/LW大組對接(整層)', welder: 45000, foreman: 4000, total: 49000, wCount: 18, fCount: 2 },
  // TP
  { category: 'TP', name: '桶身+底板', welder: 8000, foreman: 1000, total: 9000, wCount: 8, fCount: 2 },
  { category: 'TP', name: '門板+桶身', welder: 4000, foreman: 1000, total: 5000, wCount: 4, fCount: 2 },
  { category: 'TP', name: '門板+橢圓門框', welder: 4000, foreman: 1000, total: 5000, wCount: 4, fCount: 2 },
  { category: 'TP', name: '頂板預製', welder: 7200, foreman: 1000, total: 8200, wCount: 6, fCount: 2 },
  { category: 'TP', name: '頂板大組(大微笑)', welder: 6000, foreman: 1000, total: 7000, wCount: 4, fCount: 2 },
  { category: 'TP', name: '頂板大組(加勁板立銲)', welder: 2400, foreman: 1000, total: 3400, wCount: 2, fCount: 2 },
  { category: 'TP', name: 'TP 角管接底板', welder: 4000, foreman: 1000, total: 5000, wCount: 4, fCount: 2 },
  { category: 'TP', name: '大吊耳大組(三顆)', welder: 14400, foreman: 1000, total: 15400, wCount: 12, fCount: 2 },
  // JK
  { category: 'JK', name: 'UL單腿對接', welder: 1600, foreman: 400, total: 2000, wCount: 4, fCount: 2 },
  { category: 'JK', name: 'LL小對接', welder: 1600, foreman: 400, total: 2000, wCount: 4, fCount: 2 },
  { category: 'JK', name: 'LL大對接', welder: 3600, foreman: 400, total: 4000, wCount: 4, fCount: 2 },
  { category: 'JK', name: 'UL 整隻拱頭', welder: 16000, foreman: 1000, total: 17000, wCount: 16, fCount: 2 },
  { category: 'JK', name: 'ML 整隻拱頭', welder: 8000, foreman: 1000, total: 9000, wCount: 8, fCount: 2 },
  { category: 'JK', name: 'LL 整隻拱頭', welder: 9600, foreman: 1000, total: 10600, wCount: 8, fCount: 2 },
  { category: 'JK', name: 'U2D', welder: 4800, foreman: 400, total: 5200, wCount: 24, fCount: 2 },
  { category: 'JK', name: 'M2D', welder: 2400, foreman: 400, total: 2800, wCount: 12, fCount: 2 },
  { category: 'JK', name: 'L2D', welder: 3600, foreman: 400, total: 4000, wCount: 12, fCount: 2 },
  { category: 'JK', name: 'U3D', welder: 6400, foreman: 400, total: 6800, wCount: 16, fCount: 2 },
  { category: 'JK', name: 'M3D', welder: 4800, foreman: 400, total: 5200, wCount: 12, fCount: 2 },
  { category: 'JK', name: 'L3D', welder: 6000, foreman: 400, total: 6400, wCount: 12, fCount: 2 },
  { category: 'JK', name: '中腿公差板', welder: 2400, foreman: 400, total: 2800, wCount: 4, fCount: 2 },
  { category: 'JK', name: '下腿公差板', welder: 3200, foreman: 400, total: 3600, wCount: 4, fCount: 2 },
  { category: 'JK', name: 'XB1', welder: 800, foreman: 200, total: 1000, wCount: 8, fCount: 2 },
  { category: 'JK', name: 'XB2', welder: 800, foreman: 200, total: 1000, wCount: 8, fCount: 2 },
  { category: 'JK', name: 'XB3', welder: 1200, foreman: 400, total: 1600, wCount: 6, fCount: 2 },
  { category: 'JK', name: 'XB4', welder: 1200, foreman: 400, total: 1600, wCount: 6, fCount: 2 },
];

const MOCK_ITEMS: MasterItem[] = ITEMS_DATA.map((item, index) => {
  let specs: WeldSpec[] = [];
  // Specs generation logic (simplified for brevity, identical to previous)
  if (item.name === '頂板預製') {
    specs = createSpecsFromMap({ 'CWP08G-TP-8SM303.002': [['W01', 538], ['W02', 31], ['W04', 63], ['W05', 173], ['W06', 31], ['W08', 63], ['W09', 173]] });
  } else {
    // Default generic for others
    specs = generateGenericSpecs(item.category, 5);
  }

  return {
    id: String(index + 1),
    category: item.category as 'Mating' | 'TP' | 'JK',
    itemName: item.name,
    basePrice: item.total,
    welderPrice: item.welder,
    foremanPrice: (item as any).foreman || (item as any).Foreman || 0,
    defaultWelders: item.wCount,
    defaultForemen: item.fCount,
    specs: specs
  };
});

const LOCAL_STORAGE_APPS_KEY = 'weldtrack_apps_v5'; 
const LOCAL_STORAGE_USERS_KEY = 'weldtrack_users_v2';

const SEED_USERS: User[] = [
  { id: 'admin', name: 'System Admin', password: 'admin', workstation: 'OFFICE', role: UserRole.ADMIN, status: UserStatus.ACTIVE },
];

export const getQuarterSummaryDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let nextYear = year;
  let summaryDate = '';
  if (month <= 3) summaryDate = `${year}-${QUARTER_DATES.Q1.summary}`;
  else if (month <= 6) summaryDate = `${year}-${QUARTER_DATES.Q2.summary}`;
  else if (month <= 9) summaryDate = `${year}-${QUARTER_DATES.Q3.summary}`;
  else summaryDate = `${nextYear + 1}-${QUARTER_DATES.Q4.summary}`;
  return summaryDate;
};

export const MockService = {
  getUsers: async (): Promise<User[]> => {
    const stored = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return JSON.parse(stored);
  },

  registerUser: async (user: User): Promise<void> => {
    const users = await MockService.getUsers();
    if (users.find(u => u.id === user.id)) throw new Error("Username already exists");
    users.push(user);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  },

  approveUser: async (userId: string): Promise<void> => {
    const users = await MockService.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index >= 0) {
      users[index].status = UserStatus.ACTIVE;
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
    }
  },

  login: async (username: string, password?: string): Promise<User> => {
    if (username === 'guest') return { id: 'guest', name: 'Guest Viewer', workstation: 'VIEWER', role: UserRole.GUEST, status: UserStatus.ACTIVE };
    const users = await MockService.getUsers();
    const user = users.find(u => u.id === username && u.password === password);
    if (!user) throw new Error("Invalid credentials");
    if (user.status !== UserStatus.ACTIVE) throw new Error("Account is pending approval");
    return user;
  },

  getItems: async (): Promise<MasterItem[]> => MOCK_ITEMS,
  getItemById: async (id: string): Promise<MasterItem | undefined> => MOCK_ITEMS.find(i => i.id === id),

  getApplications: async (): Promise<Application[]> => {
    const stored = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getApplicationById: async (id: string): Promise<Application | undefined> => {
    const apps = await MockService.getApplications();
    return apps.find(a => a.id === id);
  },

  generateSheetNo: async (workstation: string, itemId: string): Promise<string> => {
    const apps = await MockService.getApplications();
    const item = MOCK_ITEMS.find(i => i.id === itemId);
    if (!item) throw new Error("Item not found");

    const year = new Date().getFullYear().toString().slice(-2);
    
    // CRITICAL FIX: Ensure correct Yard Code logic
    let yardCode = '99'; 
    if (workstation === 'Y1') yardCode = 'Y1';
    else if (workstation === 'Y2') yardCode = 'Y2';
    else if (workstation === 'Y3') yardCode = 'Y3';
    
    let itemCode = 'XX';
    if (item.category === 'Mating') itemCode = 'MT';
    else if (item.category === 'TP') itemCode = 'TP';
    else if (item.category === 'JK') itemCode = 'JK';

    const prefix = `${year}${yardCode}${itemCode}`;
    const existingSerials = apps
      .filter(a => a.sheetNo && a.sheetNo.startsWith(prefix))
      .map(a => parseInt(a.sheetNo.slice(-2), 10))
      .filter(n => !isNaN(n));
    
    const maxSerial = existingSerials.length > 0 ? Math.max(...existingSerials) : 0;
    const nextSerial = (maxSerial + 1).toString().padStart(2, '0');

    return `${prefix}${nextSerial}`;
  },

  saveApplication: async (app: Application): Promise<void> => {
    const apps = await MockService.getApplications();
    const index = apps.findIndex(a => a.id === app.id);
    app.summaryDate = getQuarterSummaryDate(app.submitDate);
    if (index >= 0) apps[index] = app;
    else apps.push(app);
    localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
  },

  checkIfApplied: async (weldNo: string, masterItemId: string): Promise<boolean> => {
    const apps = await MockService.getApplications();
    return apps.some(a => a.masterItemId === masterItemId && a.items.some(i => i.weldNo === weldNo) && a.status !== AppStatus.REJECTED);
  },

  updateStatus: async (appId: string, status: AppStatus, comment?: string): Promise<void> => {
    const apps = await MockService.getApplications();
    const index = apps.findIndex(a => a.id === appId);
    if (index >= 0) {
      apps[index].status = status;
      if (comment) apps[index].adminComment = comment;
      localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
    }
  },

  getNotificationCounts: async (user: User) => {
    const apps = await MockService.getApplications();
    const users = await MockService.getUsers();

    if (user.role === UserRole.ADMIN) {
        const pendingApps = apps.filter(a => a.status === AppStatus.PENDING).length;
        const pendingUsers = users.filter(u => u.status === UserStatus.PENDING).length;
        return { adminCount: pendingApps + pendingUsers, workerCount: 0 };
    } else {
        const rejectedApps = apps.filter(a => a.applicantName === user.name && a.status === AppStatus.REJECTED).length;
        return { adminCount: 0, workerCount: rejectedApps };
    }
  }
};