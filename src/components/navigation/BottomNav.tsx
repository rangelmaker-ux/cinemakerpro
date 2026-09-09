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

type InteractionMode = 'idle' | 'tap' | 'drag' | 'confirming' | 'navigating';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Ocultar em telas de autenticação e bloqueio
  if (pathname === '/login' || pathname === '/bloqueado') {
    return null;
  }

  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const itemCentersRef = useRef<number[]>([]);

  // Estados visuais
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('idle');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scales, setScales] = useState<number[]>(() => NAV_ITEMS.map(() => 1));
  const [lifts, setLifts] = useState<number[]>(() => NAV_ITEMS.map(() => 0));
  const [isDwellConfirmed, setIsDwellConfirmed] = useState(false);
  const [isUpwardSwipe, setIsUpwardSwipe] = useState(false);

  // Refs de controle de gestos e concorrência
  const touchStartPos = useRef<{ x: number; y: number; time: number; index: number }>({
    x: 0,
    y: 0,
    time: 0,
    index: 0,
  });
  const interactionModeRef = useRef<InteractionMode>('idle');
  const hoveredIndexRef = useRef<number | null>(null);
  const dwellTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rAFIdRef = useRef<number | null>(null);
  const pendingTouchXRef = useRef<number | null>(null);
  const isNavigatingRef = useRef(false);
  const lastNavTimeRef = useRef(0);
  const isUpwardSwipeRef = useRef(false);
  const isDwellConfirmedRef = useRef(false);

  // 1. Atualizar centros dos botões em cache (elimina getBoundingClientRect durante touchmove)
  const updateItemCenters = useCallback(() => {
    if (itemRefs.current.length === 0) return;
    itemCentersRef.current = itemRefs.current.map((el) => {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
  }, []);

  useEffect(() => {
    updateItemCenters();
    window.addEventListener('resize', updateItemCenters, { passive: true });
    window.addEventListener('orientationchange', updateItemCenters, { passive: true });
    return () => {
      window.removeEventListener('resize', updateItemCenters);
      window.removeEventListener('orientationchange', updateItemCenters);
    };
  }, [updateItemCenters]);

  // 2. Limpeza e Reset Completo de Estados de Gestos
  const resetAllGestureStates = useCallback(() => {
    if (rAFIdRef.current !== null) {
      cancelAnimationFrame(rAFIdRef.current);
      rAFIdRef.current = null;
    }
    if (dwellTimeoutRef.current) {
      clearTimeout(dwellTimeoutRef.current);
      dwellTimeoutRef.current = null;
    }

    pendingTouchXRef.current = null;
    hoveredIndexRef.current = null;
    isUpwardSwipeRef.current = false;
    isDwellConfirmedRef.current = false;
    interactionModeRef.current = 'idle';

    setInteractionMode('idle');
    setHoveredIndex(null);
    setIsDwellConfirmed(false);
    setIsUpwardSwipe(false);
    setScales(NAV_ITEMS.map(() => 1));
    setLifts(NAV_ITEMS.map(() => 0));
  }, []);

  // 3. Rota mudou: limpa qualquer resíduo para evitar congelamento entre páginas (Ex: Agenda)
  useEffect(() => {
    isNavigatingRef.current = false;
    resetAllGestureStates();
  }, [pathname, resetAllGestureStates]);

  // 4. Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      if (rAFIdRef.current !== null) cancelAnimationFrame(rAFIdRef.current);
      if (dwellTimeoutRef.current) clearTimeout(dwellTimeoutRef.current);
    };
  }, []);

  // 5. Navegação Imediata e Não-Bloqueante
  const navigateTo = useCallback(
    (targetHref: string) => {
      // Se já estivermos na mesma página, apenas reseta a magnificação
      if (pathname === targetHref) {
        resetAllGestureStates();
        return;
      }

      // Previne disparos repetidos concorrentes (janela de 300ms)
      const now = Date.now();
      if (isNavigatingRef.current && now - lastNavTimeRef.current < 300) {
        return;
      }

      lastNavTimeRef.current = now;
      isNavigatingRef.current = true;
      interactionModeRef.current = 'navigating';
      setInteractionMode('navigating');

      // Feedback tátil sutil
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([10, 30]);
      }

      // Reseta o dock imediatamente antes da navegação para que a próxima tela abra 100% limpa
      resetAllGestureStates();

      // Navega imediatamente via router do Next.js
      router.push(targetHref);
    },
    [pathname, router, resetAllGestureStates]
  );

  // 6. Cálculo Gaussiano Matemático Puro (Zero Reflows)
  const calculateMagnification = useCallback((touchX: number) => {
    const spread = 46; // Largura Gaussiana em px
    const maxScale = 1.65; // Escala máxima no epicentro
    const maxLift = 18; // Elevação vertical em px

    const centers = itemCentersRef.current;
    if (!centers || centers.length !== NAV_ITEMS.length || centers[0] === 0) {
      updateItemCenters();
    }

    let maxFactor = -1;
    let closest = 0;

    const newScales = NAV_ITEMS.map((_, idx) => {
      const centerX = itemCentersRef.current[idx];
      if (!centerX) return 1;
      const distX = Math.abs(touchX - centerX);
      const factor = Math.exp(-(distX * distX) / (2 * spread * spread));
      const scale = 1 + (maxScale - 1) * factor;

      if (factor > maxFactor) {
        maxFactor = factor;
        closest = idx;
      }

      return scale;
    });

    const newLifts = newScales.map((s) => (s - 1) * (maxLift / (maxScale - 1)));

    return { newScales, newLifts, closest };
  }, [updateItemCenters]);

  // 7. Agendamento de Magnificação via requestAnimationFrame (60/120fps sem jank)
  const scheduleMagnificationUpdate = useCallback(
    (touchX: number) => {
      pendingTouchXRef.current = touchX;
      if (rAFIdRef.current !== null) return;

      rAFIdRef.current = requestAnimationFrame(() => {
        rAFIdRef.current = null;
        if (pendingTouchXRef.current === null) return;

        const { newScales, newLifts, closest } = calculateMagnification(pendingTouchXRef.current);
        setScales(newScales);
        setLifts(newLifts);

        if (hoveredIndexRef.current !== closest) {
          hoveredIndexRef.current = closest;
          setHoveredIndex(closest);
          setIsDwellConfirmed(false);
          isDwellConfirmedRef.current = false;

          // Haptic leve ao cruzar para outro ícone
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(5);
          }

          // Reinicia dwell timer (350ms estável)
          if (dwellTimeoutRef.current) clearTimeout(dwellTimeoutRef.current);
          dwellTimeoutRef.current = setTimeout(() => {
            setIsDwellConfirmed(true);
            isDwellConfirmedRef.current = true;
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(15);
            }
          }, 350);
        }
      });
    },
    [calculateMagnification]
  );

  // 8. Início do Toque (Touch Start)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];

    updateItemCenters();

    let initialIdx = 0;
    let minDiff = Infinity;
    itemCentersRef.current.forEach((cx, idx) => {
      const diff = Math.abs(touch.clientX - cx);
      if (diff < minDiff) {
        minDiff = diff;
        initialIdx = idx;
      }
    });

    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      index: initialIdx,
    };

    interactionModeRef.current = 'tap';
    setInteractionMode('tap');
    hoveredIndexRef.current = initialIdx;
    setHoveredIndex(initialIdx);
    isUpwardSwipeRef.current = false;
    isDwellConfirmedRef.current = false;
    setIsUpwardSwipe(false);
    setIsDwellConfirmed(false);

    // Renderiza a proximidade inicial
    scheduleMagnificationUpdate(touch.clientX);

    // Timer de dwell inicial
    if (dwellTimeoutRef.current) clearTimeout(dwellTimeoutRef.current);
    dwellTimeoutRef.current = setTimeout(() => {
      setIsDwellConfirmed(true);
      isDwellConfirmedRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    }, 350);
  };

  // 9. Movimento do Toque (Touch Move)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = touch.clientY - touchStartPos.current.y;

    // Se o movimento horizontal passar de 12px, entramos em modo DRAG
    if (deltaX > 12 && interactionModeRef.current === 'tap') {
      interactionModeRef.current = 'drag';
      setInteractionMode('drag');
    }

    // No modo drag ou confirming, processamos gestos contínuos
    if (interactionModeRef.current === 'drag' || interactionModeRef.current === 'confirming') {
      // Gesto de confirmação para cima (Swipe Upward < -22px)
      if (deltaY < -22 && !isUpwardSwipeRef.current) {
        isUpwardSwipeRef.current = true;
        setIsUpwardSwipe(true);
        interactionModeRef.current = 'confirming';
        setInteractionMode('confirming');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(18);
        }
      } else if (deltaY >= -14 && isUpwardSwipeRef.current) {
        isUpwardSwipeRef.current = false;
        setIsUpwardSwipe(false);
        interactionModeRef.current = 'drag';
        setInteractionMode('drag');
      }

      scheduleMagnificationUpdate(touch.clientX);
    }
  };

  // 10. Final do Toque (Touch End)
  const handleTouchEnd = () => {
    const currentMode = interactionModeRef.current;
    const targetIdx = hoveredIndexRef.current ?? touchStartPos.current.index;
    const targetItem = NAV_ITEMS[targetIdx];

    // REGRA 1: DIRECT TAP SEMPRE VENCE
    // Se o movimento foi pequeno (abaixo de 12px), é um TAP direto! Navega imediatamente.
    if (currentMode === 'tap') {
      if (targetItem) {
        navigateTo(targetItem.href);
        return;
      }
    }

    // REGRA 2: MODO DRAG / CONFIRMING
    // Navega se o usuário confirmou intencionalmente por swipe upward ou permanência (dwell)
    if (currentMode === 'drag' || currentMode === 'confirming') {
      if (isUpwardSwipeRef.current || isDwellConfirmedRef.current) {
        if (targetItem) {
          navigateTo(targetItem.href);
          return;
        }
      }
    }

    // Soltou sem confirmação: restaura repouso suavemente
    resetAllGestureStates();
  };

  // 11. Proteção Global de Window Touch End (impede que gestos fiquem presos se o dedo sair da barra)
  useEffect(() => {
    const handleWindowTouchEnd = () => {
      if (interactionModeRef.current !== 'idle' && interactionModeRef.current !== 'navigating') {
        resetAllGestureStates();
      }
    };

    window.addEventListener('touchend', handleWindowTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleWindowTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchEnd);
    };
  }, [resetAllGestureStates]);

  // 12. Clique Direto Nativo (Suporte a Mouse, Trackpad e Acessibilidade)
  const handleItemClick = (idx: number) => {
    // Se não estiver em modo de arrasto ativo, executa a navegação direta imediatamente
    if (interactionModeRef.current !== 'drag' && interactionModeRef.current !== 'confirming') {
      const item = NAV_ITEMS[idx];
      if (item) {
        navigateTo(item.href);
      }
    }
  };

  // 13. Suporte a Mouse Hover no Desktop / iPad
  const handleMouseMove = (e: React.MouseEvent) => {
    if (interactionModeRef.current !== 'idle') return;
    scheduleMagnificationUpdate(e.clientX);
  };

  const handleMouseLeave = () => {
    if (interactionModeRef.current === 'idle') {
      resetAllGestureStates();
    }
  };

  const isInteracting = interactionMode !== 'idle' && interactionMode !== 'navigating';

  return (
    <nav
      ref={dockRef}
      role="navigation"
      aria-label="Navegação Principal Dock"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetAllGestureStates}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0c10]/95 backdrop-blur-xl border-t border-white/[0.08] select-none touch-none pb-safe"
      style={{ WebkitUserSelect: 'none' }}
    >
      {/* Container Dock com Direção exatamente no centro */}
      <div className="max-w-md mx-auto px-2 pt-1 pb-1.5 flex items-center justify-between relative overflow-visible">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const scale = scales[idx] || 1;
          const lift = lifts[idx] || 0;
          const isHovered = hoveredIndex === idx && isInteracting;
          const isConfirmed = isHovered && (isDwellConfirmed || isUpwardSwipe);

          return (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => handleItemClick(idx)}
              className="flex-1 flex flex-col items-center justify-end relative cursor-pointer outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 bg-transparent border-0 p-0 m-0"
              style={{ minHeight: '52px' }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Elemento Visual Magnificado (transform GPU-friendly sem causar nenhum layout shift) */}
              <div
                className="flex flex-col items-center justify-end pointer-events-none origin-bottom"
                style={{
                  transform: `scale(${scale}) translateY(-${lift}px)`,
                  transition: isInteracting
                    ? 'none'
                    : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
