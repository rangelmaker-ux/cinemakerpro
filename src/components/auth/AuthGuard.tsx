'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/local-store';

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

  // Rotas que não devem exibir a casca padrão completa (login / bloqueado)
  const isPlainRoute = pathname === '/login' || pathname === '/bloqueado';

  return <>{children}</>;
}
