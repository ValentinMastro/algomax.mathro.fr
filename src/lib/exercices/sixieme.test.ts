import { describe, expect, it } from 'vitest';
import { compterBlocs, pilePrincipale, typesUtilises } from '$lib/blocs/operations';
import { executerTout } from '$lib/moteur/interpreteur';
import { situations } from '$lib/situations';
import { lireCarte } from '$lib/situations/robot/robot';
import type { Exercice } from './types';
import { exercicesSixieme } from './sixieme';
import { tirerVersions, versions, versionsAReussir } from './variantes';

/** Graines testées : les petites (les plus utilisées) et quelques grandes. */
const GRAINES = [...Array.from({ length: 40 }, (_, i) => i), -7, 1234, 99999, 2147483647];

const empreinte = (ex: Exercice) => JSON.stringify([ex.consigne, ex.config]);

describe('série 6ème', () => {
	it('a des identifiants uniques', () => {
		const ids = exercicesSixieme.map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	for (const modele of exercicesSixieme) {
		describe(`${modele.id} ${modele.titre}`, () => {
			it('a le bon nombre de versions, toutes différentes', () => {
				for (const g of GRAINES) {
					const vs = versions(modele, g);
					expect(vs).toHaveLength(versionsAReussir(modele));
					expect(new Set(vs.map(empreinte)).size).toBe(vs.length);
				}
			});

			it('donne les mêmes versions pour la même graine', () => {
				for (const g of [0, 5, 1234]) {
					const premier = tirerVersions(modele, g).map(empreinte);
					expect(tirerVersions(modele, g).map(empreinte)).toEqual(premier);
				}
			});

			it('change de versions quand la graine change', () => {
				const tirages = new Set(GRAINES.map((g) => versions(modele, g).map(empreinte).join()));
				expect(tirages.size).toBeGreaterThan(1);
			});

			for (const g of GRAINES) {
				it(`graine ${g} : chaque version est résolue par sa solution`, () => {
					for (const ex of versions(modele, g)) {
						expect(ex.situation).toBe(modele.situation);
						const blocs = pilePrincipale(ex.solution)!.blocs;
						const situation = situations[ex.situation];
						const bilan = executerTout(blocs, situation, ex.config, ex.variables);
						expect(bilan.erreur?.message).toBeUndefined();
						expect(situation.verifier(bilan.scene, ex.config)).toMatchObject({ reussi: true });

						for (const type of typesUtilises(blocs)) expect(ex.blocs).toContain(type);
						if (ex.maxBlocs) expect(compterBlocs(blocs)).toBeLessThanOrEqual(ex.maxBlocs);

						if (ex.situation === 'robot') {
							const carte = lireCarte(ex.config.carte);
							expect(carte.drapeau).not.toBeNull();
							expect(ex.config.carte.every((l) => l.length === carte.largeur)).toBe(true);
						}

						if (ex.programmeInitial) {
							const initial = pilePrincipale(ex.programmeInitial)!.blocs;
							const b = executerTout(initial, situation, ex.config, ex.variables);
							expect(!b.erreur && situation.verifier(b.scene, ex.config).reussi).toBe(false);
						}
					}
				});
			}
		});
	}
});
