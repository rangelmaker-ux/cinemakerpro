'use client';

import React from 'react';
import { Equipment } from '@/types/database';
import { Camera, SunMedium, Mic, Layers, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentCardProps {
  equipment: Equipment;
  onDelete?: (id: string) => void;
}

export function EquipmentCard({ equipment, onDelete }: EquipmentCardProps) {
  const getCategoryIcon = () => {
    switch (equipment.category) {
      case 'camera':
        return <Camera className="w-4 h-4 text-sky-400" />;
      case 'lens':
        return <Layers className="w-4 h-4 text-brand-light" />;
      case 'lighting':
        return <SunMedium className="w-4 h-4 text-amber-400" />;
      case 'audio':
        return <Mic className="w-4 h-4 text-emerald-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryLabel = () => {
    switch (equipment.category) {
      case 'camera':
        return 'Câmera';
      case 'lens':
        return 'Lente';
      case 'lighting':
        return 'Iluminação';
      case 'audio':
        return 'Áudio';
      case 'support':
        return 'Suporte / Tripé';
      default:
        return 'Outro';
    }
  };

  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-slate-600 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-surface-border flex items-center justify-center shrink-0">
          {getCategoryIcon()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {getCategoryLabel()}
            </span>
            {equipment.is_favorite && (
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            )}
          </div>
          <h4 className="font-bold text-xs text-white truncate">
            {equipment.brand} {equipment.model}
          </h4>
          {equipment.specs.focal_length && (
            <p className="text-[10px] text-slate-400">
              {equipment.specs.focal_length} • {equipment.specs.aperture}
            </p>
          )}
        </div>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(equipment.id)}
          className="w-8 h-8 rounded-xl bg-surface-raised text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors shrink-0"
          title="Remover equipamento"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
