import { describe, expect, it } from 'vitest';
import { Alea, hacher } from './alea';

describe('hasard déterministe', () => {
	it('donne toujours la même suite pour la même graine', () => {
		const tirer = (g: number) => {
			const a = new Alea(g);
			return Array.from({ length: 20 }, () => a.entier(0, 1000));
		};
		expect(tirer(42)).toEqual(tirer(42));
		expect(tirer(42)).not.toEqual(tirer(43));
	});

	// Modifier le hachage ou le générateur changerait les exercices de tous les élèves.
	it('garde des valeurs de référence figées', () => {
		expect(hacher('algomax')).toBe(3818086814);
		expect(hacher('0|1-2|0|0')).toBe(3674157795);
		const a = new Alea(hacher('algomax'));
		expect(Array.from({ length: 8 }, () => a.entier(1, 100))).toEqual([
			92, 41, 75, 1, 60, 28, 55, 33
		]);
	});

	it('respecte les bornes et le pas', () => {
		const a = new Alea(7);
		for (let i = 0; i < 500; i++) {
			const v = a.entier(60, 140, 10);
			expect(v).toBeGreaterThanOrEqual(60);
			expect(v).toBeLessThanOrEqual(140);
			expect(v % 10).toBe(0);
		}
	});

	it('atteint toutes les valeurs possibles', () => {
		const a = new Alea(1);
		const vues = new Set(Array.from({ length: 200 }, () => a.entier(1, 6)));
		expect([...vues].sort()).toEqual([1, 2, 3, 4, 5, 6]);
	});
});
