// Série d'exercices du niveau 6ème.
// Ancrage : chapitre « Instructions, séquences et déplacements » et
// enseignements transverses « pensée informatique » et « pensée algébrique ».
import {
	ajouter,
	avancer,
	avancerDe,
	droite,
	ecrire,
	fois,
	gauche,
	gaucheDe,
	mettre,
	nFois,
	programme,
	ramasser,
	repeter,
	styloBas,
	styloHaut,
	variable
} from '$lib/blocs/construire';
import type { Pile } from '$lib/blocs/types';
import { pilePrincipale } from '$lib/blocs/operations';
import { executerTout } from '$lib/moteur/interpreteur';
import { crayon, type ConfigCrayon } from '$lib/situations/crayon/crayon';
import type { Niveau } from './types';

const ROBOT = ['drapeau', 'avancer', 'tourner_gauche', 'tourner_droite'];
const ROBOT_GEMMES = [...ROBOT, 'ramasser'];
const CRAYON = ['drapeau', 'avancer_de', 'tourner_gauche_de', 'tourner_droite_de'];
const SUITES = ['drapeau', 'mettre', 'ajouter', 'ecrire', 'variable', 'repeter'];
const OPERATEURS = ['addition', 'soustraction', 'multiplication'];

/** Toile du crayon dont la figure cible est celle tracée par la solution. */
function toile(
	depart: ConfigCrayon['depart'],
	solution: Pile[],
	variables: string[] = []
): ConfigCrayon {
	const config: ConfigCrayon = { largeur: 400, hauteur: 300, depart, cible: [] };
	const pile = pilePrincipale(solution);
	config.cible = executerTout(pile?.blocs ?? [], crayon, config, variables).scene.segments;
	return config;
}

// Solutions des exercices de tracé, réutilisées pour calculer les figures cibles.
const sol = {
	angleDroit: programme(avancerDe(150), gaucheDe(90), avancerDe(100)),
	carre: programme(nFois(4, () => [avancerDe(100), gaucheDe(90)])),
	carreBoucle: programme(repeter(4, avancerDe(120), gaucheDe(90))),
	rectangle: programme(repeter(2, avancerDe(200), gaucheDe(90), avancerDe(100), gaucheDe(90))),
	triangle: programme(repeter(3, avancerDe(160), gaucheDe(120))),
	hexagone: programme(repeter(6, avancerDe(80), gaucheDe(60))),
	frise: programme(
		repeter(5, repeter(4, avancerDe(40), gaucheDe(90)), styloHaut(), avancerDe(60), styloBas())
	),
	spirale: programme(
		mettre('longueur', 10),
		repeter(16, avancerDe(variable('longueur')), gaucheDe(90), ajouter('longueur', 10))
	)
};

