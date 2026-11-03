import { describe, expect, it } from 'vitest';
import { crayon, memeFigure, type ConfigCrayon } from './crayon/crayon';
import { robot, type ConfigRobot } from './robot/robot';
import { suites } from './suites/suites';

describe('robot', () => {
	const config: ConfigRobot = { carte: ['RG', '#F'], direction: 'E' };
	const jouer = (...types: string[]) => {
		let etat = robot.etatInitial(config);
		for (const type of types) {
			const r = robot.appliquer(etat, { type, args: {} }, config);
			if ('erreur' in r) return r.erreur;
			etat = r.etat;
		}
		return robot.verifier(etat, config);
	};

	it('réussit en ramassant la gemme et en atteignant le drapeau', () => {
		expect(jouer('avancer', 'ramasser', 'tourner_droite', 'avancer')).toMatchObject({
			reussi: true
		});
	});
	it('exige toutes les gemmes', () => {
		expect(jouer('avancer', 'tourner_droite', 'avancer')).toMatchObject({ reussi: false });
	});
	it('détecte les murs et les bords', () => {
		expect(jouer('tourner_droite', 'avancer')).toMatch(/mur/);
		expect(jouer('tourner_gauche', 'avancer')).toMatch(/sorti/);
	});
	it('refuse de ramasser dans le vide', () => {
		expect(jouer('ramasser')).toMatch(/pas de gemme/);
	});
});

describe('crayon', () => {
	it('reconnaît une figure quel que soit l’ordre, le sens et le découpage des segments', () => {
		const carre: [number, number, number, number][] = [
			[0, 0, 100, 0],
			[100, 0, 100, 100],
			[100, 100, 0, 100],
			[0, 100, 0, 0]
		];
		const autre: [number, number, number, number][] = [
			[0, 0, 0, 100],
			[0, 100, 100, 100],
			[100, 100, 100, 0],
			[100, 0, 50, 0],
			[50, 0, 0, 0]
		];
		expect(memeFigure(carre, autre)).toBe(true);
		expect(memeFigure(carre, carre.slice(1))).toBe(false);
	});

	it('trace seulement stylo baissé', () => {
		const config: ConfigCrayon = {
			largeur: 400,
			hauteur: 300,
			depart: { x: 0, y: 0, cap: 0 },
			cible: [[0, 0, 0, 50]]
		};
		let etat = crayon.etatInitial(config);
		for (const [type, args] of [
			['stylo_haut', {}],
			['avancer_de', { pas: 30 }],
			['stylo_bas', {}],
			['tourner_gauche_de', { angle: 90 }],
			['avancer_de', { pas: 50 }]
		] as const) {
			const r = crayon.appliquer(etat, { type, args }, config);
			if ('erreur' in r) throw new Error(r.erreur);
			etat = r.etat;
		}
		expect(etat.segments).toEqual([[30, 0, 30, 50]]);
		expect(crayon.verifier(etat, config).reussi).toBe(false);
	});
});

describe('suites', () => {
	const config = { attendu: [1, 2, 3] };
	it('compare la sortie à la suite attendue', () => {
		expect(suites.verifier({ sortie: [1, 2, 3] }, config).reussi).toBe(true);
		expect(suites.verifier({ sortie: [1, 2] }, config).message).toMatch(/manque/);
		expect(suites.verifier({ sortie: [1, 2, 3, 4] }, config).message).toMatch(/trop/);
		expect(suites.verifier({ sortie: [1, 5] }, config).message).toMatch(/n°2/);
	});
});
