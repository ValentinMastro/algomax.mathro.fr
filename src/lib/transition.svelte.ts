// Demande de transition animée entre deux exercices. L'animation elle-même
// est jouée par `TransitionExercice.svelte` (dans le layout), qui appelle
// `goto` au moment où la page est cachée.
import { goto } from '$app/navigation';

export interface Demande {
	url: string;
	depuis: string;
	vers: string;
}

/** Entrée dans un exercice depuis la liste : la tuile cliquée s'ouvre. */
export interface Ouverture {
	url: string;
	/** Position de la tuile cliquée à l'écran. */
	rect: { x: number; y: number; l: number; h: number };
	numero: number;
	titre: string;
	sequence: string;
	couleur: string;
	icone: string;
}

const mouvementReduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

class Transition {
	demande = $state<Demande | null>(null);
	ouverture = $state<Ouverture | null>(null);

	get enCours() {
		return this.demande !== null || this.ouverture !== null;
	}

	lancer(url: string, depuis: string, vers: string) {
		if (this.enCours) return;
		if (mouvementReduit()) {
			goto(url);
			return;
		}
		this.demande = { url, depuis, vers };
	}

	ouvrir(o: Ouverture) {
		if (this.enCours) return;
		if (mouvementReduit()) {
			goto(o.url);
			return;
		}
		this.ouverture = o;
	}

	terminer() {
		this.demande = null;
		this.ouverture = null;
	}
}

export const transition = new Transition();
