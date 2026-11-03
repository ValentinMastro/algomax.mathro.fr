import type { Categorie, DefBloc } from './types';

const liste: DefBloc[] = [
	// Événements
	{ type: 'drapeau', categorie: 'evenements', forme: 'chapeau', libelle: 'quand ▶ est cliqué' },

	// Robot sur grille
	{ type: 'avancer', categorie: 'mouvement', forme: 'commande', libelle: "avancer d'une case" },
	{
		type: 'tourner_gauche',
		categorie: 'mouvement',
		forme: 'commande',
		libelle: 'tourner à gauche ↺'
	},
	{
		type: 'tourner_droite',
		categorie: 'mouvement',
		forme: 'commande',
		libelle: 'tourner à droite ↻'
	},
	{ type: 'ramasser', categorie: 'mouvement', forme: 'commande', libelle: 'ramasser la gemme' },

	// Crayon
	{
		type: 'avancer_de',
		categorie: 'mouvement',
		forme: 'commande',
		libelle: 'avancer de {pas} pas',
		entrees: { pas: 50 }
	},
	{
		type: 'tourner_droite_de',
		categorie: 'mouvement',
		forme: 'commande',
		libelle: 'tourner ↻ de {angle} degrés',
		entrees: { angle: 90 }
	},
	{
		type: 'tourner_gauche_de',
		categorie: 'mouvement',
		forme: 'commande',
		libelle: 'tourner ↺ de {angle} degrés',
		entrees: { angle: 90 }
	},
	{
		type: 'stylo_bas',
		categorie: 'stylo',
		forme: 'commande',
		libelle: "stylo en position d'écriture"
	},
	{ type: 'stylo_haut', categorie: 'stylo', forme: 'commande', libelle: 'relever le stylo' },

	// Contrôle
	{
		type: 'repeter',
		categorie: 'controle',
		forme: 'c',
		libelle: 'répéter {fois} fois',
		entrees: { fois: 4 }
	},

	// Variables
	{
		type: 'mettre',
		categorie: 'variables',
		forme: 'commande',
		libelle: 'mettre {var} à {valeur}',
		champs: ['var'],
		entrees: { valeur: 0 }
	},
	{
		type: 'ajouter',
		categorie: 'variables',
		forme: 'commande',
		libelle: 'ajouter {valeur} à {var}',
		champs: ['var'],
		entrees: { valeur: 1 }
	},
	{
		type: 'variable',
		categorie: 'variables',
		forme: 'rapporteur',
		libelle: '{var}',
		champs: ['var']
	},

	// Affichage
	{
		type: 'ecrire',
		categorie: 'affichage',
		forme: 'commande',
		libelle: 'écrire {valeur}',
		entrees: { valeur: 0 }
	},

	// Opérateurs
	{
		type: 'addition',
		categorie: 'operateurs',
		forme: 'rapporteur',
		libelle: '{a} + {b}',
		entrees: { a: 0, b: 0 }
	},
	{
		type: 'soustraction',
		categorie: 'operateurs',
		forme: 'rapporteur',
		libelle: '{a} − {b}',
		entrees: { a: 0, b: 0 }
	},
	{
		type: 'multiplication',
		categorie: 'operateurs',
		forme: 'rapporteur',
		libelle: '{a} × {b}',
		entrees: { a: 0, b: 0 }
	}
];

export const catalogue: Record<string, DefBloc> = Object.fromEntries(liste.map((d) => [d.type, d]));

export function definition(type: string): DefBloc {
	const def = catalogue[type];
	if (!def) throw new Error(`Bloc inconnu : ${type}`);
	return def;
}

export const categories: Record<Categorie, { nom: string; couleur: string; sombre: string }> = {
	evenements: { nom: 'Événements', couleur: '#d4a106', sombre: '#a37b00' },
	mouvement: { nom: 'Mouvement', couleur: '#3d7ff5', sombre: '#2a5fc4' },
	stylo: { nom: 'Stylo', couleur: '#0f9f8f', sombre: '#0b7a6e' },
	controle: { nom: 'Contrôle', couleur: '#f08a1c', sombre: '#c56b0c' },
	variables: { nom: 'Variables', couleur: '#e2577a', sombre: '#b83d5d' },
	affichage: { nom: 'Affichage', couleur: '#8b5cf6', sombre: '#6d3fd6' },
	operateurs: { nom: 'Opérateurs', couleur: '#3fa34d', sombre: '#2d7d39' }
};

export type MorceauLibelle =
	| { genre: 'texte'; texte: string }
	| { genre: 'entree'; nom: string }
	| { genre: 'champ'; nom: string };

/** Découpe le libellé d'un bloc en texte, entrées numériques et champs. */
export function decouperLibelle(def: DefBloc): MorceauLibelle[] {
	const morceaux: MorceauLibelle[] = [];
	for (const partie of def.libelle.split(/(\{\w+\})/)) {
		if (!partie) continue;
		const m = /^\{(\w+)\}$/.exec(partie);
		if (m && def.champs?.includes(m[1])) morceaux.push({ genre: 'champ', nom: m[1] });
		else if (m) morceaux.push({ genre: 'entree', nom: m[1] });
		else morceaux.push({ genre: 'texte', texte: partie.trim() });
	}
	return morceaux.filter((m) => m.genre !== 'texte' || m.texte !== '');
}
