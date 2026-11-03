// Opérations sur l'arbre d'un programme : retrouver, détacher, insérer.
// Les fonctions modifient le programme en place (compatible avec les proxys
// réactifs de Svelte 5).
import { definition } from './catalogue';
import type { Bloc, Pile } from './types';

export type Emplacement =
	| { genre: 'liste'; liste: Bloc[]; index: number; pile: Pile | null }
	| { genre: 'entree'; parent: Bloc; nom: string };

/** Où l'on peut déposer des blocs. */
export type Cible =
	| { genre: 'apres'; uid: string }
	| { genre: 'corps'; uid: string }
	| { genre: 'avant-pile'; pileId: string }
	| { genre: 'entree'; uid: string; nom: string }
	| { genre: 'nouvelle-pile'; x: number; y: number };

function chercherDansBloc(bloc: Bloc, uid: string): Emplacement | null {
	for (const [nom, v] of Object.entries(bloc.entrees)) {
		if (typeof v === 'number') continue;
		if (v.uid === uid) return { genre: 'entree', parent: bloc, nom };
		const r = chercherDansBloc(v, uid);
		if (r) return r;
	}
	if (bloc.corps) return chercherDansListe(bloc.corps, uid, null);
	return null;
}

function chercherDansListe(liste: Bloc[], uid: string, pile: Pile | null): Emplacement | null {
	for (let i = 0; i < liste.length; i++) {
		if (liste[i].uid === uid) return { genre: 'liste', liste, index: i, pile };
		const r = chercherDansBloc(liste[i], uid);
		if (r) return r;
	}
	return null;
}

export function trouver(programme: Pile[], uid: string): Emplacement | null {
	for (const pile of programme) {
		const r = chercherDansListe(pile.blocs, uid, pile);
		if (r) return r;
	}
	return null;
}

export function trouverBloc(programme: Pile[], uid: string): Bloc | null {
	const e = trouver(programme, uid);
	if (!e) return null;
	if (e.genre === 'liste') return e.liste[e.index];
	const v = e.parent.entrees[e.nom];
	return typeof v === 'number' ? null : v;
}

/**
 * Détache un bloc et tous ceux qui le suivent dans sa liste (comme lorsqu'on
 * saisit un bloc dans Scratch). Un rapporteur est détaché seul et son entrée
 * reprend sa valeur par défaut. Une pile vidée est supprimée.
 */
export function detacher(programme: Pile[], uid: string): Bloc[] {
	const e = trouver(programme, uid);
	if (!e) return [];
	if (e.genre === 'entree') {
		const bloc = e.parent.entrees[e.nom] as Bloc;
		e.parent.entrees[e.nom] = definition(e.parent.type).entrees?.[e.nom] ?? 0;
		return [bloc];
	}
	const blocs = e.liste.splice(e.index);
	if (e.pile && e.pile.blocs.length === 0) {
		programme.splice(programme.indexOf(e.pile), 1);
	}
	return blocs;
}

let compteurPiles = 0;
function nouvelIdPile() {
	compteurPiles += 1;
	return `pile${Date.now().toString(36)}${compteurPiles}`;
}

/** Insère des blocs à l'endroit indiqué. Renvoie `false` si la cible est invalide. */
export function inserer(programme: Pile[], cible: Cible, blocs: Bloc[]): boolean {
	if (blocs.length === 0) return false;
	switch (cible.genre) {
		case 'nouvelle-pile':
			programme.push({ id: nouvelIdPile(), x: cible.x, y: cible.y, blocs });
			return true;
		case 'avant-pile': {
			const pile = programme.find((p) => p.id === cible.pileId);
			if (!pile) return false;
			pile.blocs.unshift(...blocs);
			return true;
		}
		case 'apres': {
			const e = trouver(programme, cible.uid);
			if (!e || e.genre !== 'liste') return false;
			e.liste.splice(e.index + 1, 0, ...blocs);
			return true;
		}
		case 'corps': {
			const bloc = trouverBloc(programme, cible.uid);
			if (!bloc?.corps) return false;
			bloc.corps.unshift(...blocs);
			return true;
		}
		case 'entree': {
			const bloc = trouverBloc(programme, cible.uid);
			if (!bloc || !(cible.nom in bloc.entrees) || blocs.length !== 1) return false;
			const ancien = bloc.entrees[cible.nom];
			bloc.entrees[cible.nom] = blocs[0];
			// Un rapporteur déjà présent est éjecté, comme dans Scratch.
			if (typeof ancien !== 'number') {
				const pile = programme.find((p) => trouver([p], cible.uid));
				programme.push({
					id: nouvelIdPile(),
					x: (pile?.x ?? 0) + 260,
					y: (pile?.y ?? 0) + 10,
					blocs: [ancien]
				});
			}
			return true;
		}
	}
}

/** Pile exécutée : la première qui commence par « quand ▶ est cliqué ». */
export function pilePrincipale(programme: Pile[]): Pile | null {
	return programme.find((p) => p.blocs[0]?.type === 'drapeau') ?? null;
}

/** Nombre de blocs d'instruction (le chapeau et les rapporteurs ne comptent pas). */
export function compterBlocs(blocs: Bloc[]): number {
	let n = 0;
	for (const b of blocs) {
		const forme = definition(b.type).forme;
		if (forme === 'commande' || forme === 'c') n += 1;
		if (b.corps) n += compterBlocs(b.corps);
	}
	return n;
}

/** Liste à plat de tous les types de blocs utilisés (rapporteurs compris). */
export function typesUtilises(blocs: Bloc[]): string[] {
	const types: string[] = [];
	const visiter = (b: Bloc) => {
		types.push(b.type);
		for (const v of Object.values(b.entrees)) if (typeof v !== 'number') visiter(v);
		b.corps?.forEach(visiter);
	};
	blocs.forEach(visiter);
	return types;
}
