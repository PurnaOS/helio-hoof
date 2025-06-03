import type { TenantRole } from "../../convex/tenantrole";
const LOCAL_STORAGE_ACTIVE_TENANT_KEY = "hh_activeTenant";
export const setActiveTenantInBrowser = (tenant: TenantRole | null) => {
    try {
      if (tenant) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_TENANT_KEY, JSON.stringify(tenant));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_TENANT_KEY);
      }
    } catch (error) {
      console.error("Failed to save active tenant ID to local storage:", error);
    }
  }

export const getActiveTenantFromBrowser = () : TenantRole | null => {
    try {
      const storedTenant = localStorage.getItem(LOCAL_STORAGE_ACTIVE_TENANT_KEY);
      if (storedTenant) {
        return JSON.parse(storedTenant) as TenantRole;
      }
      return null;
    } catch (error) {
      console.error("Failed to get active tenant ID from local storage:", error);
      return null;
    }
}
    