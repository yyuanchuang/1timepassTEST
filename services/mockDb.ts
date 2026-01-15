import { Application, AppStatus, MasterItem, User, UserRole, UserStatus, QUARTER_DATES, WeldSpec } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Setup ---
// These will be loaded from Vercel Environment Variables
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("WeldTrack: Supabase 環境變數未設定 (VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 遺失)。將使用本地測試模式。");
} else {
  console.log("WeldTrack: 已偵測到 Supabase 設定，嘗試連線...");
}

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- Static Data (Items) ---
// Note: We keep items hardcoded for now as they are configuration data. 
// Ideally these would also be in the DB, but this simplifies the migration.

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

const createSpecsFromMap = (map: Record<string, [string, number][]>): WeldSpec[] => {
  const specs: WeldSpec[] = [];
  Object.entries(map).forEach(([drawing, welds]) => {
    welds.forEach(([weldNo, weight]) => {
      specs.push({
        id: uuidv4(),
        configName: drawing, 
        drawingNo: drawing,
        weldNo: weldNo,
        weight: weight,
        price: 0
      });
    });
  });
  return specs;
};

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
  if (item.name === '頂板預製') {
    specs = createSpecsFromMap({ 'CWP08G-TP-8SM303.002': [['W01', 538], ['W02', 31], ['W04', 63], ['W05', 173], ['W06', 31], ['W08', 63], ['W09', 173]] });
  } else if (item.name === '桶身+底板') {
    specs = createSpecsFromConfigMap({
      'CWP08G-8FTP1.002': { 'CWP08G-8FTP1.002': [['W01', 479]] },
      'CWP08G-8FTP2.002': { 'CWP08G-8FTP2.002': [['W01', 479]] }
    });
  } else if (item.name === '門板+桶身') {
    specs = createSpecsFromConfigMap({
      'CWP08G-8FTP1.002': { 'CWP08G-8FTP1.002': [['W38', 538]], 'CWP08G-TP-8SM302.001': [['W05', 31], ['W06', 149], ['W07', 149]] },
      'CWP08G-8FTP2.002': { 'CWP08G-8FTP2.002': [['W38', 162]], 'CWP08G-TP-8SM302.001': [['W05', 109], ['W06', 149], ['W07', 149]] }
    });
  } else if (item.name === '門板+橢圓門框') {
     specs = createSpecsFromMap({ 'CWP08G-TP-8SM302.001': [['W08', 396]] });
  } else if (item.name === '頂板大組(大微笑)') {
    specs = createSpecsFromConfigMap({
      'CWP08G-8FTP1.002': { 'CWP08G-8FTP1.002': [['W02', 697], ['W03', 697], ['W04', 697]] },
      'CWP08G-8FTP2.002': { 'CWP08G-8FTP2.002': [['W02', 697], ['W03', 697], ['W04', 697]] }
    });
  } else if (item.name === '頂板大組(加勁板立銲)') {
    specs = createSpecsFromConfigMap({
      'CWP08G-8FTP1.002': { 'CWP08G-8FTP1.002': [['W08', 185], ['W09', 185], ['W10', 185], ['W11', 185], ['W12', 185], ['W13', 185]] },
      'CWP08G-8FTP2.002': { 'CWP08G-8FTP2.002': [['W08', 185], ['W09', 185], ['W10', 185], ['W11', 185], ['W12', 185], ['W13', 185]] }
    });
  } else if (item.name === 'TP 角管接底板') {
    specs = createSpecsFromConfigMap({
      'CWP08G-8FTP1.002': { 'CWP08G-8FTP1.002': [['W05', 277], ['W06', 277], ['W07', 277]] },
      'CWP08G-8FTP2.002': { 'CWP08G-8FTP2.002': [['W05', 277], ['W06', 277], ['W07', 277]] }
    });
  } else if (item.name === '大吊耳大組(三顆)') {
    const wListA: [string, number][] = [['W17', 88], ['W20', 84], ['W23', 76], ['W26', 67], ['W29', 87], ['W32', 87], ['W35', 80], ['W18', 88], ['W21', 84], ['W24', 76], ['W27', 67], ['W30', 87], ['W33', 87], ['W36', 80], ['W19', 88], ['W22', 84], ['W25', 76], ['W28', 67], ['W31', 87], ['W34', 87], ['W37', 80]];
    specs = createSpecsFromConfigMap({ 'CWP08G-8FTP1.002': { 'CWP08G-8FTP1.002': wListA }, 'CWP08G-8FTP2.002': { 'CWP08G-8FTP2.002': wListA } });
  } else if (item.name === '最終大組對接(整層)*') {
    const wList: [string, number][] = [['W01', 439], ['W02', 439], ['W03', 439]];
    specs = createSpecsFromConfigMap({ 'CWP082-JT21.002': { 'CWP082-JT21.002': wList }, 'CWP082-JT22.002': { 'CWP082-JT22.002': wList }, 'CWP082-JT23.002': { 'CWP082-JT23.002': wList }, 'CWP082-JT24.002': { 'CWP082-JT24.002': wList }, 'CWP082-JT25.002': { 'CWP082-JT25.002': wList }, 'CWP082-JT26.002': { 'CWP082-JT26.002': wList }, 'CWP081-JT11.002': { 'CWP081-JT11.002': wList }, 'CWP081-JT12.002': { 'CWP081-JT12.002': wList }, 'CWP082-JT27.002': { 'CWP082-JT27.002': wList }, 'CWP082-JT28.002': { 'CWP082-JT28.002': wList }, 'CWP082-JT29.002': { 'CWP082-JT29.002': wList } });
  } else if (item.name === 'TP/UP大組對接(整層)') {
    const wList: [string, number][] = [['W01', 281], ['W02', 281], ['W03', 281]];
    specs = createSpecsFromConfigMap({ 'CWP08G-UTP01.002': { 'CWP08G-UTP01.002': wList }, 'CWP08G-UTP02.002': { 'CWP08G-UTP02.002': wList }, 'CWP08G-UTP03.002': { 'CWP08G-UTP03.002': wList } });
  } else if (item.name === 'MD/LW大組對接(整層)') {
    const wList: [string, number][] = [['W01', 552], ['W02', 552], ['W03', 552]];
    specs = createSpecsFromConfigMap({ 'CWP081-MLJ11.002': { 'CWP081-MLJ11.002': wList }, 'CWP081-MLJ12.002': { 'CWP081-MLJ12.002': wList }, 'CWP082-MLJ21.002': { 'CWP082-MLJ21.002': wList }, 'CWP082-MLJ22.002': { 'CWP082-MLJ22.002': wList }, 'CWP082-MLJ23.002': { 'CWP082-MLJ23.002': wList }, 'CWP082-MLJ24.002': { 'CWP082-MLJ24.002': wList }, 'CWP082-MLJ25.002': { 'CWP082-MLJ25.002': wList }, 'CWP082-MLJ26.002': { 'CWP082-MLJ26.002': wList } });
  } else if (item.name === 'UL單腿對接') {
    specs = createSpecsFromConfigMap({ 'CWP08G-ULA.001': { 'CWP08G-ULA.001': [['W01', 292]] }, 'CWP08G-ULB.001': { 'CWP08G-ULB.001': [['W01', 292]] }, 'CWP08G-ULC.001': { 'CWP08G-ULC.001': [['W01', 292]] } });
  } else if (item.name === 'LL小對接') {
    specs = createSpecsFromConfigMap({ 'CWP081-LLA.001': { 'CWP081-LLA.001': [['W01', 198]] }, 'CWP081-LLB.001': { 'CWP081-LLB.001': [['W01', 198]] }, 'CWP081-LLC.001': { 'CWP081-LLC.001': [['W01', 198]] }, 'CWP082-LLA.001': { 'CWP082-LLA.001': [['W01', 198]] }, 'CWP082-LLA1.001': { 'CWP082-LLA1.001': [['W01', 198]] }, 'CWP082-LLB.001': { 'CWP082-LLB.001': [['W01', 198]] }, 'CWP082-LLB1.001': { 'CWP082-LLB1.001': [['W01', 198]] }, 'CWP082-LLC.001': { 'CWP082-LLC.001': [['W01', 198]] }, 'CWP082-LLC1.001': { 'CWP082-LLC1.001': [['W01', 198]] } });
  } else if (item.name === 'LL大對接') {
    specs = createSpecsFromConfigMap({ 'CWP081-LLA.001': { 'CWP081-LLA.001': [['W02', 523]] }, 'CWP081-LLB.001': { 'CWP081-LLB.001': [['W02', 523]] }, 'CWP081-LLC.001': { 'CWP081-LLC.001': [['W02', 523]] }, 'CWP082-LLA.001': { 'CWP082-LLA.001': [['W02', 523]] }, 'CWP082-LLA1.001': { 'CWP082-LLA1.001': [['W02', 523]] }, 'CWP082-LLB.001': { 'CWP082-LLB.001': [['W02', 523]] }, 'CWP082-LLB1.001': { 'CWP082-LLB1.001': [['W02', 523]] }, 'CWP082-LLC.001': { 'CWP082-LLC.001': [['W02', 523]] }, 'CWP082-LLC1.001': { 'CWP082-LLC1.001': [['W02', 523]] } });
  } else if (item.name === 'UL 整隻拱頭') {
    const wList: [string, number][] = [['W02', 41], ['W03', 41], ['W04', 44], ['W05', 44], ['W06', 65], ['W07', 65], ['W08', 56], ['W09', 56]];
    specs = createSpecsFromConfigMap({ 'CWP08G-ULA.001': { 'CWP08G-ULA.001': wList }, 'CWP08G-ULB.001': { 'CWP08G-ULB.001': wList }, 'CWP08G-ULC.001': { 'CWP08G-ULC.001': wList } });
  } else if (item.name === 'ML 整隻拱頭') {
    const wList: [string, number][] = [['W01', 68], ['W02', 68], ['W03', 73], ['W04', 73]];
    specs = createSpecsFromConfigMap({ 'CWP082-MLA.001': { 'CWP082-MLA.001': wList }, 'CWP082-MLB.001': { 'CWP082-MLB.001': wList }, 'CWP082-MLC.001': { 'CWP082-MLC.001': wList }, 'CWP081-MLA.001': { 'CWP081-MLA.001': wList }, 'CWP081-MLB.001': { 'CWP081-MLB.001': wList }, 'CWP081-MLC.001': { 'CWP081-MLC.001': wList } });
  } else if (item.name === 'LL 整隻拱頭') {
    const wList: [string, number][] = [['W03', 106], ['W04', 106], ['W05', 153], ['W06', 153]];
    const wList2: [string, number][] = [['W03', 109], ['W04', 109], ['W05', 156], ['W06', 156]];
    specs = createSpecsFromConfigMap({ 'CWP081-LLA.001': { 'CWP081-LLA.001': wList }, 'CWP081-LLB.001': { 'CWP081-LLB.001': wList }, 'CWP081-LLC.001': { 'CWP081-LLC.001': wList }, 'CWP082-LLA.001': { 'CWP082-LLA.001': wList2 }, 'CWP082-LLA1.001': { 'CWP082-LLA1.001': wList2 }, 'CWP082-LLB.001': { 'CWP082-LLB.001': wList2 }, 'CWP082-LLB1.001': { 'CWP082-LLB1.001': wList2 }, 'CWP082-LLC.001': { 'CWP082-LLC.001': wList2 }, 'CWP082-LLC1.001': { 'CWP082-LLC1.001': wList2 } });
  } else if (item.name === 'U2D') {
    const commonUA: [string, number][] = [['W01', 21], ['W02', 21], ['W03', 25], ['W04', 25], ['W05', 49], ['W06', 49], ['W07', 11], ['W08', 11]];
    const commonXB1: [string, number][] = [['W02', 6], ['W03', 6]];
    const commonXB2: [string, number][] = [['W02', 16], ['W03', 16]];
    specs = createSpecsFromConfigMap({ 'CWP08G-UA01.001': { 'CWP08G-UA01.001': commonUA, 'CWP08G-XB1-AC.001': commonXB1, 'CWP08G-XB2-AC.001': commonXB2 }, 'CWP08G-UA02.001': { 'CWP08G-UA02.001': commonUA, 'CWP08G-XB1-AC.001': commonXB1, 'CWP08G-XB2-AC.001': commonXB2 }, 'CWP08G-UA03.001': { 'CWP08G-UA03.001': commonUA, 'CWP08G-XB1-AC.001': commonXB1, 'CWP08G-XB2-AC.001': commonXB2 } });
  } else if (item.name === 'M2D') {
    const commonMA: [string, number][] = [['W01', 26], ['W02', 26], ['W03', 26], ['W04', 26]];
    const commonXB31: [string, number][] = [['W02', 26], ['W03', 26]];
    const commonXB32: [string, number][] = [['W02', 26], ['W03', 26]];
    specs = createSpecsFromConfigMap({ 'CWP081-MA11.001': { 'CWP081-MA11.001': commonMA, 'CWP081-XB31-AC.001': commonXB31 }, 'CWP081-MA12.001': { 'CWP081-MA12.001': commonMA, 'CWP081-XB31-AC.001': commonXB31 }, 'CWP082-MA21.001': { 'CWP082-MA21.001': commonMA, 'CWP082-XB32-AC.001': commonXB32 }, 'CWP082-MA22.001': { 'CWP082-MA22.001': commonMA, 'CWP082-XB32-AC.001': commonXB32 }, 'CWP082-MA23.001': { 'CWP082-MA23.001': commonMA, 'CWP082-XB32-AC.001': commonXB32 } });
  } else if (item.name === 'L2D') {
    const commonLA: [string, number][] = [['W01', 84], ['W02', 84], ['W03', 120], ['W04', 120]];
    const commonXB41: [string, number][] = [['W02', 49], ['W03', 63]];
    const commonXB42: [string, number][] = [['W02', 49], ['W03', 63]];
    specs = createSpecsFromConfigMap({ 'CWP081-LA11.001': { 'CWP081-LA11.001': commonLA, 'CWP081-XB41-AC.001': commonXB41 }, 'CWP081-LA12.001': { 'CWP081-LA12.001': commonLA, 'CWP081-XB41-AC.001': commonXB41 }, 'CWP082-LA21.001': { 'CWP082-LA21.001': commonLA, 'CWP082-XB42-AC.001': commonXB42 }, 'CWP082-LA22.001': { 'CWP082-LA22.001': commonLA, 'CWP082-XB42-AC.001': commonXB42 }, 'CWP082-LA23.001': { 'CWP082-LA23.001': commonLA, 'CWP082-XB42-AC.001': commonXB42 }, 'CWP082-LA25.001': { 'CWP082-LA25.001': commonLA, 'CWP082-XB42-AC.001': commonXB42 }, 'CWP082-LA26.001': { 'CWP082-LA26.001': commonLA, 'CWP082-XB42-AC.001': commonXB42 } });
  } else if (item.name === 'U3D') {
    const commonUJ: [string, number][] = [['W01', 21], ['W02', 21], ['W03', 25], ['W04', 25], ['W05', 49], ['W06', 49], ['W07', 11], ['W08', 11], ['W09', 21], ['W10', 21], ['W11', 25], ['W12', 25], ['W13', 49], ['W14', 49], ['W15', 11], ['W16', 11]];
    specs = createSpecsFromConfigMap({ 'CWP08G-UJ01.002': { 'CWP08G-UJ01.002': commonUJ }, 'CWP08G-UJ02.002': { 'CWP08G-UJ02.002': commonUJ }, 'CWP08G-UJ03.002': { 'CWP08G-UJ03.002': commonUJ } });
  } else if (item.name === 'M3D') {
    const commonMJ: [string, number][] = [['W01', 26], ['W02', 26], ['W03', 26], ['W04', 26], ['W05', 26], ['W06', 26], ['W07', 26], ['W08', 26]];
    specs = createSpecsFromConfigMap({ 'CWP081-MJ11.002': { 'CWP081-MJ11.002': commonMJ }, 'CWP081-MJ12.002': { 'CWP081-MJ12.002': commonMJ }, 'CWP082-MJ21.002': { 'CWP082-MJ21.002': commonMJ }, 'CWP082-MJ22.002': { 'CWP082-MJ22.002': commonMJ }, 'CWP082-MJ23.002': { 'CWP082-MJ23.002': commonMJ } });
  } else if (item.name === 'L3D') {
    const commonLJ: [string, number][] = [['W01', 84], ['W02', 84], ['W03', 120], ['W04', 120], ['W05', 84], ['W06', 84], ['W07', 120], ['W08', 120]];
    specs = createSpecsFromConfigMap({ 'CWP081-LJ11.002': { 'CWP081-LJ11.002': commonLJ }, 'CWP081-LJ12.002': { 'CWP081-LJ12.002': commonLJ }, 'CWP082-LJ21.002': { 'CWP082-LJ21.002': commonLJ }, 'CWP082-LJ22.002': { 'CWP082-LJ22.002': commonLJ }, 'CWP082-LJ23.002': { 'CWP082-LJ23.002': commonLJ }, 'CWP082-LJ24.002': { 'CWP082-LJ24.002': commonLJ }, 'CWP082-LJ25.002': { 'CWP082-LJ25.002': commonLJ }, 'CWP082-LJ26.002': { 'CWP082-LJ26.002': commonLJ } });
  } else if (item.name === '中腿公差板') {
    specs = createSpecsFromConfigMap({ 'CWP081-ML-8S118.001': { 'CWP081-ML-8S118.001': [['W01', 316]] }, 'CWP082-ML-8S120.001': { 'CWP082-ML-8S120.001': [['W01', 355]] } });
  } else if (item.name === '下腿公差板') {
    specs = createSpecsFromConfigMap({ 'CWP081-LL-8S122.001': { 'CWP081-LL-8S122.001': [['W01', 457]] }, 'CWP082-LL-8S125.001': { 'CWP082-LL-8S125.001': [['W01', 457]] } });
  } else if (item.name === 'XB1') {
    const wList: [string, number][] = [['W02', 6.05], ['W03', 6.82], ['W05', 18.87], ['W06', 18.87]];
    specs = createSpecsFromConfigMap({ 'CWP08G-XB1-AB.001': { 'CWP08G-XB1-AB.001': wList }, 'CWP08G-XB1-BC.001': { 'CWP08G-XB1-BC.001': wList } });
  } else if (item.name === 'XB2') {
    const wList: [string, number][] = [['W02', 15.50], ['W03', 15.50], ['W05', 44.00], ['W06', 44.00]];
    specs = createSpecsFromConfigMap({ 'CWP08G-XB2-AB.001': { 'CWP08G-XB2-AB.001': wList }, 'CWP08G-XB2-BC.001': { 'CWP08G-XB2-BC.001': wList } });
  } else if (item.name === 'XB3') {
    const wList: [string, number][] = [['W01', 26.29], ['W02', 26.29], ['W03', 26.29], ['W04', 26.29]];
    specs = createSpecsFromConfigMap({ 'CWP082-XB32-AB.001': { 'CWP082-XB32-AB.001': wList }, 'CWP082-XB32-BC.001': { 'CWP082-XB32-BC.001': wList } });
  } else if (item.name === 'XB4') {
    const wListAB: [string, number][] = [['W01', 49.48], ['W02', 49.48], ['W03', 63.27]];
    const wList41: [string, number][] = [['W01', 49.48], ['W02', 78.85], ['W03', 78.85]];
    specs = createSpecsFromConfigMap({ 'CWP082-XB42-AB.001': { 'CWP082-XB42-AB.001': wListAB }, 'CWP082-XB42-BC.001': { 'CWP082-XB42-BC.001': wListAB }, 'CWP081-XB41-AB.001': { 'CWP081-XB41-AB.001': wList41 }, 'CWP081-XB41-BC.001': { 'CWP081-XB41-BC.001': wList41 } });
  } else {
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

// Fallback for when keys are not set
const SEED_USERS: User[] = [
  { id: 'admin', name: 'System Admin', password: 'admin', workstation: 'OFFICE', role: UserRole.ADMIN, status: UserStatus.ACTIVE },
];

export const MockService = {
  getUsers: async (): Promise<User[]> => {
    if (!supabase) return SEED_USERS;
    const { data, error } = await supabase.from('app_users').select('content');
    if (error) { console.error(error); return []; }
    return data.map((d: any) => d.content);
  },

  registerUser: async (user: User): Promise<void> => {
    if (!supabase) throw new Error("Database not connected");
    // Check exist
    const { data } = await supabase.from('app_users').select('id').eq('id', user.id);
    if (data && data.length > 0) throw new Error("Username already exists");
    
    const { error } = await supabase.from('app_users').insert({ id: user.id, content: user });
    if (error) throw new Error(error.message);
  },

  approveUser: async (userId: string): Promise<void> => {
    if (!supabase) return;
    const { data } = await supabase.from('app_users').select('content').eq('id', userId).single();
    if (data) {
        const updatedUser = { ...data.content, status: UserStatus.ACTIVE };
        await supabase.from('app_users').update({ content: updatedUser }).eq('id', userId);
    }
  },

  login: async (username: string, password?: string): Promise<User> => {
    if (username === 'guest') return { id: 'guest', name: 'Guest Viewer', workstation: 'VIEWER', role: UserRole.GUEST, status: UserStatus.ACTIVE };
    
    if (!supabase) {
        // Fallback for local testing without DB
        if (username === 'admin' && password === 'admin') return SEED_USERS[0];
        throw new Error("Database not connected (Check Vercel Env Vars)");
    }

    const { data } = await supabase.from('app_users').select('content').eq('id', username).single();
    if (!data) throw new Error("Invalid credentials");
    
    const user = data.content;
    if (user.password !== password) throw new Error("Invalid credentials");
    if (user.status !== UserStatus.ACTIVE) throw new Error("Account is pending approval");
    
    return user;
  },

  getItems: async (): Promise<MasterItem[]> => MOCK_ITEMS,
  getItemById: async (id: string): Promise<MasterItem | undefined> => MOCK_ITEMS.find(i => i.id === id),

  getApplications: async (): Promise<Application[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('applications').select('content');
    if (error) { console.error(error); return []; }
    return data.map((d: any) => d.content);
  },

  getApplicationById: async (id: string): Promise<Application | undefined> => {
    if (!supabase) return undefined;
    const { data } = await supabase.from('applications').select('content').eq('id', id).single();
    return data ? data.content : undefined;
  },

  generateSheetNo: async (workstation: string, itemId: string): Promise<string> => {
    // We need to fetch all to count max, or assume frontend logic.
    // For cloud, we fetch all simple headers or filter.
    const allApps = await MockService.getApplications();

    const item = MOCK_ITEMS.find(i => i.id === itemId);
    if (!item) throw new Error("Item not found");

    const year = new Date().getFullYear().toString().slice(-2);
    
    let yardCode = '99'; 
    if (workstation === 'Y1') yardCode = 'Y1';
    else if (workstation === 'Y2') yardCode = 'Y2';
    else if (workstation === 'Y3') yardCode = 'Y3';
    
    let itemCode = 'XX';
    if (item.category === 'Mating') itemCode = 'MT';
    else if (item.category === 'TP') itemCode = 'TP';
    else if (item.category === 'JK') itemCode = 'JK';

    const prefix = `${year}${yardCode}${itemCode}`;
    const existingSerials = allApps
      .filter(a => a.sheetNo && a.sheetNo.startsWith(prefix))
      .map(a => parseInt(a.sheetNo.slice(-2), 10))
      .filter(n => !isNaN(n));
    
    const maxSerial = existingSerials.length > 0 ? Math.max(...existingSerials) : 0;
    const nextSerial = (maxSerial + 1).toString().padStart(2, '0');

    return `${prefix}${nextSerial}`;
  },

  saveApplication: async (app: Application): Promise<void> => {
    if (!supabase) return;
    app.summaryDate = getQuarterSummaryDate(app.submitDate);
    // Upsert (Insert or Update)
    const { error } = await supabase.from('applications').upsert({ id: app.id, content: app });
    if (error) throw new Error(error.message);
  },

  checkIfApplied: async (weldNo: string, masterItemId: string): Promise<boolean> => {
    const apps = await MockService.getApplications();
    return apps.some(a => a.masterItemId === masterItemId && a.items.some(i => i.weldNo === weldNo) && a.status !== AppStatus.REJECTED);
  },

  updateStatus: async (appId: string, status: AppStatus, comment?: string): Promise<void> => {
    if (!supabase) return;
    // Get current, update fields, save back
    const { data } = await supabase.from('applications').select('content').eq('id', appId).single();
    if (data) {
        const updatedApp = { ...data.content, status: status };
        if (comment) updatedApp.adminComment = comment;
        await supabase.from('applications').update({ content: updatedApp }).eq('id', appId);
    }
  },

  getNotificationCounts: async (user: User) => {
    if (!supabase) return { adminCount: 0, workerCount: 0 };
    
    // We can optimize this later with specific SQL queries, but reusing getApps is safer for now
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