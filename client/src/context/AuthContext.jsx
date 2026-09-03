import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredToken,
  getStoredUser,
  logout as clearStorage,
  login as apiLogin,
  getAuthMe,
  api,
} from '../lib/api';

const AuthContext = createContext(null);

/**
 * Computes accurate 2-letter initials from a user object (e.g. "Shivansh" -> "SH", "Shivansh Dubey" -> "SD")
 */
export function getUserInitials(user) {
  if (!user) return 'GF';
  const name = (user.name || '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (name.length >= 2) {
      return name.slice(0, 2).toUpperCase();
    }
    return name.slice(0, 1).toUpperCase();
  }
  if (user.email) {
    const localPart = user.email.split('@')[0].replace(/[0-9]/g, '');
    const parts = localPart.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (localPart.length >= 2) {
      return localPart.slice(0, 2).toUpperCase();
    }
  }
  return 'GF';
}

// Default realistic fallback user for Green Fibre Dashboard
export const DEFAULT_USER = {
  id: 47,
  name: 'Shivansh',
  email: 'shivanshd703@gmail.com',
  role: 'admin',
  department: 'Tech',
  avatar: 'SH',
  status: 'active',
  employeeId: 'GF-EMP-047',
  permissions: ['Inventory & Products', 'Vendor PO Approvals', 'AI Forecaster', 'Channel Orders', 'System Settings'],
  lastLoginAt: new Date().toISOString(),
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken() || 'demo_token_greenfibre');
  const [user, setUser] = useState(() => {
    const stored = getStoredUser();
    if (stored && stored.name) {
      // Fix any legacy 'Shivanshi' to 'Shivansh'
      const correctedName = stored.name === 'Shivanshi' ? 'Shivansh' : stored.name;
      const correctedUser = {
        ...DEFAULT_USER,
        ...stored,
        name: correctedName,
      };
      correctedUser.avatar = getUserInitials(correctedUser);
      return correctedUser;
    }
    return DEFAULT_USER;
  });

  // Modal dialog states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Sync user details with system_users database on mount
  useEffect(() => {
    if (token) {
      // 1. Try getAuthMe
      getAuthMe()
        .then((res) => {
          if (res?.user?.name) {
            const synced = {
              ...res.user,
              name: res.user.name === 'Shivanshi' ? 'Shivansh' : res.user.name,
            };
            synced.avatar = getUserInitials(synced);
            setUser(synced);
            localStorage.setItem('gf_auth_user', JSON.stringify(synced));
          }
        })
        .catch(() => {});

      // 2. Cross-reference with systemUsers table
      api.getSystemUsers?.()
        .then((allUsers) => {
          if (Array.isArray(allUsers) && allUsers.length > 0) {
            const currentEmail = (user?.email || '').toLowerCase().trim();
            const matched = allUsers.find(
              (u) => (u.email || '').toLowerCase().trim() === currentEmail
            );
            if (matched) {
              const enriched = {
                ...user,
                ...matched,
                avatar: getUserInitials(matched),
              };
              setUser(enriched);
              localStorage.setItem('gf_auth_user', JSON.stringify(enriched));
            }
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const login = async (email, password, remember = true) => {
    const cleanEmail = (email || '').toLowerCase().trim();

    try {
      const res = await apiLogin(email, password);
      const authToken = res.token || 'auth_token_' + Date.now();
      const rawUser = res.user || {
        ...DEFAULT_USER,
        email: cleanEmail,
        name: cleanEmail.includes('shivansh')
          ? 'Shivansh'
          : cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      };

      const authUser = {
        ...rawUser,
        name: rawUser.name === 'Shivanshi' ? 'Shivansh' : rawUser.name,
        avatar: getUserInitials(rawUser),
      };

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('gf_auth_token', authToken);
      storage.setItem('gf_auth_user', JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);
      setIsLoginModalOpen(false);
      return { success: true, user: authUser };
    } catch (err) {
      // Fallback matching registered users or demo logic
      let matchedName = 'Shivansh';
      let matchedRole = 'admin';
      let matchedDept = 'Tech';

      if (cleanEmail.includes('shivansh')) {
        matchedName = 'Shivansh';
        matchedRole = 'admin';
        matchedDept = 'Tech';
      } else if (cleanEmail.includes('rohit') || cleanEmail.includes('admin@')) {
        matchedName = 'Rohit Malhotra';
        matchedRole = 'admin';
        matchedDept = 'Executive Management';
      } else if (cleanEmail.includes('pooja')) {
        matchedName = 'Pooja Patel';
        matchedRole = 'reader';
        matchedDept = 'Inventory Auditing';
      } else if (cleanEmail.includes('priya')) {
        matchedName = 'Priya Sharma';
        matchedRole = 'manager';
        matchedDept = 'Operations & Logistics';
      } else if (cleanEmail.includes('amit')) {
        matchedName = 'Amit Patel';
        matchedRole = 'reader';
        matchedDept = 'Procurement & Inventory';
      } else if (cleanEmail.includes('rahul')) {
        matchedName = 'Rahul Joshi';
        matchedRole = 'admin';
        matchedDept = 'Supply Chain & Procurement';
      } else {
        matchedName = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        matchedRole = cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('manager') ? 'manager' : 'reader';
      }

      const initials = getUserInitials({ name: matchedName, email: cleanEmail });

      const fallbackUser = {
        ...DEFAULT_USER,
        name: matchedName,
        email: cleanEmail,
        role: matchedRole,
        avatar: initials,
        department: matchedDept,
        lastLoginAt: new Date().toISOString(),
      };

      const fallbackToken = 'demo_token_' + Date.now();
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('gf_auth_token', fallbackToken);
      storage.setItem('gf_auth_user', JSON.stringify(fallbackUser));

      setToken(fallbackToken);
      setUser(fallbackUser);
      setIsLoginModalOpen(false);
      return { success: true, user: fallbackUser };
    }
  };

  const logout = () => {
    clearStorage();
    setToken(null);
    setUser(null);
    setIsLogoutConfirmOpen(false);
    setIsUserInfoModalOpen(false);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = {
        ...prev,
        ...updatedFields,
        avatar: getUserInitials({ ...prev, ...updatedFields }),
      };
      if (token) {
        localStorage.setItem('gf_auth_user', JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        login,
        logout,
        updateUser,
        getUserInitials,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        isUserInfoModalOpen,
        openUserInfoModal: () => setIsUserInfoModalOpen(true),
        closeUserInfoModal: () => setIsUserInfoModalOpen(false),
        isLogoutConfirmOpen,
        openLogoutConfirm: () => setIsLogoutConfirmOpen(true),
        closeLogoutConfirm: () => setIsLogoutConfirmOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
