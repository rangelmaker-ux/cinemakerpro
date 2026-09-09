'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Clapperboard,
  Crosshair,
  Calendar,
  Layers,
  Users,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'inicio', href: '/', label: 'Início', icon: LayoutGrid },
  { id: 'diarias', href: '/gravacoes', label: 'Diárias', icon: Clapperboard },
  { id: 'direcao', href: '/diretor', label: 'Direção', icon: Crosshair },
  { id: 'agenda', href: '/agenda', label: 'Agenda', icon: Calendar },
  { id: 'kits', href: '/equipamentos', label: 'Kits', icon: Layers },
  { id: 'clientes', href: '/clientes', label: 'Clientes', icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Ocultar em telas de autenticação e bloqueio
  if (pathname === '/login' || pathname === '/bloqueado') {
    return null;
  }

  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Estados de rastreamento de toque e magnificação
  const [isTouching, setIsTouching] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scales, setScales] = useState<number[]>(() => NAV_ITEMS.map(() => 1));
  const [lifts, setLifts] = useState<number[]>(() => NAV_ITEMS.map(() => 0));
  const [isDwellConfirmed, setIsDwellConfirmed] = useState(false);
  const [isUpwardSwipe, setIsUpwardSwipe] = useState(false);

  // Refs para controle fino de gestos
  const touchStartPos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const dwellTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentHoverRef = useRef<number | null>(null);
  const isSwipeRef = useRef(false);

  // Calcula magnificação Gaussiana inspirada no macOS Dock adaptada para touchscreen
  const calculateMagnification = useCallback((touchX: number) => {
    const spread = 46; // Largura de dispersão Gaussiana em pixels
    const maxScale = 1.65; // Escala máxima no epicentro do toque
    const maxLift = 20; // Elevação vertical máxima em pixels

    const newScales = NAV_ITEMS.map((_, idx) => {
      const el = itemRefs.current[idx];
      if (!el) return 1;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const distX = Math.abs(touchX - centerX);

      // Curva Gaussiana: f(x) = exp(- (x^2) / (2 * spread^2))
      const factor = Math.exp(-(distX * distX) / (2 * spread * spread));
      return 1 + (maxScale - 1) * factor;
    });

    const newLifts = newScales.map((s) => (s - 1) * (maxLift / (maxScale - 1)));

    // Determina o item com maior aproximação
    let maxFactor = -1;
    let closest = 0;
    newScales.forEach((s, idx) => {
      if (s > maxFactor) {
        maxFactor = s;
        closest = idx;
      }
    });

    setScales(newScales);
    setLifts(newLifts);

    return closest;
  }, []);

  // Reinicia magnificação para repouso (1.0x) com transição elástica suave
  const resetMagnification = useCallback(() => {
    setIsTouching(false);
    setHoveredIndex(null);
    currentHoverRef.current = null;
    setIsDwellConfirmed(false);
    setIsUpwardSwipe(false);
    isSwipeRef.current = false;
    setScales(NAV_ITEMS.map(() => 1));
    setLifts(NAV_ITEMS.map(() => 0));

    if (dwellTimeoutRef.current) {
      clearTimeout(dwellTimeoutRef.current);
      dwellTimeoutRef.current = null;
    }
  }, []);

  // Início do Toque (Touch Start)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isSwipeRef.current = false;
    setIsUpwardSwipe(false);
    setIsDwellConfirmed(false);
    setIsTouching(true);

    const closest = calculateMagnification(touch.clientX);
    setHoveredIndex(closest);
    currentHoverRef.current = closest;

    // Feedback tátil sutil
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }

    // Timer de confirmação por permanência (Dwell ~400ms)
    if (dwellTimeoutRef.current) clearTimeout(dwellTimeoutRef.current);
    dwellTimeoutRef.current = setTimeout(() => {
      setIsDwellConfirmed(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    }, 400);
  };

  // Movimento do Toque (Touch Move / Scrub Horizontal + Swipe Vertical)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartPos.current.y;

    // Detecção de Swipe Upward (arrastar 20-40px para cima)
    if (deltaY < -24 && !isSwipeRef.current) {
      isSwipeRef.current = true;
      setIsUpwardSwipe(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(18);
      }
    } else if (deltaY >= -15 && isSwipeRef.current) {
      isSwipeRef.current = false;
      setIsUpwardSwipe(false);
    }

    const closest = calculateMagnification(touch.clientX);

    // Se o dedo deslizou para outro ícone, reinicia o timer de dwell
    if (closest !== currentHoverRef.current) {
      currentHoverRef.current = closest;
      setHoveredIndex(closest);
      setIsDwellConfirmed(false);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(5);
      }

      if (dwellTimeoutRef.current) clearTimeout(dwellTimeoutRef.current);
      dwellTimeoutRef.current = setTimeout(() => {
        setIsDwellConfirmed(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
        }
      }, 400);
    }
  };

  // Final do Toque (Touch End)
  const handleTouchEnd = () => {
    const targetIdx = currentHoverRef.current;
    const duration = Date.now() - touchStartPos.current.time;
    const wasQuickTap = duration < 240 && !isSwipeRef.current;

    // Navega se:
    // 1. O usuário deu swipe para cima (20-40px)
    // 2. O usuário manteve o dedo por mais de ~400ms (dwell confirmed)
    // 3. O usuário deu um toque rápido comum (quick tap sem arrastar)
    const shouldNavigate = isSwipeRef.current || isDwellConfirmed || wasQuickTap;

    if (shouldNavigate && targetIdx !== null && NAV_ITEMS[targetIdx]) {
      const targetItem = NAV_ITEMS[targetIdx];
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([12, 40, 20]);
      }
      router.push(targetItem.href);
    }

    // Se soltou sem swipe e sem dwell (apenas deslizando de curiosidade),
    // retorna suavemente para a escala normal sem trocar de tela!
    resetMagnification();
  };

  // Suporte complementar a mouse hover no desktop / iPad
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTouching) return;
    const closest = calculateMagnification(e.clientX);
    setHoveredIndex(closest);
  };

  return (
    <nav
      ref={dockRef}
      role="navigation"
      aria-label="Navegação Principal Dock"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetMagnification}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetMagnification}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0c10]/95 backdrop-blur-xl border-t border-white/[0.08] select-none touch-none pb-safe"
      style={{ WebkitUserSelect: 'none' }}
    >
      {/* Container Dock com espaçamento estrito e Direção no centro */}
      <div className="max-w-md mx-auto px-2 pt-1 pb-1.5 flex items-center justify-between relative overflow-visible">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const scale = scales[idx] || 1;
          const lift = lifts[idx] || 0;
          const isHovered = hoveredIndex === idx && isTouching;
          const isConfirmed = isHovered && (isDwellConfirmed || isUpwardSwipe);

          return (
            <div
              key={item.id}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className="flex-1 flex flex-col items-center justify-end relative"
              style={{ minHeight: '52px' }}
            >
              {/* Elemento Visual Magnificado (transform sem causar nenhum layout shift) */}
              <div
                className="flex flex-col items-center justify-end pointer-events-none origin-bottom"
                style={{
                  transform: `scale(${scale}) translateY(-${lift}px)`,
                  transition: isTouching
                    ? 'none'
                    : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  willChange: 'transform',
                }}
              >
                {/* Indicador de Confirmação de Swipe Upward */}
                {isHovered && isUpwardSwipe && (
                  <div className="absolute -top-5 flex items-center justify-center text-amber-400 animate-bounce">
                    <ChevronUp className="w-4 h-4 drop-shadow-md" />
                  </div>
                )}

                {/* Ícone / Botão — Dimensões e aparência de repouso rigorosamente iguais para todos os 6 itens */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl relative flex items-center justify-center transition-colors duration-150',
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-zinc-400 hover:text-zinc-200',
                    // Feedback visual durante confirmação de toque
                    isConfirmed && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0a0c10]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'
                    )}
                  />

                  {/* Ponto indicador sutil de rota ativa */}
                  {isActive && (
                    <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white/70 shadow-xs" />
                  )}

                  {/* Ponto pulsante ao confirmar por dwell durante o toque */}
                  {isHovered && isDwellConfirmed && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>

                {/* Rótulo de Texto com tipografia uniforme e baseline idêntica */}
                <span
                  className={cn(
                    'text-[10px] font-mono tracking-tight mt-0.5 whitespace-nowrap leading-none transition-colors duration-150',
                    isActive ? 'text-white font-medium' : 'text-zinc-500',
                    isConfirmed && 'text-amber-300 font-bold'
                  )}
                >
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
