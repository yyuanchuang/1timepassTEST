import { UserRole } from "./types";

export const APP_NAME = "WeldTrack Pro";

export const NAV_ITEMS = [
  { label: '獎金申請單', path: '/', roles: [UserRole.WORKER, UserRole.ADMIN] },
  { label: '我的匯總', path: '/summary', roles: [UserRole.WORKER, UserRole.ADMIN] },
  { label: '管理員審核', path: '/admin', roles: [UserRole.ADMIN] },
];