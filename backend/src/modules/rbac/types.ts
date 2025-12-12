export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  serviceDeskIds?: string[];
  clientIds?: string[];
  isPortal?: boolean;
}
