import { categories } from '$lib/blocs/catalogue';

const parSequence = ['mouvement', 'controle', 'stylo', 'variables'] as const;

/** Couleur associée à une séquence (d'après son rang, à partir de 1). */
export function couleurSequence(rang: number): string {
	return categories[parSequence[(rang - 1) % parSequence.length]].couleur;
}
