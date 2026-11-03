// Interface commune des « situations » (robot, crayon, suites…).

/** Instruction élémentaire transmise à la situation, entrées déjà évaluées. */
export interface Instruction {
	type: string;
	args: Record<string, number>;
}

export type Resultat<E> = { etat: E } | { erreur: string; etat?: E };

export interface Verdict {
	reussi: boolean;
	message: string;
}

export interface Situation<C, E> {
	etatInitial(config: C): E;
	appliquer(etat: E, instruction: Instruction, config: C): Resultat<E>;
	verifier(etat: E, config: C): Verdict;
}

export function blocInconnu(type: string): { erreur: string } {
	return { erreur: `Le bloc « ${type} » ne peut pas être utilisé dans cette situation.` };
}
