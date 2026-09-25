import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeModal: string | null;
  openModal: (modal: string) => void;
  closeModal: () => void;
  notifications: any[];
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);
  const openModal = (modal: string) => setActiveModal(modal);
  const closeModal = () => setActiveModal(null);
  const addNotification = (notification: any) => setNotifications(prev => [...prev, { id: crypto.randomUUID(), ...notification }]);
  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <AppContext.Provider value={{
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      activeModal,
      openModal,
      closeModal,
      notifications,
      addNotification,
      removeNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
