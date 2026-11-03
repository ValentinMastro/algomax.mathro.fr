// Pilotage de l'exécution : tout d'un coup (animé) ou bloc par bloc.
import { compterBlocs, pilePrincipale } from '$lib/blocs/operations';
import type { Bloc, Pile } from '$lib/blocs/types';
import type { Exercice } from '$lib/exercices/types';
import { situations } from '$lib/situations';
import { ErreurExecution, executer, type Pas } from './interpreteur';

export type Statut = 'pret' | 'lecture' | 'pause' | 'fini';

export interface Message {
	genre: 'succes' | 'erreur' | 'info';
	texte: string;
}

export class Controleur {
	scene = $state<unknown>(null);
	variables = $state<Record<string, number>>({});
	actif = $state<string | null>(null);
	erreur = $state<string | null>(null);
	statut = $state<Statut>('pret');
	message = $state<Message | null>(null);
	reussi = $state(false);
	/** Délai entre deux instructions en mode « Exécuter », en millisecondes. */
	delai = $state(450);

	#exercice: Exercice;
	#lireProgramme: () => Pile[];
	#surReussite: () => void;
	#gen: Generator<Pas<unknown>, void, void> | null = null;
	#minuteur: ReturnType<typeof setTimeout> | null = null;
	#nbBlocs = 0;

	constructor(exercice: Exercice, lireProgramme: () => Pile[], surReussite: () => void) {
		this.#exercice = exercice;
		this.#lireProgramme = lireProgramme;
		this.#surReussite = surReussite;
		this.reinitialiser();
	}

	get #situation() {
		return situations[this.#exercice.situation];
	}

	/** Le programme est en cours d'exécution (il ne peut pas être modifié). */
	get enCours() {
		return this.statut === 'lecture' || this.statut === 'pause';
	}

	reinitialiser() {
		this.#arreterMinuteur();
		this.#gen = null;
		this.scene = this.#situation.etatInitial(this.#exercice.config);
		this.variables = Object.fromEntries((this.#exercice.variables ?? []).map((n) => [n, 0]));
		this.actif = null;
		this.erreur = null;
		this.statut = 'pret';
		this.message = null;
		this.reussi = false;
	}

	lancer() {
		if (this.statut === 'lecture') return;
		if (!this.enCours && !this.#preparer()) return;
		this.statut = 'lecture';
		this.#boucle();
	}

	pause() {
		if (this.statut !== 'lecture') return;
		this.#arreterMinuteur();
		this.statut = 'pause';
	}

	/** Exécute le bloc suivant. */
	pas() {
		if (this.statut === 'lecture') return this.pause();
		if (!this.enCours && !this.#preparer()) return;
		this.#avancer();
	}

	detruire() {
		this.#arreterMinuteur();
	}

	#boucle = () => {
		if (this.statut !== 'lecture') return;
		if (this.#avancer()) this.#minuteur = setTimeout(this.#boucle, this.delai);
	};

	#arreterMinuteur() {
		if (this.#minuteur) clearTimeout(this.#minuteur);
		this.#minuteur = null;
	}

	#preparer(): boolean {
		this.reinitialiser();
		const pile = pilePrincipale(this.#lireProgramme());
		if (!pile) {
			this.message = {
				genre: 'info',
				texte: 'Ajoute le bloc « quand ▶ est cliqué » : c’est lui qui démarre le programme.'
			};
			return false;
		}
		if (pile.blocs.length === 1) {
			this.message = {
				genre: 'info',
				texte: 'Accroche des blocs sous « quand ▶ est cliqué » pour écrire ton programme.'
			};
			return false;
		}
		const blocs = $state.snapshot(pile.blocs) as Bloc[];
		this.#nbBlocs = compterBlocs(blocs);
		this.#gen = executer(
			blocs,
			this.#situation,
			this.#exercice.config,
			this.#exercice.variables ?? []
		);
		this.statut = 'pause';
		return true;
	}

	/** Exécute une instruction ; renvoie `false` quand le programme est terminé. */
	#avancer(): boolean {
		if (!this.#gen) return false;
		try {
			const r = this.#gen.next();
			if (r.done) {
				this.#terminer();
				return false;
			}
			this.scene = r.value.scene;
			this.variables = r.value.variables;
			this.actif = r.value.uid;
			return true;
		} catch (e) {
			if (!(e instanceof ErreurExecution)) throw e;
			if (e.scene !== undefined) this.scene = e.scene;
			this.erreur = e.uid;
			this.actif = null;
			this.statut = 'fini';
			this.#gen = null;
			this.message = { genre: 'erreur', texte: e.message };
			return false;
		}
	}

	#terminer() {
		this.#arreterMinuteur();
		this.actif = null;
		this.statut = 'fini';
		this.#gen = null;
		const { config, maxBlocs } = this.#exercice;
		const verdict = this.#situation.verifier(this.scene, config);
		if (!verdict.reussi) {
			this.message = { genre: 'erreur', texte: verdict.message };
		} else if (maxBlocs && this.#nbBlocs > maxBlocs) {
			this.message = {
				genre: 'info',
				texte: `Le but est atteint, mais ton programme utilise ${this.#nbBlocs} blocs. Défi : n’en utiliser que ${maxBlocs} au plus !`
			};
		} else {
			this.message = { genre: 'succes', texte: verdict.message };
			this.reussi = true;
			this.#surReussite();
		}
	}
}
