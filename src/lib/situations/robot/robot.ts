import { blocInconnu, type Situation } from '../types';

export type Direction = 'E' | 'S' | 'O' | 'N';

export interface ConfigRobot {
	/**
	 * Carte, une chaîne par ligne : `.` case libre, `#` mur, `R` départ du
	 * robot, `F` drapeau, `G` gemme.
	 */
	carte: string[];
	/** Direction initiale du robot. */
	direction: Direction;
}

export type Case = [number, number];

export interface EtatRobot {
	x: number;
	y: number;
	/** Angle cumulé en degrés (sens horaire, 0 = est) : permet d'animer les rotations. */
	angle: number;
	gemmes: Case[];
	ramassees: number;
	chemin: Case[];
	choc: boolean;
}

export interface Carte {
	largeur: number;
	hauteur: number;
	murs: Set<string>;
	drapeau: Case | null;
	gemmes: Case[];
	depart: Case;
}

const cle = (x: number, y: number) => `${x},${y}`;
const angles: Record<Direction, number> = { E: 0, S: 90, O: 180, N: 270 };

export function lireCarte(carte: string[]): Carte {
	const res: Carte = {
		largeur: Math.max(...carte.map((l) => l.length)),
		hauteur: carte.length,
		murs: new Set(),
		drapeau: null,
		gemmes: [],
		depart: [0, 0]
	};
	carte.forEach((ligne, y) => {
		[...ligne].forEach((c, x) => {
			if (c === '#') res.murs.add(cle(x, y));
			else if (c === 'F') res.drapeau = [x, y];
			else if (c === 'G') res.gemmes.push([x, y]);
			else if (c === 'R') res.depart = [x, y];
		});
	});
	return res;
}

/** Direction (0 = E, 1 = S, 2 = O, 3 = N) correspondant à un angle cumulé. */
export function quart(angle: number): number {
	return (((Math.round(angle / 90) % 4) + 4) % 4) as number;
}

const pas: Case[] = [
	[1, 0],
	[0, 1],
	[-1, 0],
	[0, -1]
];

export const robot: Situation<ConfigRobot, EtatRobot> = {
	etatInitial(config) {
		const carte = lireCarte(config.carte);
		return {
			x: carte.depart[0],
			y: carte.depart[1],
			angle: angles[config.direction],
			gemmes: carte.gemmes,
			ramassees: 0,
			chemin: [carte.depart],
			choc: false
		};
	},

	appliquer(etat, instruction, config) {
		switch (instruction.type) {
			case 'avancer': {
				const carte = lireCarte(config.carte);
				const [dx, dy] = pas[quart(etat.angle)];
				const x = etat.x + dx;
				const y = etat.y + dy;
				if (x < 0 || y < 0 || x >= carte.largeur || y >= carte.hauteur) {
					return { erreur: 'Le robot est sorti du terrain !', etat: { ...etat, choc: true } };
				}
				if (carte.murs.has(cle(x, y))) {
					return {
						erreur: "Aïe ! Le robot s'est cogné contre un mur.",
						etat: { ...etat, choc: true }
					};
				}
				return { etat: { ...etat, x, y, chemin: [...etat.chemin, [x, y]] } };
			}
			case 'tourner_gauche':
				return { etat: { ...etat, angle: etat.angle - 90 } };
			case 'tourner_droite':
				return { etat: { ...etat, angle: etat.angle + 90 } };
			case 'ramasser': {
				const i = etat.gemmes.findIndex(([x, y]) => x === etat.x && y === etat.y);
				if (i < 0) return { erreur: "Il n'y a pas de gemme sur cette case." };
				return {
					etat: {
						...etat,
						gemmes: etat.gemmes.filter((_, j) => j !== i),
						ramassees: etat.ramassees + 1
					}
				};
			}
			default:
				return blocInconnu(instruction.type);
		}
	},

	verifier(etat, config) {
		const carte = lireCarte(config.carte);
		if (etat.gemmes.length > 0) {
			const n = etat.gemmes.length;
			return {
				reussi: false,
				message: `Il reste ${n} gemme${n > 1 ? 's' : ''} à ramasser.`
			};
		}
		const [fx, fy] = carte.drapeau ?? [-1, -1];
		if (etat.x !== fx || etat.y !== fy) {
			return { reussi: false, message: "Le robot n'est pas arrivé sur le drapeau." };
		}
		return { reussi: true, message: 'Bravo ! Le robot a atteint le drapeau.' };
	}
};
