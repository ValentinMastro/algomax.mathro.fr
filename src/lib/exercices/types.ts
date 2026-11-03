import type { Pile } from '$lib/blocs/types';
import type { ConfigCrayon } from '$lib/situations/crayon/crayon';
import type { ConfigRobot } from '$lib/situations/robot/robot';
import type { ConfigSuites } from '$lib/situations/suites/suites';

interface ExerciceBase {
	id: string;
	titre: string;
	/** Consigne, en texte simple (les `**gras**` sont rendus). */
	consigne: string;
	/** Types de blocs proposés dans la palette. */
	blocs: string[];
	/** Variables disponibles (situations avec variables). */
	variables?: string[];
	/** Nombre maximal de blocs d'instruction autorisés. */
	maxBlocs?: number;
	/** Programme proposé au départ (sinon : le seul bloc « quand ▶ est cliqué »). */
	programmeInitial?: Pile[];
	indice: string;
	/** Programme de référence, vérifié par les tests. */
	solution: Pile[];
}

export type Exercice = ExerciceBase &
	(
		| { situation: 'robot'; config: ConfigRobot }
		| { situation: 'crayon'; config: ConfigCrayon }
		| { situation: 'suites'; config: ConfigSuites }
	);

export interface Sequence {
	id: string;
	titre: string;
	/** Notion travaillée, pour l'enseignant. */
	theme: string;
	exercices: Exercice[];
}

export interface Niveau {
	id: string;
	titre: string;
	sequences: Sequence[];
}
