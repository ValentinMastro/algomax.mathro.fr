import { blocInconnu, type Situation } from '../types';

/** Segment [x1, y1, x2, y2], repère mathématique (y vers le haut). */
export type Segment = [number, number, number, number];

export interface ConfigCrayon {
	largeur: number;
	hauteur: number;
	/** Position et cap initiaux (cap en degrés, 0 = vers la droite, sens direct). */
	depart: { x: number; y: number; cap: number };
	/** Figure à reproduire (calculée à partir de la solution de l'exercice). */
	cible: Segment[];
}

export interface EtatCrayon {
	x: number;
	y: number;
	cap: number;
	stylo: boolean;
	segments: Segment[];
}

const arrondir = (v: number) => Math.round(v * 1e6) / 1e6 + 0;

export const crayon: Situation<ConfigCrayon, EtatCrayon> = {
	etatInitial(config) {
		return { ...config.depart, stylo: true, segments: [] };
	},

	appliquer(etat, instruction) {
		const { args } = instruction;
		switch (instruction.type) {
			case 'avancer_de': {
				const rad = (etat.cap * Math.PI) / 180;
				const x = arrondir(etat.x + args.pas * Math.cos(rad));
				const y = arrondir(etat.y + args.pas * Math.sin(rad));
				const segments =
					etat.stylo && args.pas !== 0
						? [...etat.segments, [etat.x, etat.y, x, y] as Segment]
						: etat.segments;
				return { etat: { ...etat, x, y, segments } };
			}
			case 'tourner_gauche_de':
				return { etat: { ...etat, cap: etat.cap + args.angle } };
			case 'tourner_droite_de':
				return { etat: { ...etat, cap: etat.cap - args.angle } };
			case 'stylo_bas':
				return { etat: { ...etat, stylo: true } };
			case 'stylo_haut':
				return { etat: { ...etat, stylo: false } };
			default:
				return blocInconnu(instruction.type);
		}
	},

	verifier(etat, config) {
		if (etat.segments.length === 0) {
			return { reussi: false, message: "Le crayon n'a rien tracé." };
		}
		if (memeFigure(etat.segments, config.cible)) {
			return { reussi: true, message: 'Bravo ! Ta figure est exactement celle du modèle.' };
		}
		return {
			reussi: false,
			message: 'Ta figure ne correspond pas au modèle en pointillés. Observe les différences !'
		};
	}
};

/**
 * Forme normalisée d'un tracé : les segments alignés qui se touchent ou se
 * chevauchent sont fusionnés, et l'ordre ou le sens du tracé ne comptent pas.
 */
export function normaliser(segments: Segment[]): string[] {
	const droites = new Map<string, [number, number][]>();
	for (const [x1, y1, x2, y2] of segments) {
		const dx = x2 - x1;
		const dy = y2 - y1;
		if (Math.hypot(dx, dy) < 1e-6) continue;
		let theta = Math.atan2(dy, dx);
		if (theta < 0) theta += Math.PI;
		if (theta >= Math.PI - 1e-6) theta = 0;
		const ux = Math.cos(theta);
		const uy = Math.sin(theta);
		const c = -uy * x1 + ux * y1; // distance signée à l'origine
		const t1 = ux * x1 + uy * y1;
		const t2 = ux * x2 + uy * y2;
		const cle = `${((theta * 180) / Math.PI).toFixed(1)}|${(c + 0).toFixed(1)}`;
		const liste = droites.get(cle) ?? [];
		liste.push([Math.min(t1, t2), Math.max(t1, t2)]);
		droites.set(cle, liste);
	}
	const res: string[] = [];
	for (const [cle, intervalles] of droites) {
		intervalles.sort((a, b) => a[0] - b[0]);
		let [debut, fin] = intervalles[0];
		for (const [a, b] of intervalles.slice(1)) {
			if (a <= fin + 0.5) fin = Math.max(fin, b);
			else {
				res.push(`${cle}|${debut.toFixed(1)}|${fin.toFixed(1)}`);
				[debut, fin] = [a, b];
			}
		}
		res.push(`${cle}|${debut.toFixed(1)}|${fin.toFixed(1)}`);
	}
	return res.sort();
}

export function memeFigure(a: Segment[], b: Segment[]): boolean {
	const na = normaliser(a);
	const nb = normaliser(b);
	return na.length === nb.length && na.every((s, i) => s === nb[i]);
}
