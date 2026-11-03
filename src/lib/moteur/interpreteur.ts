// Interpréteur pas à pas : un générateur qui exécute l'arbre de blocs et rend
// la main après chaque instruction élémentaire.
import type { Bloc, Entree } from '$lib/blocs/types';
import type { Situation } from '$lib/situations/types';

export interface Pas<E> {
	/** Bloc qui vient d'être exécuté. */
	uid: string;
	scene: E;
	variables: Record<string, number>;
}

export class ErreurExecution<E = unknown> extends Error {
	constructor(
		message: string,
		public uid: string,
		public scene?: E
	) {
		super(message);
	}
}

export const MAX_PAS = 2000;

export function* executer<C, E>(
	blocs: Bloc[],
	situation: Situation<C, E>,
	config: C,
	nomsVariables: string[] = [],
	maxPas = MAX_PAS
): Generator<Pas<E>, void, void> {
	let scene = situation.etatInitial(config);
	const variables: Record<string, number> = Object.fromEntries(nomsVariables.map((n) => [n, 0]));
	let compte = 0;

	function evaluer(v: Entree | null | undefined, uid: string): number {
		if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
		if (!v) return 0;
		switch (v.type) {
			case 'variable': {
				const nom = v.champs.var;
				if (!(nom in variables)) {
					throw new ErreurExecution(`La variable « ${nom} » n'existe pas.`, v.uid);
				}
				return variables[nom];
			}
			case 'addition':
				return evaluer(v.entrees.a, v.uid) + evaluer(v.entrees.b, v.uid);
			case 'soustraction':
				return evaluer(v.entrees.a, v.uid) - evaluer(v.entrees.b, v.uid);
			case 'multiplication':
				return evaluer(v.entrees.a, v.uid) * evaluer(v.entrees.b, v.uid);
			default:
				throw new ErreurExecution(`Le bloc « ${v.type} » ne donne pas de nombre.`, uid);
		}
	}

	function* suite(liste: Bloc[]): Generator<Pas<E>, void, void> {
		for (const b of liste) yield* instruction(b);
	}

	function* instruction(b: Bloc): Generator<Pas<E>, void, void> {
		switch (b.type) {
			case 'drapeau':
				return;
			case 'repeter': {
				const n = Math.max(0, Math.round(evaluer(b.entrees.fois, b.uid)));
				for (let i = 0; i < n; i++) yield* suite(b.corps ?? []);
				return;
			}
			case 'mettre':
			case 'ajouter': {
				const nom = b.champs.var;
				if (!(nom in variables)) {
					throw new ErreurExecution(`La variable « ${nom} » n'existe pas.`, b.uid);
				}
				const valeur = evaluer(b.entrees.valeur, b.uid);
				variables[nom] = b.type === 'mettre' ? valeur : variables[nom] + valeur;
				break;
			}
			default: {
				const args: Record<string, number> = {};
				for (const nom of Object.keys(b.entrees)) args[nom] = evaluer(b.entrees[nom], b.uid);
				const r = situation.appliquer(scene, { type: b.type, args }, config);
				if ('erreur' in r) throw new ErreurExecution(r.erreur, b.uid, r.etat ?? scene);
				scene = r.etat;
			}
		}
		compte += 1;
		if (compte > maxPas) {
			throw new ErreurExecution(
				`Ton programme a exécuté plus de ${maxPas} instructions : il est beaucoup trop long !`,
				b.uid,
				scene
			);
		}
		yield { uid: b.uid, scene, variables: { ...variables } };
	}

	yield* suite(blocs);
}

export interface Bilan<E> {
	scene: E;
	variables: Record<string, number>;
	uids: string[];
	erreur?: ErreurExecution<E>;
}

/** Exécute un programme jusqu'au bout (tests, calcul des figures cibles). */
export function executerTout<C, E>(
	blocs: Bloc[],
	situation: Situation<C, E>,
	config: C,
	nomsVariables: string[] = []
): Bilan<E> {
	const bilan: Bilan<E> = {
		scene: situation.etatInitial(config),
		variables: Object.fromEntries(nomsVariables.map((n) => [n, 0])),
		uids: []
	};
	try {
		for (const pas of executer(blocs, situation, config, nomsVariables)) {
			bilan.scene = pas.scene;
			bilan.variables = pas.variables;
			bilan.uids.push(pas.uid);
		}
	} catch (e) {
		if (!(e instanceof ErreurExecution)) throw e;
		bilan.erreur = e;
		if (e.scene) bilan.scene = e.scene as E;
	}
	return bilan;
}
