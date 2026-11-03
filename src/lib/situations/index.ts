import { crayon } from './crayon/crayon';
import { robot } from './robot/robot';
import { suites } from './suites/suites';
import type { Situation } from './types';

export type NomSituation = 'robot' | 'crayon' | 'suites';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const situations: Record<NomSituation, Situation<any, any>> = { robot, crayon, suites };
