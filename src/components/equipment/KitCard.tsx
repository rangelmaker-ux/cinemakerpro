'use client';

import React from 'react';
import { Kit, Equipment } from '@/types/database';
import { Briefcase, CheckCircle2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KitCardProps {
  kit: Kit;
  allEquipments: Equipment[];
  onSetDefault: (id: string) => void;
}

export function KitCard({ kit, allEquipments, onSetDefault }: KitCardProps) {
  const kitItems = allEquipments.filter((e) => kit.equipment_ids.includes(e.id));

  return (
    <div
      className={cn(
        'border rounded-2xl p-4 transition-all',
        kit.is_default
          ? 'bg-brand/10 border-brand/40 shadow-lg shadow-brand/10'
          : 'bg-surface border-surface-border hover:border-slate-600'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center',
              kit.is_default ? 'bg-brand text-white' : 'bg-surface-raised text-slate-400'
            )}
          >
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white leading-tight">{kit.name}</h3>
            <p className="text-[10px] text-slate-400">{kitItems.length} itens incluídos</p>
          </div>
        </div>

        {kit.is_default ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-brand-light bg-brand/20 border border-brand/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>Kit Padrão</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSetDefault(kit.id)}
            className="text-[10px] font-semibold text-slate-400 hover:text-white bg-surface-raised px-2 py-1 rounded-lg border border-surface-border transition-colors"
          >
            Tornar Padrão
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {kitItems.map((item) => (
          <span
            key={item.id}
            className="bg-surface-raised text-slate-300 text-[10px] px-2 py-0.5 rounded-md border border-surface-border/60"
          >
            {item.brand} {item.model}
          </span>
        ))}
      </div>
    </div>
  );
}
