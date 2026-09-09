import { GeneralDirectorOutput, SharedProjectContext, VisualDirectionData, TakePlanItem, ScriptScene } from '../team-types';
import { runScriptCreator } from './script-creator';
import { runSceneDirector } from './scene-director';
import { runCinematographer } from './cinematographer';

/**
 * DIRETOR GERAL (GeneralDirector)
 * O maestro e tomador final de decisões criativas.
 * - Coordena Criador de Roteiro, Diretor de Cena e Diretor de Fotografia.
 * - Detecta contradições entre especialistas.
 * - Aplica a Hierarquia de Prioridades (Objetivo do Projeto > Viabilidade Prática > Fotografia > Estética).
 * - Sintetiza o Plano Mestre de Produção e gera os dados estruturados de direção visual.
 * - Suporta refinamento e regeneração iterativa.
 * - 100% em Português Brasileiro.
 */
export function runGeneralDirector(context: SharedProjectContext): GeneralDirectorOutput {
  // PASSO 1: Criador de Roteiro desenvolve a narrativa estratégica
  const scriptOutput = runScriptCreator(context);

  // PASSO 2: Diretor de Cena interpreta a narrativa em movimentação e bloqueio de pessoas
  const sceneOutput = runSceneDirector(context, scriptOutput);

  // PASSO 3: Diretor de Fotografia adapta câmeras, lentes do kit real e setup de luz
  const photoOutput = runCinematographer(context, scriptOutput, sceneOutput);

  // PASSO 4: Resolução de Conflitos e Prioridades
  const conflictResolutions: GeneralDirectorOutput['conflict_resolutions'] = [];

  // Exemplo de conflito: Se a luz e o movimento do personagem competem pelo mesmo espaço
  if (sceneOutput.subject_position.distance_from_background_m < 1.5) {
    conflictResolutions.push({
      conflict: 'O sujeito estava inicialmente muito próximo da parede de fundo, o que causaria sombra indesejada e achatamento de profundidade.',
      resolution: 'Diretor Geral ajustou a marcação para exatamente 1,5m de recuo da parede, garantindo separação visual cinematográfica.',
      priority_applied: 'Viabilidade Prática e Linguagem Visual (Prioridade 4 e 6)',
    });
  }

  // PASSO 5: Estruturar os Dados de Direção Visual (Section 37 do Master Prompt)
  const visualDirectionData: VisualDirectionData = {
    subject: {
      position: sceneOutput.subject_position.description,
      distance_from_background_m: sceneOutput.subject_position.distance_from_background_m,
      body_orientation: sceneOutput.body_orientation,
      eyeline: sceneOutput.eye_line,
    },
    camera: {
      position: photoOutput.camera.position,
      distance_m: photoOutput.camera.distance_m,
      height_m: photoOutput.camera.height_m,
      angle_deg: photoOutput.camera.angle_deg,
      shot_type: photoOutput.framing.shot_type,
      framing: photoOutput.framing.composition_rules,
    },
    lens: {
      model: photoOutput.lens.model,
      focal_length_mm: photoOutput.lens.focal_length_mm,
      recommended_aperture: photoOutput.camera.settings.aperture,
      shutter_speed: photoOutput.camera.settings.shutter,
      iso_note: photoOutput.camera.settings.iso,
      reasoning: photoOutput.lens.choice_reason,
    },
    lighting: {
      key: {
        position: `Lateral ${photoOutput.lighting.key_light.side === 'left' ? 'Esquerda' : 'Direita'} a 45°`,
        side: photoOutput.lighting.key_light.side,
        angle_deg: photoOutput.lighting.key_light.angle_deg,
        height: photoOutput.lighting.key_light.height,
        modifier: photoOutput.lighting.key_light.modifier,
        distance_to_wall_m: photoOutput.lighting.key_light.distance_to_wall_m,
        color_temp: photoOutput.lighting.key_light.color_temp,
        intensity_pct: 85,
        purpose: 'Modelagem tridimensional dos traços faciais mantendo catchlight vivo nos olhos.',
      },
      fill: photoOutput.lighting.fill_light
        ? {
            position: 'Lado oposto à luz principal',
            type: photoOutput.lighting.fill_light.method,
            intensity_pct: 30,
          }
        : undefined,
      rim: photoOutput.lighting.rim_light
        ? {
            position: photoOutput.lighting.rim_light.position,
            distance_to_wall_m: photoOutput.lighting.rim_light.distance_to_wall_m,
            color_temp: '5600K',
            purpose: 'Contorno dos ombros e separação do ambiente de fundo.',
          }
        : undefined,
      ambient: {
        recommendation: 'Desligar lâmpadas de teto comuns (fluorescentes) que causam sombras duras sob os olhos e misturam temperaturas de cor.',
      },
    },
    depth: {
      subject_to_wall_clearance_m: photoOutput.depth.subject_background_distance_m,
      layering_notes: photoOutput.depth.separation_strategy,
      separation_method: 'Recuo físico de 1,5m da parede de fundo + contraste de luz de recorte.',
    },
    audio: {
      mic_model: context.audio[0]?.model || 'Microfone Lapela Sem Fio',
      position: 'Cápsula posicionada a 15cm da boca (altura do osso esterno), apontada para cima.',
      recommendation: 'Testar atrito com tecidos sintéticos antes de rodar o take; verificar ganho em -12dB a -6dB.',
    },
  };

  // PASSO 6: Gerar Plano Operacional de Takes (Section 47 do Master Prompt)
  const takes: TakePlanItem[] = scriptOutput.scenes.map((s: ScriptScene, idx: number) => ({
    sceneNumber: s.sceneNumber,
    takeNumber: idx + 1,
    title: s.sceneName,
    framing: s.shotType,
    cameraMovement: idx === 0 ? 'Estático com respiro' : 'Leve push-in lento de 5%',
    durationSec: s.durationSec,
    description: `Ação: ${s.action} | Fala: "${s.dialogue.slice(0, 70)}..."`,
    equipmentNeeded: `${photoOutput.lens.model} • ${photoOutput.lighting.key_light.equipment_used}`,
    isDone: false,
  }));

  // Adicionar take específico de B-Roll
  takes.push({
    sceneNumber: scriptOutput.scenes.length + 1,
    takeNumber: scriptOutput.scenes.length + 1,
    title: 'CENA B-ROLL — DETALHES DE AMBIENTE & PRODUTO',
    framing: 'Plano Detalhe / Macro',
    cameraMovement: 'Pan lateral lento em 60fps',
    durationSec: 15,
    description: 'Captação de texturas, mãos trabalhando, tela de resultados e reações para dinamizar a edição.',
    equipmentNeeded: `${photoOutput.lens.model} em f/2.0`,
    isDone: false,
  });

  return {
    agent: 'general_director',
    language: 'pt-BR',
    project_summary: {
      title: context.project.title || 'Produção Audiovisual CineMaker Pro',
      client: context.client.name || 'Cliente',
      objective: context.briefing.objective || 'Apresentação de Alto Impacto',
      tone: context.briefing.tone || 'Profissional e Humano',
      format: context.format || '16:9',
    },
    creative_direction: {
      executive_summary: `A equipe de criação desenhou uma estratégia orientada à retenção e verdade visual. O roteiro evita chavões corporativos, colocando o personagem em destaque com posicionamento a 1,5m da parede de fundo e iluminação principal a 45° calibrada para o seu equipamento real.`,
      narrative_thesis: scriptOutput.narrative_strategy,
      visual_thesis: `Fotografia em ${photoOutput.lens.focal_length_mm}mm (${photoOutput.lens.model}) com iluminação tridimensional suave que valoriza o espaço sem exigir estúdio caro.`,
      acting_thesis: sceneOutput.performance_notes[0],
    },
    conflict_resolutions: conflictResolutions,
    script_direction: scriptOutput,
    scene_direction: sceneOutput,
    cinematography_direction: photoOutput,
    visual_direction_data: visualDirectionData,
    takes: takes,
    warnings: [
      'Garanta que a pessoa fique a pelo menos 1,5m de distância da parede de fundo para não colar a silhueta no cenário.',
      'Desligue aparelhos de ar-condicionado e geladeiras no ambiente durante a gravação das falas.',
      'Confira o cartão de memória e mantenha baterias reservas sempre carregadas.',
    ],
    alternatives: [
      {
        option_name: 'Opção B — Espaço Reduzido (Sala Pequena)',
        description: 'Se o cômodo tiver menos de 3 metros de profundidade, posicione a câmera em ângulo diagonal aproveitando o canto da sala como ponto de fuga.',
        adjustments: 'Lente 24mm ou 28mm, recuo mínimo de 1,0m da parede com iluminação mais rasante.',
      },
      {
        option_name: 'Opção C — Iluminação Única (Luz Rápida)',
        description: 'Se você estiver com apenas 1 tripé de iluminação disponível no set.',
        adjustments: 'Posicione a luz principal a 45° e use a parede clara oposta como rebatedor natural de preenchimento.',
      },
    ],
    version: 1,
  };
}
