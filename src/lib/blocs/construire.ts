// Fabrication de blocs : depuis la palette, et pour écrire les programmes
// (solutions, programmes de départ) des exercices de façon concise.
import { definition } from './catalogue';
import type { Bloc, Entree, Pile } from './types';

let compteur = 0;
const graine = Math.random().toString(36).slice(2, 6);

export function nouvelUid(): string {
	compteur += 1;
	return `b${graine}${compteur.toString(36)}`;
}

/** Crée un bloc avec ses valeurs par défaut, éventuellement surchargées. */
export function creerBloc(
	type: string,
	entrees: Record<string, Entree> = {},
	options: { corps?: Bloc[]; champs?: Record<string, string> } = {}
): Bloc {
	const def = definition(type);
	const bloc: Bloc = {
		uid: nouvelUid(),
		type,
		entrees: { ...(def.entrees ?? {}), ...entrees },
		champs: { ...options.champs }
	};
	for (const champ of def.champs ?? []) bloc.champs[champ] ??= 'n';
	if (def.forme === 'c') bloc.corps = options.corps ?? [];
	return bloc;
}

/** Copie profonde d'un bloc, avec de nouveaux identifiants. */
export function cloner(bloc: Bloc): Bloc {
	const copie: Bloc = {
		uid: nouvelUid(),
		type: bloc.type,
		champs: { ...bloc.champs },
		entrees: Object.fromEntries(
			Object.entries(bloc.entrees).map(([nom, v]) => [nom, typeof v === 'number' ? v : cloner(v)])
		)
	};
	if (bloc.corps) copie.corps = bloc.corps.map(cloner);
	return copie;
}

export function clonerProgramme(piles: Pile[]): Pile[] {
	return piles.map((p) => ({ ...p, id: nouvelUid(), blocs: p.blocs.map(cloner) }));
}

// ── Raccourcis d'écriture ─────────────────────────────────────────────────────

/** Programme d'une seule pile, commençant par « quand ▶ est cliqué ». */
export function programme(...blocs: (Bloc | Bloc[])[]): Pile[] {
	return [{ id: nouvelUid(), x: 24, y: 24, blocs: [creerBloc('drapeau'), ...blocs.flat()] }];
}

export const avancer = () => creerBloc('avancer');
export const gauche = () => creerBloc('tourner_gauche');
export const droite = () => creerBloc('tourner_droite');
export const ramasser = () => creerBloc('ramasser');
export const avancerDe = (pas: Entree) => creerBloc('avancer_de', { pas });
export const droiteDe = (angle: Entree) => creerBloc('tourner_droite_de', { angle });
export const gaucheDe = (angle: Entree) => creerBloc('tourner_gauche_de', { angle });
export const styloBas = () => creerBloc('stylo_bas');
export const styloHaut = () => creerBloc('stylo_haut');
export const repeter = (fois: Entree, ...corps: (Bloc | Bloc[])[]) =>
	creerBloc('repeter', { fois }, { corps: corps.flat() });
export const mettre = (nom: string, valeur: Entree) =>
	creerBloc('mettre', { valeur }, { champs: { var: nom } });
export const ajouter = (nom: string, valeur: Entree) =>
	creerBloc('ajouter', { valeur }, { champs: { var: nom } });
export const ecrire = (valeur: Entree) => creerBloc('ecrire', { valeur });
export const variable = (nom: string) => creerBloc('variable', {}, { champs: { var: nom } });
export const plus = (a: Entree, b: Entree) => creerBloc('addition', { a, b });
export const moins = (a: Entree, b: Entree) => creerBloc('soustraction', { a, b });
export const fois = (a: Entree, b: Entree) => creerBloc('multiplication', { a, b });

/** `n` exemplaires d'une suite de blocs (pour écrire « avancer » ×4). */
export function nFois(n: number, fabrique: () => Bloc | Bloc[]): Bloc[] {
	return Array.from({ length: n }, fabrique).flat();
}
