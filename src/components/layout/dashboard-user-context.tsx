"use client";

import { createContext, useContext } from "react";

const DashboardUserContext = createContext("");

type DashboardUserProviderProps = {
  children: React.ReactNode;
  userEmail: string;
};

export function DashboardUserProvider({
  children,
  userEmail,
}: DashboardUserProviderProps) {
  return (
    <DashboardUserContext.Provider value={userEmail}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUserEmail() {
  return useContext(DashboardUserContext);
}
