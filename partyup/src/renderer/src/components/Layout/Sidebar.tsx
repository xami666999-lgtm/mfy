import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SidebarNavItem } from '../../types/navigation';
import * as Icons from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  'gamepad-2': Icons.Gamepad2,
  'download': Icons.Download,
  'cpu': Icons.Cpu,
  'puzzle': Icons.Puzzle,
  'users': Icons.Users,
  'cloud': Icons.Cloud,
  'sliders-horizontal': Icons.SlidersHorizontal,
  'trophy': Icons.Trophy,
  'database': Icons.Database,
  'message-circle': Icons.MessageCircle,
  'plug': Icons.Plug,
  'palette': Icons.Palette,
  'settings': Icons.Settings,
};

interface SidebarProps {
  collapsed: boolean;
  items: SidebarNavItem[];
}

export function Sidebar({ collapsed, items }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <ul>
          {items.map((item) => {
            const Icon = iconMap[item.icon] || Icons.HelpCircle;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={22} aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                  {item.badge && !collapsed && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-indicator online" />
            <span>Connected</span>
          </div>
          <div className="sidebar-shortcuts">
            <kbd>Ctrl</kbd><kbd>K</kbd> Command Palette
          </div>
        </div>
      )}
    </aside>
  );
}
