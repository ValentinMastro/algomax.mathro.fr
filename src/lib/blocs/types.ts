// Modèle de données d'un programme par blocs.

/** Forme d'un bloc, qui détermine comment il s'emboîte. */
export type Forme = 'chapeau' | 'commande' | 'c' | 'rapporteur';

export type Categorie =
	'evenements' | 'mouvement' | 'stylo' | 'controle' | 'variables' | 'affichage' | 'operateurs';

/** Définition d'un type de bloc (catalogue). */
export interface DefBloc {
	type: string;
	categorie: Categorie;
	forme: Forme;
	/**
	 * Libellé affiché, avec des emplacements `{nom}` : un nom présent dans
	 * `entrees` devient un champ numérique, un nom présent dans `champs` une
	 * liste de variables.
	 */
	libelle: string;
	/** Entrées numériques et leur valeur par défaut. */
	entrees?: Record<string, number>;
	/** Champs « nom de variable ». */
	champs?: string[];
}

/** Valeur d'une entrée : un nombre écrit à la main, ou un bloc rapporteur. */
export type Entree = number | Bloc;

/** Instance d'un bloc dans un programme. */
export interface Bloc {
	uid: string;
	type: string;
	entrees: Record<string, Entree>;
	champs: Record<string, string>;
	/** Blocs contenus dans la « bouche » d'un bloc en C. */
	corps?: Bloc[];
}

/** Pile de blocs posée librement dans la zone de script. */
export interface Pile {
	id: string;
	x: number;
	y: number;
	blocs: Bloc[];
}

export type Programme = Pile[];
