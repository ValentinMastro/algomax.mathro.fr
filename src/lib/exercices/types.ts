import type { Alea } from '$lib/alea';
import type { Pile } from '$lib/blocs/types';
import type { ConfigCrayon } from '$lib/situations/crayon/crayon';
import type { ConfigRobot } from '$lib/situations/robot/robot';
import type { ConfigSuites } from '$lib/situations/suites/suites';

interface ExerciceBase {
	id: string;
	titre: string;
	/** Types de blocs proposés dans la palette. */
	blocs: string[];
	/** Variables disponibles (situations avec variables). */
	variables?: string[];
}

/** Ce qui change d'une version à l'autre d'un exercice. */
interface Contenu {
	/** Consigne, en texte simple (les `**gras**` sont rendus). */
	consigne: string;
	/** Nombre maximal de blocs d'instruction autorisés. */
	maxBlocs?: number;
	/** Programme proposé au départ (sinon : le seul bloc « quand ▶ est cliqué »). */
	programmeInitial?: Pile[];
	indice: string;
	/** Programme de référence, vérifié par les tests. */
	solution: Pile[];
}

export type Enonce = Contenu &
	(
		| { situation: 'robot'; config: ConfigRobot }
		| { situation: 'crayon'; config: ConfigCrayon }
		| { situation: 'suites'; config: ConfigSuites }
	);

export type NomSituation = Enonce['situation'];

/** Une version jouable d'un exercice. */
export type Exercice = ExerciceBase & Enonce;

/** Exercice tel qu'il est défini : il fabrique ses versions à partir d'un tirage. */
export interface ModeleExercice extends ExerciceBase {
	situation: NomSituation;
	/**
	 * Fabrique une version de l'exercice. Le tirage `a` est le seul hasard
	 * autorisé (déterminisme). Renvoyer `null` fait recommencer avec un autre tirage.
	 */
	enonce: (a: Alea) => Enonce | null;
	/** Exercice sans variantes : une seule réussite suffit à le valider. */
	fixe?: boolean;
}

export interface Sequence {
	id: string;
	titre: string;
	/** Notion travaillée, pour l'enseignant. */
	theme: string;
	exercices: ModeleExercice[];
}

export interface Niveau {
	id: string;
	titre: string;
	sequences: Sequence[];
}
