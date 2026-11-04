// Hasard déterministe : une même graine donne toujours la même suite de tirages,
// sur tous les navigateurs (uniquement des opérations entières 32 bits exactes).

/** Empreinte 32 bits d'un texte (FNV-1a, puis mélange final de murmur3). */
export function hacher(texte: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < texte.length; i++) {
		h ^= texte.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	h ^= h >>> 16;
	h = Math.imul(h, 0x85ebca6b);
	h ^= h >>> 13;
	h = Math.imul(h, 0xc2b2ae35);
	h ^= h >>> 16;
	return h >>> 0;
}

/** Générateur pseudo-aléatoire (mulberry32). */
export class Alea {
	#etat: number;

	constructor(graine: number) {
		this.#etat = graine >>> 0;
	}

	/** Réel dans [0, 1[. */
	reel(): number {
		this.#etat = (this.#etat + 0x6d2b79f5) >>> 0;
		let t = this.#etat;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	/** Entier entre `min` et `max` inclus, éventuellement multiple de `pas` à partir de `min`. */
	entier(min: number, max: number, pas = 1): number {
		const n = Math.floor((max - min) / pas) + 1;
		return min + Math.floor(this.reel() * n) * pas;
	}

	choisir<T>(liste: readonly T[]): T {
		return liste[Math.floor(this.reel() * liste.length)];
	}

	pile(): boolean {
		return this.reel() < 0.5;
	}
}
