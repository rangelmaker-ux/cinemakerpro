'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Client,
  Equipment,
  Kit,
  Project,
  Shoot,
  UserProfile,
  UserRole,
  UserStatus,
  SubscriptionTier,
} from '@/types/database';
import {
  INITIAL_CLIENTS,
  INITIAL_EQUIPMENTS,
  INITIAL_KITS,
  INITIAL_PROJECTS,
  INITIAL_SHOOTS,
  INITIAL_USER,
  INITIAL_USERS_DIRECTORY,
} from './initial-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface AppStoreContextType {
  user: UserProfile | null;
  usersDirectory: UserProfile[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoaded: boolean;
  equipments: Equipment[];
  kits: Kit[];
  clients: Client[];
  projects: Project[];
  shoots: Shoot[];
  activeShoot: Shoot | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; status?: UserStatus }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUserAccess: (
    userId: string,
    updates: { status?: UserStatus; is_paid?: boolean; subscription_tier?: SubscriptionTier }
  ) => Promise<void>;
  addEquipment: (eq: Omit<Equipment, 'id'>) => void;
  deleteEquipment: (id: string) => void;
  addKit: (kit: Omit<Kit, 'id'>) => void;
  setDefaultKit: (id: string) => void;
  addClient: (cli: Omit<Client, 'id' | 'created_at'>) => Client;
  updateClient: (id: string, updated: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  updateClientStatus: (id: string, status: Client['status'], nextAction?: string) => void;
  createShoot: (shoot: Omit<Shoot, 'id'>) => Shoot;
  toggleChecklistItem: (shootId: string, checkId: string) => void;
  setActiveShootId: (id: string) => void;
}

const AppStoreContext = createContext<AppStoreContextType | null>(null);

