import { Usuario } from './user';

// Props para el SidebarContent
export interface SidebarContentProps {
  onItemClick?: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  usuario: Usuario; 
}
