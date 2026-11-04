// Outils pour fabriquer les versions des exercices : la carte du robot est
// construite à partir du chemin de la solution, la toile du crayon est centrée
// sur la figure tracée par la solution. Ainsi, chaque version est jouable par
// construction.
import type { Alea } from '$lib/alea';
import { avancer, droite, gauche, programme, ramasser } from '$lib/blocs/construire';
import { pilePrincipale } from '$lib/blocs/operations';
import type { Bloc, Pile } from '$lib/blocs/types';
import { executerTout } from '$lib/moteur/interpreteur';
import { crayon, type ConfigCrayon } from '$lib/situations/crayon/crayon';
import type { Case, ConfigRobot, Direction } from '$lib/situations/robot/robot';

// ── Robot ─────────────────────────────────────────────────────────────────────

/** Pas élémentaire du robot : Avancer, tourner à Gauche, tourner à Droite, Prendre la gemme. */
export type PasRobot = 'A' | 'G' | 'D' | 'P';

export const DIRECTIONS: Direction[] = ['E', 'S', 'O', 'N'];
const vecteurs: Case[] = [
	[1, 0],
	[0, 1],
	[-1, 0],
	[0, -1]
];
const cle = ([x, y]: Case) => `${x},${y}`;
const voisines = ([x, y]: Case): Case[] => vecteurs.map(([dx, dy]) => [x + dx, y + dy]);

/** Répète un pas : `n('A', 3)` = avancer 3 fois. */
export const n = (pas: PasRobot, fois: number): PasRobot[] => Array(fois).fill(pas);

export const inverse = (t: 'D' | 'G'): 'D' | 'G' => (t === 'D' ? 'G' : 'D');

export interface Parcours {
	/** Cases visitées, dans l'ordre (la première est le départ). */
	cases: Case[];
	gemmes: Case[];
	/** Le chemin ne se recoupe pas et ne longe jamais une partie déjà parcourue. */
	propre: boolean;
}

export function parcourir(direction: Direction, pas: PasRobot[]): Parcours {
	let pos: Case = [0, 0];
	let d = DIRECTIONS.indexOf(direction);
	const cases: Case[] = [pos];
	const vues = new Set([cle(pos)]);
	const gemmes: Case[] = [];
	let propre = true;
	for (const p of pas) {
		if (p === 'G') d = (d + 3) % 4;
		else if (p === 'D') d = (d + 1) % 4;
		else if (p === 'P') gemmes.push(pos);
		else {
			const avant = pos;
			pos = [pos[0] + vecteurs[d][0], pos[1] + vecteurs[d][1]];
			const nouvelle = !vues.has(cle(pos));
			const collee = voisines(pos).some((v) => vues.has(cle(v)) && cle(v) !== cle(avant));
			if (!nouvelle || collee) propre = false;
			vues.add(cle(pos));
			cases.push(pos);
		}
	}
	return { cases, gemmes, propre };
}

/**
 * Carte dont le seul chemin est celui parcouru par `pas` (le reste est en murs).
 * `impasses` : cases libres supplémentaires (fausses pistes du labyrinthe).
 */
export function carteDepuisPas(
	direction: Direction,
	pas: PasRobot[],
	impasses: Case[] = []
): ConfigRobot {
	const { cases, gemmes } = parcourir(direction, pas);
	const toutes = [...cases, ...impasses];
	const xs = toutes.map((c) => c[0]);
	const ys = toutes.map((c) => c[1]);
	const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
	const grille = Array.from({ length: Math.max(...ys) - y0 + 1 }, () =>
		Array(Math.max(...xs) - x0 + 1).fill('#')
	);
	const poser = ([x, y]: Case, c: string) => (grille[y - y0][x - x0] = c);
	for (const c of toutes) poser(c, '.');
	for (const g of gemmes) poser(g, 'G');
	poser(cases.at(-1)!, 'F');
	poser(cases[0], 'R');
	return { carte: grille.map((l) => l.join('')), direction };
}

/** Taille de la carte (largeur, hauteur). */
export function taille(config: ConfigRobot): [number, number] {
	return [config.carte[0].length, config.carte.length];
}

