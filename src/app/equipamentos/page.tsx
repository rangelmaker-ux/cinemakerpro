'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/local-store';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { KitCard } from '@/components/equipment/KitCard';
import { Camera, Plus, Briefcase, Layers, X, Check } from 'lucide-react';
import { EquipmentCategory } from '@/types/database';
import { cn } from '@/lib/utils';

export default function EquipamentosPage() {
  const { equipments, kits, addEquipment, deleteEquipment, addKit, setDefaultKit } = useAppStore();

  const [activeTab, setActiveTab] = useState<'kits' | 'equipamentos'>('kits');
  const [isAddEqOpen, setIsAddEqOpen] = useState(false);
  const [isAddKitOpen, setIsAddKitOpen] = useState(false);

  // Form states de Equipamento
  const [category, setCategory] = useState<EquipmentCategory>('camera');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [focalLength, setFocalLength] = useState('');
  const [aperture, setAperture] = useState('');

  // Form states de Kit
  const [kitName, setKitName] = useState('');
  const [selectedEqIds, setSelectedEqIds] = useState<string[]>([]);

  const handleCreateEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) return;

    addEquipment({
      category,
      brand: brand.trim(),
      model: model.trim(),
      specs: {
        focal_length: focalLength.trim() || undefined,
        aperture: aperture.trim() || undefined,
      },
      is_favorite: true,
    });

    setBrand('');
    setModel('');
    setFocalLength('');
    setAperture('');
    setIsAddEqOpen(false);
  };

  const handleCreateKit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitName.trim()) return;

    addKit({
      name: kitName.trim(),
      is_default: kits.length === 0,
      equipment_ids: selectedEqIds,
    });

    setKitName('');
    setSelectedEqIds([]);
    setIsAddKitOpen(false);
  };

  const toggleSelectEqForKit = (id: string) => {
    setSelectedEqIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-light" />
            <span>Kits & Equipamentos</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            A IA só recomenda o que você realmente possui
          </p>
        </div>

        <button
          type="button"
          onClick={() => (activeTab === 'kits' ? setIsAddKitOpen(true) : setIsAddEqOpen(true))}
          className="py-2 px-3 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-brand/20 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'kits' ? 'Criar Kit' : 'Novo Item'}</span>
        </button>
      </div>

      {/* Tabs: Kits vs Equipamentos */}
      <div className="grid grid-cols-2 gap-1.5 bg-surface p-1 rounded-2xl border border-surface-border">
        <button
          type="button"
          onClick={() => setActiveTab('kits')}
          className={cn(
            'py-2 px-2 rounded-xl text-center text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5',
            activeTab === 'kits'
              ? 'bg-brand text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-surface-raised'
          )}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Kits Salvos ({kits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipamentos')}
          className={cn(
            'py-2 px-2 rounded-xl text-center text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5',
            activeTab === 'equipamentos'
              ? 'bg-brand text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-surface-raised'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Inventário ({equipments.length})</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA: KITS */}
      {activeTab === 'kits' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-brand/10 border border-brand/25 rounded-2xl text-xs text-brand-light leading-relaxed">
            💡 <strong>Kit Padrão Inteligente:</strong> O kit selecionado como padrão é carregado automaticamente pela IA ao iniciar uma nova gravação, recomendando as distâncias focais e luzes exatas que você possui.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kits.map((kit) => (
              <KitCard
                key={kit.id}
                kit={kit}
                allEquipments={equipments}
                onSetDefault={setDefaultKit}
              />
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: EQUIPAMENTOS */}
      {activeTab === 'equipamentos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {equipments.map((eq) => (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              onDelete={deleteEquipment}
            />
          ))}
        </div>
      )}

      {/* MODAL: NOVO EQUIPAMENTO */}
      {isAddEqOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleCreateEquipment}
            className="w-full max-w-md bg-surface border border-surface-border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h3 className="font-bold text-sm text-white">Cadastrar Equipamento</h3>
              <button
                type="button"
                onClick={() => setIsAddEqOpen(false)}
                className="w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
              >
                <option value="camera">Câmera</option>
                <option value="lens">Lente</option>
                <option value="lighting">Iluminação / LED</option>
                <option value="audio">Microfone / Áudio</option>
                <option value="support">Tripé / Gimbal / Suporte</option>
                <option value="custom">Outro</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sony, Amaran"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: A7 IV, 35mm"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {category === 'lens' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Distância Focal
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 35mm, 24-70mm"
                    value={focalLength}
                    onChange={(e) => setFocalLength(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Abertura Máxima
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: f/1.8, f/2.8"
                    value={aperture}
                    onChange={(e) => setAperture(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddEqOpen(false)}
                className="flex-1 py-2.5 bg-surface-raised text-slate-300 font-bold text-xs rounded-xl border border-surface-border"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Adicionar Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NOVO KIT */}
      {isAddKitOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleCreateKit}
            className="w-full max-w-md max-h-[85vh] bg-surface border border-surface-border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h3 className="font-bold text-sm text-white">Montar Novo Kit de Gravação</h3>
              <button
                type="button"
                onClick={() => setIsAddKitOpen(false)}
                className="w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Nome do Kit *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Kit Podcast, Kit Evento Noturno"
                value={kitName}
                onChange={(e) => setKitName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <label className="text-[11px] font-bold text-slate-400 block mb-2">
                Selecione os equipamentos que compõem este kit:
              </label>
              <div className="space-y-1.5">
                {equipments.map((eq) => {
                  const isSelected = selectedEqIds.includes(eq.id);
                  return (
                    <div
                      key={eq.id}
                      onClick={() => toggleSelectEqForKit(eq.id)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all',
                        isSelected
                          ? 'bg-brand/15 border-brand/40 text-white'
                          : 'bg-surface-raised border-surface-border text-slate-400'
                      )}
                    >
                      <span className="font-medium">
                        {eq.brand} {eq.model}
                      </span>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-md flex items-center justify-center',
                          isSelected ? 'bg-brand text-white' : 'border border-slate-600'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setIsAddKitOpen(false)}
                className="flex-1 py-2.5 bg-surface-raised text-slate-300 font-bold text-xs rounded-xl border border-surface-border"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Salvar Kit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