export const sixieme: Niveau = {
	id: '6e',
	titre: '6ème',
	sequences: [
		{
			id: '1',
			titre: 'Instructions et séquences',
			theme:
				'Identifier une instruction, produire et exécuter une séquence d’instructions, programmer un chemin simple.',
			exercices: [
				{
					id: '1-1',
					titre: 'Premiers pas',
					consigne:
						'Le robot doit atteindre le **drapeau**. Fais glisser des blocs depuis la palette et accroche-les sous le bloc « quand ▶ est cliqué », puis clique sur **Exécuter**.',
					situation: 'robot',
					config: { carte: ['R...F'], direction: 'E' },
					blocs: ROBOT,
					indice:
						'Compte les cases entre le robot et le drapeau : il faut un bloc « avancer » par case.',
					solution: programme(nFois(4, avancer))
				},
				{
					id: '1-2',
					titre: 'Le virage',
					consigne:
						'Cette fois, le chemin tourne. Attention : « tourner » fait pivoter le robot **sur place**, sans le faire avancer.',
					situation: 'robot',
					config: { carte: ['R...', '###.', '###.', '###F'], direction: 'E' },
					blocs: ROBOT,
					indice:
						'Imagine-toi à la place du robot : regarde dans la direction de ses yeux. Au coin, tourne-t-il à ta gauche ou à ta droite ?',
					solution: programme(nFois(3, avancer), droite(), nFois(3, avancer))
				},
				{
					id: '1-3',
					titre: 'Le chemin en U',
					consigne: 'Guide le robot jusqu’au drapeau en suivant le chemin.',
					situation: 'robot',
					config: { carte: ['R..#F', '##.#.', '##...'], direction: 'E' },
					blocs: ROBOT,
					indice:
						'Utilise le bouton **Pas à pas** pour exécuter ton programme bloc par bloc et voir où le robot se trompe.',
					solution: programme(
						avancer(),
						avancer(),
						droite(),
						avancer(),
						avancer(),
						gauche(),
						avancer(),
						avancer(),
						gauche(),
						avancer(),
						avancer()
					)
				},
				{
					id: '1-4',
					titre: 'La chasse aux gemmes',
					consigne:
						'Le robot doit **ramasser toutes les gemmes** puis arriver sur le drapeau. Le bloc « ramasser la gemme » ne fonctionne que si le robot est sur une gemme.',
					situation: 'robot',
					config: { carte: ['R.G..', '####.', 'F.G..'], direction: 'E' },
					blocs: ROBOT_GEMMES,
					indice:
						'Écris d’abord le chemin jusqu’au drapeau, puis ajoute les blocs « ramasser » au bon endroit.',
					solution: programme(
						avancer(),
						avancer(),
						ramasser(),
						avancer(),
						avancer(),
						droite(),
						avancer(),
						avancer(),
						droite(),
						avancer(),
						avancer(),
						ramasser(),
						avancer(),
						avancer()
					)
				},
				{
					id: '1-5',
					titre: 'Trouve l’erreur',
					consigne:
						'Le programme ci-dessous contient **une erreur**. Exécute-le pas à pas pour la trouver, puis corrige-le.',
					situation: 'robot',
					config: { carte: ['R...#', '###.#', 'F...#'], direction: 'E' },
					blocs: ROBOT,
					programmeInitial: programme(
						nFois(3, avancer),
						droite(),
						nFois(2, avancer),
						gauche(),
						nFois(3, avancer)
					),
					indice:
						'Le bloc surligné est celui qui vient d’être exécuté. Repère le moment où le robot ne va plus dans la bonne direction.',
					solution: programme(
						nFois(3, avancer),
						droite(),
						nFois(2, avancer),
						droite(),
						nFois(3, avancer)
					)
				},
				{
					id: '1-6',
					titre: 'Le labyrinthe',
					consigne:
						'Trouve le chemin du labyrinthe et écris le programme qui mène le robot au drapeau.',
					situation: 'robot',
					config: { carte: ['R.#...', '#.#.#.', '#...#F'], direction: 'E' },
					blocs: ROBOT,
					indice:
						'Trace d’abord le chemin avec ton doigt sur l’écran, en disant à voix haute chaque instruction.',
					solution: programme(
						avancer(),
						droite(),
						avancer(),
						avancer(),
						gauche(),
						avancer(),
						avancer(),
						gauche(),
						avancer(),
						avancer(),
						droite(),
						avancer(),
						avancer(),
						droite(),
						avancer(),
						avancer()
					)
				}
			]
		},
		{
			id: '2',
			titre: 'Répéter',
			theme:
				'Repérer une séquence qui se répète et utiliser une boucle « répéter » pour raccourcir un programme.',
			exercices: [
				{
					id: '2-1',
					titre: 'Le long couloir',
					consigne:
						'Le drapeau est très loin… et tu n’as droit qu’à **2 blocs** sous « quand ▶ est cliqué ». Le bloc « répéter » exécute plusieurs fois les blocs placés **à l’intérieur**.',
					situation: 'robot',
					config: { carte: ['R...........F'], direction: 'E' },
					blocs: [...ROBOT, 'repeter'],
					maxBlocs: 2,
					indice:
						'Place un bloc « avancer » dans la bouche du bloc « répéter », et change le nombre de répétitions.',
					solution: programme(repeter(12, avancer()))
				},
				{
					id: '2-2',
					titre: 'L’escalier',
					consigne:
						'Le robot descend un escalier. Repère le **motif** qui se répète pour écrire un programme d’au plus **6 blocs**.',
					situation: 'robot',
					config: {
						carte: ['R.####', '#..###', '##..##', '###..#', '####.F'],
						direction: 'E'
					},
					blocs: [...ROBOT, 'repeter'],
					maxBlocs: 6,
					indice:
						'Une marche, c’est : avancer, tourner à droite, avancer, tourner à gauche. Combien y a-t-il de marches ? Que reste-t-il à faire à la fin ?',
					solution: programme(repeter(4, avancer(), droite(), avancer(), gauche()), avancer())
				},
				{
					id: '2-3',
					titre: 'Les gemmes alignées',
					consigne: 'Ramasse toutes les gemmes et rejoins le drapeau, avec au plus **4 blocs**.',
					situation: 'robot',
					config: { carte: ['RG.G.G.GF'], direction: 'E' },
					blocs: [...ROBOT_GEMMES, 'repeter'],
					maxBlocs: 4,
					indice:
						'Entre deux gemmes, le robot fait toujours la même chose. Qu’est-ce qui se répète ?',
					solution: programme(repeter(4, avancer(), ramasser(), avancer()))
				},
				{
					id: '2-4',
					titre: 'Le tour du lac',
					consigne:
						'Fais le tour du lac jusqu’au drapeau avec au plus **4 blocs**. Astuce : on peut placer un bloc « répéter » **dans** un autre bloc « répéter » !',
					situation: 'robot',
					config: {
						carte: ['R....', '####.', '####.', '####.', 'F....'],
						direction: 'E'
					},
					blocs: [...ROBOT, 'repeter'],
					maxBlocs: 4,
					indice: 'Un côté du lac : avancer 4 fois. Combien de côtés le robot doit-il longer ?',
					solution: programme(repeter(3, repeter(4, avancer()), droite()))
				}
			]
		},
		{
			id: '3',
			titre: 'Construire des figures',
			theme:
				'Programmer des constructions géométriques : longueurs, angles, polygones réguliers, frises.',
			exercices: [
				{
					id: '3-1',
					titre: 'L’angle droit',
					consigne:
						'Voici un **crayon** qui laisse une trace quand il avance. Reproduis la figure en pointillés. Le quadrillage est formé de carreaux de 10 pas.',
					situation: 'crayon',
					config: toile({ x: 100, y: 80, cap: 0 }, sol.angleDroit),
					blocs: CRAYON,
					indice:
						'Compte les carreaux pour trouver les longueurs. Un angle droit, c’est un quart de tour : 90 degrés.',
					solution: sol.angleDroit
				},
				{
					id: '3-2',
					titre: 'Le carré',
					consigne: 'Trace le carré en pointillés.',
					situation: 'crayon',
					config: toile({ x: 150, y: 100, cap: 0 }, sol.carre),
					blocs: CRAYON,
					indice: 'Un carré a 4 côtés de même longueur et 4 angles droits.',
					solution: sol.carre
				},
				{
					id: '3-3',
					titre: 'Le carré en 3 blocs',
					consigne: 'Trace ce carré avec au plus **3 blocs**.',
					situation: 'crayon',
					config: toile({ x: 140, y: 90, cap: 0 }, sol.carreBoucle),
					blocs: [...CRAYON, 'repeter'],
					maxBlocs: 3,
					indice: 'Pour tracer un carré, on répète 4 fois : « avancer », puis « tourner ».',
					solution: sol.carreBoucle
				},
				{
					id: '3-4',
					titre: 'Le rectangle',
					consigne: 'Trace ce rectangle avec au plus **5 blocs**.',
					situation: 'crayon',
					config: toile({ x: 100, y: 100, cap: 0 }, sol.rectangle),
					blocs: [...CRAYON, 'repeter'],
					maxBlocs: 5,
					indice:
						'Un rectangle n’a pas 4 côtés égaux, mais on peut répéter 2 fois : une longueur, un angle, une largeur, un angle.',
					solution: sol.rectangle
				},
				{
					id: '3-5',
					titre: 'Le triangle équilatéral',
					consigne:
						'Un triangle équilatéral a 3 côtés de même longueur et 3 angles de 60°. Trace celui du modèle avec au plus **3 blocs**.',
					situation: 'crayon',
					config: toile({ x: 120, y: 70, cap: 0 }, sol.triangle),
					blocs: [...CRAYON, 'repeter'],
					maxBlocs: 3,
					indice:
						'Essaie de tourner de 60° et observe le résultat… Le crayon tourne de l’angle **extérieur** au triangle : de combien faut-il tourner pour faire demi-tour (180°) moins l’angle du triangle ?',
					solution: sol.triangle
				},
				{
					id: '3-6',
					titre: 'L’hexagone',
					consigne:
						'Trace cet hexagone régulier : 6 côtés de même longueur. Au bout du tracé, le crayon aura fait un tour complet sur lui-même.',
					situation: 'crayon',
					config: toile({ x: 160, y: 40, cap: 0 }, sol.hexagone),
					blocs: [...CRAYON, 'repeter'],
					maxBlocs: 3,
					indice: 'Un tour complet fait 360°, partagé en 6 virages égaux.',
					solution: sol.hexagone
				},
				{
					id: '3-7',
					titre: 'La frise',
					consigne:
						'Trace la frise de 5 carrés. Pour déplacer le crayon **sans laisser de trace**, relève le stylo… sans oublier de le reposer !',
					situation: 'crayon',
					config: toile({ x: 50, y: 130, cap: 0 }, sol.frise),
					blocs: [...CRAYON, 'repeter', 'stylo_haut', 'stylo_bas'],
					maxBlocs: 8,
					indice:
						'Commence par écrire le programme d’un seul carré. Puis place-le dans un « répéter 5 fois », avec le déplacement jusqu’au carré suivant.',
					solution: sol.frise
				}
			]
		},
		{
			id: '4',
			titre: 'Variables et suites',
			theme:
				'Découvrir la notion de variable ; produire une suite de nombres ou un motif évolutif (pensée algébrique).',
			exercices: [
				{
					id: '4-1',
					titre: 'La boîte n',
					consigne:
						'Une **variable** est une boîte qui porte un nom et contient un nombre. Ici, la boîte s’appelle **n**. Complète le programme pour qu’il écrive **1, 2, 3, 4, 5**.',
					situation: 'suites',
					config: { attendu: [1, 2, 3, 4, 5] },
					blocs: SUITES,
					variables: ['n'],
					programmeInitial: programme(mettre('n', 1), repeter(5, ecrire(variable('n')))),
					indice:
						'Exécute le programme pas à pas en regardant le contenu de la boîte n. Il manque un bloc pour la faire augmenter de 1 à chaque tour.',
					solution: programme(mettre('n', 1), repeter(5, ecrire(variable('n')), ajouter('n', 1)))
				},
				{
					id: '4-2',
					titre: 'Les nombres pairs',
					consigne: 'Écris la suite des nombres pairs : **2, 4, 6, 8, 10, 12, 14, 16, 18, 20**.',
					situation: 'suites',
					config: { attendu: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] },
					blocs: SUITES,
					variables: ['n'],
					maxBlocs: 4,
					indice: 'Par quel nombre commence la suite ? De combien augmente-t-elle à chaque fois ?',
					solution: programme(mettre('n', 2), repeter(10, ecrire(variable('n')), ajouter('n', 2)))
				},
				{
					id: '4-3',
					titre: 'De 3 en 3',
					consigne: 'Écris la suite : **1, 4, 7, 10, 13, 16, 19**.',
					situation: 'suites',
					config: { attendu: [1, 4, 7, 10, 13, 16, 19] },
					blocs: SUITES,
					variables: ['n'],
					maxBlocs: 4,
					indice: 'Calcule la différence entre deux nombres qui se suivent.',
					solution: programme(mettre('n', 1), repeter(7, ecrire(variable('n')), ajouter('n', 3)))
				},
				{
					id: '4-4',
					titre: 'Le compte à rebours',
					consigne: 'Écris le compte à rebours : **10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0**.',
					situation: 'suites',
					config: { attendu: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] },
					blocs: SUITES,
					variables: ['n'],
					maxBlocs: 4,
					indice: 'Ajouter un nombre négatif, c’est enlever : que se passe-t-il si on ajoute −1 ?',
					solution: programme(mettre('n', 10), repeter(11, ecrire(variable('n')), ajouter('n', -1)))
				},
				{
					id: '4-5',
					titre: 'Le motif qui grandit',
					consigne:
						'La figure 1 a **3** carreaux, la figure 2 en a **5**, la figure 3 en a **7**… Chaque figure a 2 carreaux de plus que la précédente. Écris le nombre de carreaux des **8 premières figures**.',
					situation: 'suites',
					config: { attendu: [3, 5, 7, 9, 11, 13, 15, 17], motif: 'carres' },
					blocs: SUITES,
					variables: ['carreaux'],
					maxBlocs: 4,
					indice:
						'La variable « carreaux » commence à 3. Que faut-il lui ajouter pour passer à la figure suivante ?',
					solution: programme(
						mettre('carreaux', 3),
						repeter(8, ecrire(variable('carreaux')), ajouter('carreaux', 2))
					)
				},
				{
					id: '4-6',
					titre: 'La table de 7',
					consigne:
						'Écris la table de 7 : **7, 14, 21, …, 70**. Tu peux utiliser un bloc de calcul : on peut glisser la variable **n** dans un emplacement blanc.',
					situation: 'suites',
					config: { attendu: [7, 14, 21, 28, 35, 42, 49, 56, 63, 70] },
					blocs: [...SUITES, ...OPERATEURS],
					variables: ['n'],
					maxBlocs: 4,
					indice:
						'Si n vaut 1, puis 2, puis 3… que faut-il écrire ? Glisse le bloc « × » dans « écrire », puis n dedans.',
					solution: programme(
						mettre('n', 1),
						repeter(10, ecrire(fois(variable('n'), 7)), ajouter('n', 1))
					)
				},
				{
					id: '4-7',
					titre: 'Les nombres carrés',
					consigne:
						'Les nombres carrés comptent les carreaux de carrés de plus en plus grands : 1 × 1 = 1, 2 × 2 = 4, 3 × 3 = 9… Écris les **6 premiers nombres carrés**.',
					situation: 'suites',
					config: { attendu: [1, 4, 9, 16, 25, 36], motif: 'carres' },
					blocs: [...SUITES, ...OPERATEURS],
					variables: ['n'],
					maxBlocs: 4,
					indice: 'On peut mettre la même variable dans les deux emplacements du bloc « × ».',
					solution: programme(
						mettre('n', 1),
						repeter(6, ecrire(fois(variable('n'), variable('n'))), ajouter('n', 1))
					)
				},
				{
					id: '4-8',
					titre: 'La spirale',
					consigne:
						'Retour au crayon ! Trace la spirale : chaque segment mesure **10 pas de plus** que le précédent (10, 20, 30…). Utilise la variable **longueur**.',
					situation: 'crayon',
					config: toile({ x: 200, y: 150, cap: 0 }, sol.spirale, ['longueur']),
					blocs: [...CRAYON, 'repeter', 'mettre', 'ajouter', 'variable', ...OPERATEURS],
					variables: ['longueur'],
					maxBlocs: 5,
					indice:
						'Glisse la variable « longueur » dans le bloc « avancer de … pas », et pense à l’augmenter de 10 à chaque tour. Compte les segments du modèle.',
					solution: sol.spirale
				}
			]
		}
	]
};

/** Exercices dans l'ordre de la série. */
export const exercicesSixieme = sixieme.sequences.flatMap((s) =>
	s.exercices.map((e) => ({ ...e, sequence: s }))
);

export function trouverExercice(id: string) {
	const i = exercicesSixieme.findIndex((e) => e.id === id);
	if (i < 0) return null;
	return {
		exercice: exercicesSixieme[i],
		precedent: exercicesSixieme[i - 1] ?? null,
		suivant: exercicesSixieme[i + 1] ?? null,
		numero: i + 1
	};
}
