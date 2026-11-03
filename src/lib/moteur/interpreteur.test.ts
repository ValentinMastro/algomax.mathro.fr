import { describe, expect, it } from 'vitest';
import {
	ajouter,
	avancer,
	ecrire,
	fois,
	mettre,
	plus,
	programme,
	repeter,
	variable
} from '$lib/blocs/construire';
import { suites } from '$lib/situations/suites/suites';
import { robot } from '$lib/situations/robot/robot';
import { executer, executerTout } from './interpreteur';

const configSuites = { attendu: [] };

describe('interpréteur', () => {
	it('exécute une séquence pas à pas, dans l’ordre', () => {
		const p = programme(ecrire(1), ecrire(2));
		const pas = [...executer(p[0].blocs, suites, configSuites)];
		expect(pas.map((x) => x.uid)).toEqual([p[0].blocs[1].uid, p[0].blocs[2].uid]);
		expect(pas[1].scene.sortie).toEqual([1, 2]);
	});

	it('gère les boucles imbriquées', () => {
		const p = programme(repeter(3, repeter(2, ecrire(0))));
		expect(executerTout(p[0].blocs, suites, configSuites).scene.sortie).toHaveLength(6);
	});

	it('gère les variables et les opérateurs', () => {
		const p = programme(
			mettre('n', 1),
			repeter(4, ecrire(fois(variable('n'), plus(variable('n'), 1))), ajouter('n', 1))
		);
		const bilan = executerTout(p[0].blocs, suites, configSuites, ['n']);
		expect(bilan.scene.sortie).toEqual([2, 6, 12, 20]);
		expect(bilan.variables.n).toBe(5);
	});

	it('signale une variable inconnue', () => {
		const p = programme(mettre('x', 1));
		const bilan = executerTout(p[0].blocs, suites, configSuites, ['n']);
		expect(bilan.erreur?.uid).toBe(p[0].blocs[1].uid);
	});

	it('arrête un programme trop long', () => {
		const p = programme(repeter(100, repeter(100, ecrire(1))));
		const bilan = executerTout(p[0].blocs, suites, configSuites);
		expect(bilan.erreur?.message).toMatch(/trop long/);
	});

	it('remonte l’erreur de la situation avec le bloc fautif', () => {
		const p = programme(avancer(), avancer());
		const bilan = executerTout(p[0].blocs, robot, { carte: ['R.#'], direction: 'E' });
		expect(bilan.uids).toHaveLength(1);
		expect(bilan.erreur?.uid).toBe(p[0].blocs[2].uid);
		expect(bilan.scene.choc).toBe(true);
	});
});
