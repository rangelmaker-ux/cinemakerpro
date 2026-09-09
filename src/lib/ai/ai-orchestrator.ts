import { SharedProjectContext, GeneralDirectorOutput } from './team-types';
import { runGeneralDirector } from './agents/general-director';

/**
 * ORQUESTRADOR DA EQUIPE DE IA CINEMAKER PRO
 * Ponto de entrada unificado para execução da equipe criativa.
 */
export function executeProductionTeamAI(context: SharedProjectContext): GeneralDirectorOutput {
  return runGeneralDirector(context);
}

export * from './team-types';
export * from './agents/script-creator';
export * from './agents/scene-director';
export * from './agents/cinematographer';
export * from './agents/general-director';
export * from './image-execution-layer';