/** Liste de blocs correspondant à des pas du robot. */
export function blocsRobot(pas: PasRobot[]): Bloc[] {
	const fabriques = { A: avancer, G: gauche, D: droite, P: ramasser };
	return pas.map((p) => fabriques[p]());
}

export const programmeRobot = (pas: PasRobot[]) => programme(blocsRobot(pas));

/**
 * Chemin au hasard de `segments` lignes droites (longueurs entre `min` et
 * `max`), séparées par des virages. Renvoie `null` si le tirage ne donne pas un
 * chemin propre.
 */
export function cheminAuHasard(
	a: Alea,
	direction: Direction,
	segments: number,
	[min, max]: [number, number]
): PasRobot[] | null {
	const pas: PasRobot[] = [];
	for (let i = 0; i < segments; i++) {
		if (i > 0) pas.push(a.choisir(['G', 'D'] as const));
		pas.push(...n('A', a.entier(min, max)));
	}
	return parcourir(direction, pas).propre ? pas : null;
}

/** Fausses pistes : petites impasses greffées sur le chemin, sans créer de raccourci. */
export function impassesAuHasard(a: Alea, chemin: Case[], nombre: number): Case[] {
	const occupees = new Set(chemin.map(cle));
	const impasses: Case[] = [];
	for (let essai = 0; essai < 30 && impasses.length < nombre; essai++) {
		const origine = chemin[a.entier(1, chemin.length - 2)];
		const [dx, dy] = a.choisir(vecteurs);
		const longueur = a.entier(1, 2);
		const branche: Case[] = [];
		let pos = origine;
		let ok = true;
		for (let k = 0; k < longueur && ok; k++) {
			const avant = pos;
			pos = [pos[0] + dx, pos[1] + dy];
			const touche = voisines(pos).some((v) => occupees.has(cle(v)) && cle(v) !== cle(avant));
			if (occupees.has(cle(pos)) || touche) ok = false;
			else branche.push(pos);
		}
		if (!ok || branche.length === 0) continue;
		for (const c of branche) occupees.add(cle(c));
		impasses.push(...branche);
	}
	return impasses;
}

// ── Crayon ────────────────────────────────────────────────────────────────────

const LARGEUR = 400;
const HAUTEUR = 300;
const MARGE = 20;

/**
 * Toile du crayon dont la figure cible est celle tracée par la solution,
 * placée au centre (sur le quadrillage de 10 pas). `null` si elle ne tient pas.
 */
export function toileCentree(
	solution: Pile[],
	cap = 0,
	variables: string[] = []
): ConfigCrayon | null {
	const essai: ConfigCrayon = {
		largeur: LARGEUR,
		hauteur: HAUTEUR,
		depart: { x: 0, y: 0, cap },
		cible: []
	};
	const blocs = pilePrincipale(solution)?.blocs ?? [];
	const { scene } = executerTout(blocs, crayon, essai, variables);
	const xs = scene.segments.flatMap((s) => [s[0], s[2]]);
	const ys = scene.segments.flatMap((s) => [s[1], s[3]]);
	const [xMin, xMax, yMin, yMax] = [
		Math.min(...xs),
		Math.max(...xs),
		Math.min(...ys),
		Math.max(...ys)
	];
	if (xMax - xMin > LARGEUR - 2 * MARGE || yMax - yMin > HAUTEUR - 2 * MARGE) return null;
	const x = Math.round((LARGEUR - (xMax - xMin)) / 20 - xMin / 10) * 10;
	const y = Math.round((HAUTEUR - (yMax - yMin)) / 20 - yMin / 10) * 10;
	// On retrace depuis le vrai départ : la cible est exactement ce que trace la solution.
	const config: ConfigCrayon = { ...essai, depart: { x, y, cap } };
	config.cible = executerTout(blocs, crayon, config, variables).scene.segments;
	return config;
}

// ── Textes ────────────────────────────────────────────────────────────────────

export const liste = (nombres: number[]) =>
	nombres.map((v) => v.toLocaleString('fr-FR')).join(', ');

export const pluriel = (nombre: number, mot: string) => `${nombre} ${mot}${nombre > 1 ? 's' : ''}`;

export const suite = (debut: number, raison: number, nombre: number) =>
	Array.from({ length: nombre }, (_, i) => debut + i * raison);
