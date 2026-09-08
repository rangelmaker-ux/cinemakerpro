'use client';

import React from 'react';
import Link from 'next/link';
import { Client } from '@/types/database';
import { Phone, Calendar, ArrowRight, Video, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientCardProps {
  client: Client;
  onStatusChange?: (id: string, newStatus: Client['status']) => void;
}

export function ClientCard({ client }: ClientCardProps) {
  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'fechado':
        return { label: 'Fechado / Em Produção', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'orcamento':
        return { label: 'Orçamento Enviado', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'pos_venda':
        return { label: 'Pós-Venda / Follow-up', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      case 'lead':
      default:
        return { label: 'Lead / Primeiro Contato', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
    }
  };

  const badge = getStatusBadge(client.status);

  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-4 shadow-md transition-all hover:border-slate-600">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-bold text-sm text-white leading-tight">{client.name}</h3>
          {client.company && (
            <p className="text-[11px] text-slate-400">{client.company}</p>
          )}
        </div>
        <span
          className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap',
            badge.color
          )}
        >
          {badge.label}
        </span>
      </div>

      {client.notes && (
        <p className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed">
          {client.notes}
        </p>
      )}

      {/* Próxima Ação em destaque */}
      {client.next_action && (
        <div className="bg-surface-raised border border-surface-border/80 rounded-xl p-2.5 mb-3 flex items-start gap-2">
          <Calendar className="w-3.5 h-3.5 text-brand-light shrink-0 mt-0.5" />
          <div className="text-[11px]">
            <span className="text-slate-400 block font-semibold text-[9px] uppercase tracking-wider">
              Próxima Ação:
            </span>
            <span className="text-slate-200 font-medium">{client.next_action}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-surface-border gap-2">
        {client.phone ? (
          <a
            href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-surface-raised px-3 py-1.5 rounded-xl border border-surface-border transition-colors active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </a>
        ) : (
          <div />
        )}

        <Link
          href={`/diretor?client_id=${client.id}`}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-brand hover:bg-brand-hover px-3 py-1.5 rounded-xl shadow-md shadow-brand/20 transition-all active:scale-95"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Iniciar Gravação</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
