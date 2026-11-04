// Les versions d'un exercice ne dépendent que de la graine et de l'exercice :
// deux élèves qui ont la même graine ont exactement les mêmes versions.
import { Alea, hacher } from '$lib/alea';
import type { Exercice, ModeleExercice } from './types';

/** Nombre de versions à réussir d'affilée pour valider un exercice à variantes. */
export const VERSIONS = 3;

const ESSAIS_MAX = 500;

/** Nombre de réussites nécessaires pour valider l'exercice. */
export function versionsAReussir(modele: ModeleExercice): number {
	return modele.fixe ? 1 : VERSIONS;
}

function empreinte(ex: Exercice) {
	return JSON.stringify([ex.consigne, ex.config]);
}

const cache = new Map<string, Exercice[]>();

/** Les versions (toutes différentes) de l'exercice pour une graine. */
export function versions(modele: ModeleExercice, graine: number): Exercice[] {
	const cle = `${modele.id}|${graine}`;
	let res = cache.get(cle);
	if (!res) cache.set(cle, (res = tirerVersions(modele, graine)));
	return res;
}

/** Tire les versions (calcul sans cache). */
export function tirerVersions(modele: ModeleExercice, graine: number): Exercice[] {
	const res: Exercice[] = [];
	const vues = new Set<string>();
	for (let rang = 0; rang < versionsAReussir(modele); rang++) {
		for (let essai = 0; ; essai++) {
			if (essai >= ESSAIS_MAX) {
				throw new Error(`Exercice ${modele.id} : impossible de tirer la version ${rang + 1}.`);
			}
			const enonce = modele.enonce(new Alea(hacher(`${graine}|${modele.id}|${rang}|${essai}`)));
			if (!enonce) continue;
			const ex = { ...modele, ...enonce } as Exercice;
			if (vues.has(empreinte(ex))) continue;
			vues.add(empreinte(ex));
			res.push(ex);
			break;
		}
	}
	return res;
}
