import { describe, expect, it } from 'vitest';
import { compterBlocs, pilePrincipale, typesUtilises } from '$lib/blocs/operations';
import { executerTout } from '$lib/moteur/interpreteur';
import { situations } from '$lib/situations';
import { exercicesSixieme } from './sixieme';

describe('série 6ème', () => {
	it('a des identifiants uniques', () => {
		const ids = exercicesSixieme.map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	for (const ex of exercicesSixieme) {
		describe(`${ex.id} ${ex.titre}`, () => {
			const blocs = pilePrincipale(ex.solution)!.blocs;

			it('est résolu par sa solution', () => {
				const situation = situations[ex.situation];
				const bilan = executerTout(blocs, situation, ex.config, ex.variables);
				expect(bilan.erreur?.message).toBeUndefined();
				expect(situation.verifier(bilan.scene, ex.config)).toMatchObject({ reussi: true });
			});

			it('respecte ses contraintes (blocs autorisés, nombre de blocs)', () => {
				for (const type of typesUtilises(blocs)) expect(ex.blocs).toContain(type);
				if (ex.maxBlocs) expect(compterBlocs(blocs)).toBeLessThanOrEqual(ex.maxBlocs);
			});

			if (ex.programmeInitial) {
				it('ne part pas d’un programme déjà juste', () => {
					const situation = situations[ex.situation];
					const initial = pilePrincipale(ex.programmeInitial!)!.blocs;
					const bilan = executerTout(initial, situation, ex.config, ex.variables);
					const ok = !bilan.erreur && situation.verifier(bilan.scene, ex.config).reussi;
					expect(ok).toBe(false);
				});
			}
		});
	}
});
