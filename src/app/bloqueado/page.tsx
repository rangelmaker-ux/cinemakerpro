'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/local-store';
import { ShieldAlert, RefreshCw, LogOut, MessageCircle, Lock } from 'lucide-react';

export default function BloqueadoPage() {
  const router = useRouter();
  const { user, signOut } = useAppStore();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const whatsappMessage = encodeURIComponent(
    `Olá Rangel, sou o videomaker ${user?.name || ''} (${user?.email || ''}) e gostaria de regularizar meu acesso ao CineMaker Pro.`
  );
  const whatsappUrl = `https://wa.me/5561999999999?text=${whatsappMessage}`;

  return (
    <div className="w-full flex items-center justify-center py-6">
      <div className="w-full max-w-lg bg-[#0f1117] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/90 space-y-6 text-center mx-auto">
        {/* Ícone de Alerta */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>

        {/* Título & Mensagem */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Acesso Restrito
          </span>
          <h1 className="text-xl font-bold text-white">
            Assinatura Temporariamente Pausada
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            Identificamos uma pendência na assinatura da sua conta do{' '}
            <strong className="text-zinc-200">CineMaker Pro</strong>. Suas diárias de gravação,
            clientes e inventário continuam seguros, mas estão bloqueados para edição até a
            regularização.
          </p>
        </div>

        {/* Detalhes da Conta */}
        <div className="p-4 bg-black/40 border border-white/[0.06] rounded-xl text-left text-xs space-y-1.5 font-mono">
          <div className="flex justify-between text-zinc-400">
            <span>Usuário:</span>
            <span className="text-white font-medium">{user?.name || 'Não identificado'}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>E-mail:</span>
            <span className="text-white">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Status do Acesso:</span>
            <span className="text-amber-400 uppercase font-semibold">
              {user?.status === 'blocked' ? 'Bloqueado' : 'Pausado por Pagamento'}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-2.5 pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.99]"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Falar com Administrador via WhatsApp</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-xs font-medium text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Verificar Novamente</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-xs font-medium text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span>Trocar de Conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
