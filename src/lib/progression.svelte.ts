// Progression de l'élève et programmes en cours, gardés dans le navigateur.
// Tout est protégé : l'application fonctionne même sans stockage disponible.
import { catalogue } from '$lib/blocs/catalogue';
import { typesUtilises } from '$lib/blocs/operations';
import type { Pile } from '$lib/blocs/types';

const PREFIXE = 'algomax:';

function lire<T>(cle: string, defaut: T): T {
	try {
		const v = localStorage.getItem(PREFIXE + cle);
		return v ? (JSON.parse(v) as T) : defaut;
	} catch {
		return defaut;
	}
}

function ecrire(cle: string, valeur: unknown) {
	try {
		localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur));
	} catch {
		// Stockage indisponible (navigation privée…) : tant pis.
	}
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
