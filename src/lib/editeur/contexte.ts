import { getContext, setContext } from 'svelte';

export interface ContexteEditeur {
	readonly variables: string[];
	/** Bloc en cours d'exécution (surligné). */
	readonly actif: string | null;
	/** Bloc qui a provoqué une erreur. */
	readonly erreur: string | null;
	/** Programme non modifiable (pendant l'exécution). */
	readonly verrouille: boolean;
	/** Emplacement survolé par un rapporteur, sous la forme `uid:nom`. */
	readonly entreeSurvolee: string | null;
	saisir(e: PointerEvent, uid: string): void;
}

const CLE = Symbol('editeur');

export function fournirContexte(ctx: ContexteEditeur) {
	setContext(CLE, ctx);
}

export function contexteEditeur(): ContexteEditeur {
	return getContext<ContexteEditeur>(CLE);
}
