import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProfileApi, getCompanySettingsApi } from '../services/auth';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_title: string;
  department: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

interface CompanySettings {
  name: string;
  logo: string | null;
  gstin: string;
  pan_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
}

interface IdentityContextType {
  user: UserProfile | null;
  company: CompanySettings | null;
  loading: boolean;
  isAdmin: boolean;
  refreshIdentity: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshIdentity = useCallback(async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      setUser(null);
      setCompany(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch profile
    try {
      const u = await getProfileApi();
      setUser(u);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      // If 401, axios interceptor will handle redirect
    }

    // Fetch company settings (logo etc)
    try {
      const c = await getCompanySettingsApi();
      setCompany(c);
    } catch (err) {
      console.error("Failed to fetch company settings:", err);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refreshIdentity();
  }, [refreshIdentity]);

  const isAdmin = 
    user?.is_superuser || 
    user?.is_staff || 
    user?.role_title?.toLowerCase() === 'admin' || 
    user?.role_title?.toLowerCase() === 'administrator' || 
    user?.role_title?.toLowerCase() === 'super admin';

  return (
    <IdentityContext.Provider value={{ user, company, loading, isAdmin, refreshIdentity }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
}
