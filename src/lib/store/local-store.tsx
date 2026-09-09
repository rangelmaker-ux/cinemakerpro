'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, Equipment, Kit, Project, Shoot, UserProfile } from '@/types/database';
import {
  INITIAL_CLIENTS,
  INITIAL_EQUIPMENTS,
  INITIAL_KITS,
  INITIAL_PROJECTS,
  INITIAL_SHOOTS,
  INITIAL_USER,
} from './initial-data';

interface AppStoreContextType {
  user: UserProfile;
  equipments: Equipment[];
  kits: Kit[];
  clients: Client[];
  projects: Project[];
  shoots: Shoot[];
  activeShoot: Shoot | null;
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

const STORAGE_KEY = 'cinemakerpro_state_v1';

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENTS);
  const [kits, setKits] = useState<Kit[]>(INITIAL_KITS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [shoots, setShoots] = useState<Shoot[]>(INITIAL_SHOOTS);
  const [activeShootId, setActiveShootIdState] = useState<string>(INITIAL_SHOOTS[0]?.id || '');
  const [loaded, setLoaded] = useState(false);

  // Carregar do localStorage se existir
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) setUser(parsed.user);
        if (parsed.equipments) setEquipments(parsed.equipments);
        if (parsed.kits) setKits(parsed.kits);
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.shoots) setShoots(parsed.shoots);
        if (parsed.activeShootId) setActiveShootIdState(parsed.activeShootId);
      }
    } catch {
      // Usar defaults
    } finally {
      setLoaded(true);
    }
  }, []);

  // Salvar alterações
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          equipments,
          kits,
          clients,
          projects,
          shoots,
          activeShootId,
        })
      );
    } catch {}
  }, [user, equipments, kits, clients, projects, shoots, activeShootId, loaded]);

  const addEquipment = (eq: Omit<Equipment, 'id'>) => {
    const newEq: Equipment = { ...eq, id: `eq-${Date.now()}` };
    setEquipments((prev) => [...prev, newEq]);
  };

  const deleteEquipment = (id: string) => {
    setEquipments((prev) => prev.filter((e) => e.id !== id));
  };

  const addKit = (kit: Omit<Kit, 'id'>) => {
    const newKit: Kit = { ...kit, id: `kit-${Date.now()}` };
    setKits((prev) => [...prev, newKit]);
  };

  const setDefaultKit = (id: string) => {
    setKits((prev) => prev.map((k) => ({ ...k, is_default: k.id === id })));
  };

  const addClient = (cli: Omit<Client, 'id' | 'created_at'>) => {
    const newCli: Client = {
      ...cli,
      id: `cli-${Date.now()}`,
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

  return (
    <AppStoreContext.Provider
      value={{
        user,
        equipments,
        kits,
        clients,
        projects,
        shoots,
        activeShoot,
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
