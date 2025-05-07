import React, { createContext, useContext, useState, ReactNode } from 'react';

type SideMenuContextType = {
  isSideMenuVisible: boolean;
  setSideMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

export const SideMenuProvider = ({ children }: { children: ReactNode }) => {
  const [isSideMenuVisible, setSideMenuVisible] = useState(false);

  return (
    <SideMenuContext.Provider value={{ isSideMenuVisible, setSideMenuVisible }}>
      {children}
    </SideMenuContext.Provider>
  );
};

export const useSideMenu = () => {
  const context = useContext(SideMenuContext);
  if (!context) {
    throw new Error('useSideMenu must be used within a SideMenuProvider');
  }
  return context;
};