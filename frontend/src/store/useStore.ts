'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Cart, CartItem } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

interface CartState {
  cart: Cart | null;
  cartCount: number;
  setCart: (cart: Cart | null) => void;
  setCartCount: (count: number) => void;
}

interface AppState extends AuthState, CartState {
  sessionId: string;
  setSessionId: (id: string) => void;
}

// Generate session ID for guest users
const generateSessionId = () => {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
        set({ token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Cart state
      cart: null,
      cartCount: 0,
      setCart: (cart) => set({ cart, cartCount: cart?.items?.length || 0 }),
      setCartCount: (cartCount) => set({ cartCount }),

      // Session
      sessionId: generateSessionId(),
      setSessionId: (sessionId) => set({ sessionId }),
    }),
    {
      name: 'f2r-store',
      partialize: (state) => ({
        token: state.token,
        sessionId: state.sessionId,
        user: state.user,
      }),
    }
  )
);

export default useStore;
