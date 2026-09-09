'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/local-store';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isAdmin } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const isAuthRoute = pathname === '/login';
    const isBlockedRoute = pathname === '/bloqueado';
    const isAdminRoute = pathname.startsWith('/admin');

    // 1. Não autenticado -> Redirecionar para /login
    if (!user) {
      if (!isAuthRoute) {
        router.replace('/login');
      }
      return;
    }

    // 2. Usuário logado mas com status pausado ou bloqueado
    if (user.status === 'paused' || user.status === 'blocked') {
      if (!isBlockedRoute) {
        router.replace('/bloqueado');
      }
      return;
    }

    // 3. Usuário ativo tentando acessar /bloqueado ou /login
    if (user.status === 'active' && (isBlockedRoute || isAuthRoute)) {
      router.replace('/');
      return;
    }

    // 4. Acesso a rota administrativa restrito
    if (isAdminRoute && !isAdmin) {
      router.replace('/');
      return;
    }
  }, [user, isLoaded, isAdmin, pathname, router]);

  // Enquanto carrega a sessão inicial
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
          <span className="font-mono text-xs text-zinc-500 tracking-wider uppercase">
            CineMaker Pro
          </span>
        </div>
      </div>
    );
  }

  // 1. Não autenticado
  if (!user) {
    if (pathname === '/login') {
      return <main className="min-h-screen bg-[#090a0f]">{children}</main>;
    }
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  // 2. Usuário com acesso pausado ou bloqueado
  if (user.status === 'paused' || user.status === 'blocked') {
    if (pathname === '/bloqueado') {
      return <main className="min-h-screen bg-[#090a0f]">{children}</main>;
    }
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  // Se estiver redirecionando de /login ou /bloqueado para a home
  if (pathname === '/login' || pathname === '/bloqueado') {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  // 3. Usuário autenticado e ativo: Renderiza a aplicação completa com Sidebar, TopHeader e BottomNav
  return (
    <div className="flex w-full min-h-screen">
      {/* Sidebar (Desktop) */}
      <Sidebar />

      {/* Conteúdo Principal Fluid (Desktop & Mobile) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-background">
        <TopHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
        {/* Bottom Nav (Apenas Mobile) */}
        <BottomNav />
      </div>
    </div>
  );
}
