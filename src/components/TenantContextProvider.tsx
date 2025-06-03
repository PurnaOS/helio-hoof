"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from "react";// Adjust path if your dataModel is elsewhere
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import type { TenantRole } from "../../convex/tenantrole";
import { setActiveTenantInBrowser, getActiveTenantFromBrowser } from "../utils/activeTenantPersistance";



interface TenantContextType {
  activeTenant: TenantRole | null;
  myTenantRoles: TenantRole[] | undefined;
  setActiveTenant: (tenant: TenantRole | null) => void;
  isLoadingTenant: boolean; // To indicate if still loading from local storage
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [activeTenant, setActiveTenantState] = useState<TenantRole | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(true); // Start as true
  const myTenantRoles = useQuery(api.tenantrole.getMyMemberTenants, {});

  const setActiveTenant = (tenant: TenantRole | null) => {
    setActiveTenantState(tenant);
    setActiveTenantInBrowser(tenant);
  };

  const selectFirstTenantRole = ( tenants: TenantRole[] ) => {
    if(tenants && tenants.length > 0){
        setActiveTenantState(tenants[0]);
    }
  }
  // Load active tenant from local storage on initial mount
  useEffect(() => {
    try {
      if(!myTenantRoles){
        return;
      }
      const storedTenant = getActiveTenantFromBrowser();
     if (myTenantRoles.length === 1) {
        setActiveTenant(myTenantRoles[0]);
      } else if (storedTenant){
        const currentTenant = myTenantRoles.find(t => t.memberID === storedTenant.memberID);
        if (!currentTenant) {
            selectFirstTenantRole(myTenantRoles);
        }else{
          setActiveTenantState(currentTenant);
        }
      } else {
        selectFirstTenantRole(myTenantRoles);
      }
    } catch (error) {
      console.error("Failed to load active tenant ID from local storage:", error);
      // Handle cases where localStorage might not be available (e.g., SSR, private browsing)
    } finally {
      setIsLoadingTenant(false); // Done loading
    }
  }, [myTenantRoles]);

  // Only render children when tenant is loaded if we have an activeTenantId
  return (
    <TenantContext.Provider value={{ activeTenant, myTenantRoles, setActiveTenant, isLoadingTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};