const SESSION_KEY = 'cinemakerpro_active_session_prod';
const DIRECTORY_KEY = 'cinemakerpro_users_directory_prod';

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(INITIAL_USER);
  const [usersDirectory, setUsersDirectory] = useState<UserProfile[]>(INITIAL_USERS_DIRECTORY);
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENTS);
  const [kits, setKits] = useState<Kit[]>(INITIAL_KITS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [shoots, setShoots] = useState<Shoot[]>(INITIAL_SHOOTS);
  const [activeShootId, setActiveShootIdState] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Carregar Sessão e Diretório de Usuários (100% Limpo sem mock data)
  useEffect(() => {
    try {
      const savedDir = localStorage.getItem(DIRECTORY_KEY);
      let directory = INITIAL_USERS_DIRECTORY;
      if (savedDir) {
        const parsed: UserProfile[] = JSON.parse(savedDir);
        // Remove quaisquer usuários de teste anteriores
        directory = parsed.filter(
          (u) =>
            !['lucas.filmes@gmail.com', 'mari.videomaker@outlook.com', 'thiago.cinema@gmail.com'].includes(
              u.email.toLowerCase()
            )
        );
        // Garante que o admin oficial sempre exista
        if (!directory.some((u) => u.email === 'rangelmaker@gmail.com')) {
          directory = [INITIAL_USER, ...directory];
        }
        setUsersDirectory(directory);
      }

      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const parsedUser: UserProfile = JSON.parse(savedSession);
        const freshUser = directory.find((u) => u.id === parsedUser.id || u.email === parsedUser.email);
        setUser(freshUser || parsedUser);
      } else {
        setUser(INITIAL_USER);
      }
    } catch (e) {
      console.error('Erro ao restaurar sessão:', e);
      setUser(INITIAL_USER);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Carregar dados isolados da área de trabalho do usuário
  useEffect(() => {
    if (!user) return;

    const userStorageKey = `cinemakerpro_workspace_prod_${user.id}`;
    try {
      const savedWorkspace = localStorage.getItem(userStorageKey);
      if (savedWorkspace) {
        const parsed = JSON.parse(savedWorkspace);
        if (parsed.equipments) setEquipments(parsed.equipments);
        if (parsed.kits) setKits(parsed.kits);
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.shoots) setShoots(parsed.shoots);
        if (parsed.activeShootId) setActiveShootIdState(parsed.activeShootId);
      } else {
        setEquipments(INITIAL_EQUIPMENTS);
        setKits(INITIAL_KITS);
        setClients([]);
        setProjects([]);
        setShoots([]);
      }
    } catch (e) {
      console.error('Erro ao carregar workspace:', e);
    }
  }, [user?.id]);

  // 3. Salvar alterações no workspace isolado do usuário atual
  useEffect(() => {
    if (!isLoaded || !user) return;
    const userStorageKey = `cinemakerpro_workspace_${user.id}`;
    try {
      localStorage.setItem(
        userStorageKey,
        JSON.stringify({
          equipments,
          kits,
          clients,
          projects,
          shoots,
          activeShootId,
        })
      );
    } catch (e) {
      console.error('Erro ao salvar workspace:', e);
    }
  }, [user?.id, equipments, kits, clients, projects, shoots, activeShootId, isLoaded]);

  // 4. Salvar diretório de usuários
  const saveDirectory = (newDir: UserProfile[]) => {
    setUsersDirectory(newDir);
    try {
      localStorage.setItem(DIRECTORY_KEY, JSON.stringify(newDir));
    } catch (e) {
      console.error('Erro ao salvar diretório:', e);
    }
  };

  // 5. Autenticação: Login
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; status?: UserStatus }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Caso Supabase esteja ativo
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const loggedProfile: UserProfile = profile || {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
            role: cleanEmail === 'rangelmaker@gmail.com' ? 'admin' : 'user',
            status: 'active',
            is_paid: true,
            experience_level: 'profissional',
            frequent_job_types: ['institucional', 'reels'],
            subscription_tier: 'pro',
            google_calendar_connected: false,
            created_at: new Date().toISOString(),
          };

          setUser(loggedProfile);
          localStorage.setItem(SESSION_KEY, JSON.stringify(loggedProfile));
          return { success: true, status: loggedProfile.status };
        }
      } catch (err: any) {
        console.warn('Falha na autenticação via Supabase, tentando local:', err);
      }
    }

    // Validação Local (Admin com senha específica ou usuários do diretório)
    if (cleanEmail === 'rangelmaker@gmail.com') {
      if (password !== '250524.Raj') {
        return { success: false, error: 'Senha incorreta para a conta de administrador.' };
      }
      const adminProfile: UserProfile = {
        id: 'usr-admin-rangel',
        email: 'rangelmaker@gmail.com',
        name: 'Rangel Maker',
        role: 'admin',
        status: 'active',
        is_paid: true,
        experience_level: 'profissional',
        frequent_job_types: ['institucional', 'reels', 'depoimento'],
        subscription_tier: 'studio',
        google_calendar_connected: true,
        created_at: new Date().toISOString(),
      };
      setUser(adminProfile);
      localStorage.setItem(SESSION_KEY, JSON.stringify(adminProfile));
      return { success: true, status: 'active' };
    }

    const existing = usersDirectory.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!existing) {
      return {
        success: false,
        error: 'Nenhuma conta encontrada com este e-mail. Por favor, crie uma conta na aba "Criar Conta".',
      };
    }

    setUser(existing);
    localStorage.setItem(SESSION_KEY, JSON.stringify(existing));
    return { success: true, status: existing.status || 'active' };
  };

  // 6. Autenticação: Cadastro Instantâneo (Sem confirmação de e-mail)
  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isOwner = cleanEmail === 'rangelmaker@gmail.com';

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { name },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const newId = data.user?.id || `usr-${Date.now()}`;
        const newProfile: UserProfile = {
          id: newId,
          email: cleanEmail,
          name: name.trim(),
          role: isOwner ? 'admin' : 'user',
          status: 'active',
          is_paid: true,
          experience_level: 'profissional',
          frequent_job_types: ['institucional', 'reels'],
          subscription_tier: isOwner ? 'studio' : 'pro',
          google_calendar_connected: false,
          created_at: new Date().toISOString(),
        };

        try {
          await supabase.from('users').upsert([newProfile]);
        } catch {}

        setUser(newProfile);
        saveDirectory([...usersDirectory.filter((u) => u.email !== cleanEmail), newProfile]);
        localStorage.setItem(SESSION_KEY, JSON.stringify(newProfile));
        return { success: true };
      } catch (err: any) {
        console.warn('Erro no cadastro Supabase, aplicando local:', err);
      }
    }

    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: name.trim(),
      role: isOwner ? 'admin' : 'user',
      status: 'active',
      is_paid: true,
      experience_level: 'profissional',
      frequent_job_types: ['institucional', 'reels'],
      subscription_tier: isOwner ? 'studio' : 'pro',
      google_calendar_connected: false,
      created_at: new Date().toISOString(),
    };

    setUser(newProfile);
    saveDirectory([...usersDirectory.filter((u) => u.email !== cleanEmail), newProfile]);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newProfile));
    return { success: true };
  };

  // 7. Logout
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // 8. Controle de Acesso pelo Administrador
  const updateUserAccess = async (
    userId: string,
    updates: { status?: UserStatus; is_paid?: boolean; subscription_tier?: SubscriptionTier }
  ) => {
    const updatedDir = usersDirectory.map((u) => {
      if (u.id === userId) {
        return { ...u, ...updates };
      }
      return u;
    });

    saveDirectory(updatedDir);

    if (user && user.id === userId) {
      const updatedSelf = { ...user, ...updates };
      setUser(updatedSelf);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSelf));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').update(updates).eq('id', userId);
      } catch (e) {
        console.error('Erro ao atualizar usuário no Supabase:', e);
      }
    }
  };

  // Métodos de Equipamentos e Kits
  const addEquipment = (eq: Omit<Equipment, 'id'>) => {
    const newEq: Equipment = { ...eq, id: `eq-${Date.now()}`, user_id: user?.id };
    setEquipments((prev) => [...prev, newEq]);
  };

  const deleteEquipment = (id: string) => {
    setEquipments((prev) => prev.filter((e) => e.id !== id));
  };

  const addKit = (kit: Omit<Kit, 'id'>) => {
    const newKit: Kit = { ...kit, id: `kit-${Date.now()}`, user_id: user?.id };
    setKits((prev) => [...prev, newKit]);
  };

  const setDefaultKit = (id: string) => {
    setKits((prev) => prev.map((k) => ({ ...k, is_default: k.id === id })));
  };

  // Métodos de Clientes
  const addClient = (cli: Omit<Client, 'id' | 'created_at'>) => {
    const newCli: Client = {
      ...cli,
      id: `cli-${Date.now()}`,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };
    setClients((prev) => [newCli, ...prev]);
    return newCli;
  };

  const updateClient = (id: string, updated: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const updateClientStatus = (id: string, status: Client['status'], nextAction?: string) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, next_action: nextAction || c.next_action } : c))
    );
  };

  // Métodos de Gravação
  const createShoot = (shoot: Omit<Shoot, 'id'>) => {
    const newShoot: Shoot = {
      ...shoot,
      id: `shoot-${Date.now()}`,
    };
    setShoots((prev) => [newShoot, ...prev]);
    setActiveShootIdState(newShoot.id);
    return newShoot;
  };

  const toggleChecklistItem = (shootId: string, checkId: string) => {
    setShoots((prev) =>
      prev.map((s) => {
        if (s.id !== shootId) return s;
        return {
          ...s,
          checklist_state: s.checklist_state.map((item) =>
            item.id === checkId ? { ...item, done: !item.done } : item
          ),
        };
      })
    );
  };

  const activeShoot = shoots.find((s) => s.id === activeShootId) || shoots[0] || null;
  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user?.role === 'admin' || user?.email === 'rangelmaker@gmail.com');

  return (
    <AppStoreContext.Provider
      value={{
        user,
        usersDirectory,
        isAuthenticated,
        isAdmin,
        isLoaded,
        equipments,
        kits,
        clients,
        projects,
        shoots,
        activeShoot,
        signIn,
        signUp,
        signOut,
        updateUserAccess,
        addEquipment,
        deleteEquipment,
        addKit,
        setDefaultKit,
        addClient,
        updateClient,
        deleteClient,
        updateClientStatus,
        createShoot,
        toggleChecklistItem,
        setActiveShootId: setActiveShootIdState,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore deve ser usado dentro de um AppStoreProvider');
  }
  return ctx;
}
