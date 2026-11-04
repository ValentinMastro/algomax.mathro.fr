// Graine du hasard : elle détermine toutes les versions des exercices.
// Deux élèves avec la même graine ont exactement les mêmes exercices.
import { ecrire, lire } from './stockage';

/** Une graine valide est un entier (exact en JavaScript). */
export const estGraine = (v: unknown): v is number => Number.isSafeInteger(v);

class Graine {
	#valeur = $state(0);

	constructor() {
		const v = lire<unknown>('graine', 0);
		this.#valeur = estGraine(v) ? v : 0;
	}

	get valeur() {
		return this.#valeur;
	}

	set valeur(v: number) {
		if (!estGraine(v)) return;
		this.#valeur = v;
		ecrire('graine', v);
	}
}

export const graine = new Graine();
