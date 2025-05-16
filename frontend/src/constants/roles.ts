export const ROLES = {
  APP_ADMIN: 'app_admin',
  CLIENT_ADMIN: 'client_admin',
  DRIVER: 'driver',
  WAREHOUSE_ADMIN: 'warehouse_admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES]; 