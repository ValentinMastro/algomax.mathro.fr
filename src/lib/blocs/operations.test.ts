import { describe, expect, it } from 'vitest';
import { avancer, droite, ecrire, fois, programme, repeter, variable } from './construire';
import { compterBlocs, detacher, inserer, pilePrincipale, trouverBloc } from './operations';

describe('opérations sur le programme', () => {
	it('détache un bloc avec ceux qui le suivent', () => {
		const p = programme(avancer(), droite(), avancer());
		const [, a, d] = p[0].blocs;
		const detaches = detacher(p, d.uid);
		expect(detaches).toHaveLength(2);
		expect(p[0].blocs.map((b) => b.uid)).toEqual([p[0].blocs[0].uid, a.uid]);
	});

	it('supprime une pile vidée', () => {
		const p = programme(avancer());
		detacher(p, p[0].blocs[0].uid);
		expect(p).toHaveLength(0);
	});

	it('insère après un bloc, dans un C et en tête de pile', () => {
		const r = repeter(3);
		const p = programme(r);
		const a = avancer();
		expect(inserer(p, { genre: 'corps', uid: r.uid }, [a])).toBe(true);
		expect(r.corps).toEqual([a]);
		const d = droite();
		expect(inserer(p, { genre: 'apres', uid: a.uid }, [d])).toBe(true);
		expect(r.corps?.map((b) => b.type)).toEqual(['avancer', 'tourner_droite']);
		inserer(p, { genre: 'nouvelle-pile', x: 0, y: 0 }, [avancer()]);
		expect(p).toHaveLength(2);
		expect(inserer(p, { genre: 'avant-pile', pileId: p[1].id }, [droite()])).toBe(true);
		expect(p[1].blocs.map((b) => b.type)).toEqual(['tourner_droite', 'avancer']);
	});

	it('détache un rapporteur en rétablissant la valeur par défaut', () => {
		const v = variable('n');
		const e = ecrire(v);
		const p = programme(e);
		expect(detacher(p, v.uid)).toEqual([v]);
		expect(e.entrees.valeur).toBe(0);
		expect(inserer(p, { genre: 'entree', uid: e.uid, nom: 'valeur' }, [v])).toBe(true);
		expect(trouverBloc(p, v.uid)).toBe(v);
	});

	it('éjecte le rapporteur remplacé', () => {
		const e = ecrire(variable('n'));
		const p = programme(e);
		inserer(p, { genre: 'entree', uid: e.uid, nom: 'valeur' }, [fois(2, 3)]);
		expect(p).toHaveLength(2);
		expect(p[1].blocs[0].type).toBe('variable');
	});

	it('compte les blocs sans le chapeau ni les rapporteurs', () => {
		const p = programme(repeter(4, avancer(), ecrire(variable('n'))), droite());
		expect(compterBlocs(pilePrincipale(p)!.blocs)).toBe(4);
	});
});
