// Progression de l'élève et programmes en cours, gardés dans le navigateur.
import { catalogue } from '$lib/blocs/catalogue';
import { typesUtilises } from '$lib/blocs/operations';
import type { Pile } from '$lib/blocs/types';
import { ecrire, lire } from './stockage';

/** Réussites d'affilée sur les versions d'un exercice, pour une graine donnée. */
interface Serie {
	graine: number;
	reussites: number;
}

class Progression {
	reussis = $state<string[]>(lire('reussis', []));

	estReussi(id: string) {
		return this.reussis.includes(id);
	}

	marquer(id: string) {
		if (this.estReussi(id)) return;
		this.reussis.push(id);
		ecrire('reussis', this.reussis);
	}

	series = $state<Record<string, Serie>>(lire('series', {}));

	/** Nombre de versions réussies d'affilée avec cette graine (0 si la graine a changé). */
	reussites(id: string, graine: number): number {
		const s = this.series[id];
		return s && s.graine === graine && Number.isInteger(s.reussites) ? s.reussites : 0;
	}

	/**
	 * Enregistre la réussite d'une version ; l'exercice est validé quand
	 * `aReussir` versions ont été réussies. Renvoie le nouveau nombre de réussites.
	 */
	reussir(id: string, graine: number, aReussir: number): number {
		const n = Math.min(aReussir, this.reussites(id, graine) + 1);
		this.series[id] = { graine, reussites: n };
		ecrire('series', this.series);
		if (n >= aReussir) this.marquer(id);
		return n;
	}
}

export const progression = new Progression();

export function chargerProgramme(id: string): Pile[] | null {
	const p = lire<Pile[] | null>(`programme:${id}`, null);
	if (!Array.isArray(p)) return null;
	try {
		// On écarte un programme abîmé ou utilisant des blocs disparus.
		const valide = p.every(
			(pile) =>
				typeof pile.x === 'number' &&
				Array.isArray(pile.blocs) &&
				typesUtilises(pile.blocs).every((t) => t in catalogue)
		);
		return valide ? p : null;
	} catch {
		return null;
	}
}

export function sauverProgramme(id: string, programme: Pile[]) {
	ecrire(`programme:${id}`, programme);
}
