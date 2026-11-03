import { blocInconnu, type Situation } from '../types';

export interface ConfigSuites {
	/** Nombres que le programme doit écrire, dans l'ordre. */
	attendu: number[];
	/** Représenter chaque nombre écrit par un motif (colonne de carrés). */
	motif?: 'carres';
}

export interface EtatSuites {
	sortie: number[];
}

export const egaux = (a: number, b: number) => Math.abs(a - b) < 1e-9;

export function formater(n: number): string {
	return n.toLocaleString('fr-FR', { maximumFractionDigits: 6 });
}

export const suites: Situation<ConfigSuites, EtatSuites> = {
	etatInitial() {
		return { sortie: [] };
	},

	appliquer(etat, instruction) {
		if (instruction.type === 'ecrire') {
			return { etat: { sortie: [...etat.sortie, instruction.args.valeur] } };
		}
		return blocInconnu(instruction.type);
	},

	verifier({ sortie }, { attendu }) {
		if (sortie.length === 0) return { reussi: false, message: "Ton programme n'a rien écrit." };
		const i = attendu.findIndex((v, k) => k >= sortie.length || !egaux(v, sortie[k]));
		if (i >= 0 && i < sortie.length) {
			return {
				reussi: false,
				message: `Le nombre n°${i + 1} devrait être ${formater(attendu[i])}, et non ${formater(sortie[i])}.`
			};
		}
		if (sortie.length < attendu.length) {
			return {
				reussi: false,
				message: `C'est bien parti, mais il manque des nombres : ${attendu.length} sont attendus.`
			};
		}
		if (sortie.length > attendu.length) {
			return {
				reussi: false,
				message: `Ton programme a écrit trop de nombres : ${attendu.length} seulement sont attendus.`
			};
		}
		return { reussi: true, message: 'Bravo ! Ta suite de nombres est exactement la bonne.' };
	}
};
