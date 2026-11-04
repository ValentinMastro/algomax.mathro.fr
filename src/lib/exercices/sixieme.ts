// Série d'exercices du niveau 6ème.
// Ancrage : chapitre « Instructions, séquences et déplacements » et
// enseignements transverses « pensée informatique » et « pensée algébrique ».
//
// Chaque exercice fabrique ses versions à partir d'un tirage `a` (cf. variantes.ts) :
// longueurs, sens des virages, orientation de départ, nombres des suites…
import {
	ajouter,
	avancer,
	avancerDe,
	droiteDe,
	ecrire,
	fois,
	gaucheDe,
	mettre,
	nFois,
	programme,
	repeter,
	styloBas,
	styloHaut,
	variable
} from '$lib/blocs/construire';
import { compterBlocs, pilePrincipale } from '$lib/blocs/operations';
import type { Pile } from '$lib/blocs/types';
import { executerTout } from '$lib/moteur/interpreteur';
import { robot as situationRobot, type Direction } from '$lib/situations/robot/robot';
import {
	blocsRobot,
	carteDepuisPas,
	cheminAuHasard,
	DIRECTIONS,
	impassesAuHasard,
	inverse,
	liste,
	n,
	parcourir,
	pluriel,
	programmeRobot,
	suite,
	taille,
	toileCentree,
	type PasRobot
} from './generateurs';
import type { Niveau } from './types';

const ROBOT = ['drapeau', 'avancer', 'tourner_gauche', 'tourner_droite'];
const ROBOT_GEMMES = [...ROBOT, 'ramasser'];
const CRAYON = ['drapeau', 'avancer_de', 'tourner_gauche_de', 'tourner_droite_de'];
const SUITES = ['drapeau', 'mettre', 'ajouter', 'ecrire', 'variable', 'repeter'];
const OPERATEURS = ['addition', 'soustraction', 'multiplication'];

const HORIZONTALES: Direction[] = ['E', 'O'];
const CAPS = [0, 90, 180, 270];
const SENS = ['G', 'D'] as const;
const nomSens = { G: 'à gauche', D: 'à droite' };

/** Nombre de blocs d'instruction de la solution. */
const blocsDe = (solution: Pile[]) => compterBlocs(pilePrincipale(solution)!.blocs);

/** Version « robot » dont la carte est construite sur le chemin de la solution. */
function robot(
	direction: Direction,
	pas: PasRobot[],
	limite: [number, number] = [10, 7],
	impasses: [number, number][] = []
) {
	const config = carteDepuisPas(direction, pas, impasses);
	const [l, h] = taille(config);
	if (l > limite[0] || h > limite[1]) return null;
	return { situation: 'robot' as const, config, solution: programmeRobot(pas) };
}

/** Virage du crayon, à gauche ou à droite. */
const virage = (sens: 'G' | 'D', angle: number) =>
	sens === 'G' ? gaucheDe(angle) : droiteDe(angle);

/** Version « crayon » : la figure cible est celle de la solution, centrée. */
function crayon(solution: Pile[], cap: number, variables: string[] = []) {
	const config = toileCentree(solution, cap, variables);
	return config && { situation: 'crayon' as const, config, solution };
}

const carreaux = (k: number) => pluriel(k, 'carreau').replace('carreaus', 'carreaux');

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
					situation: 'robot',
					blocs: ROBOT,
					enonce: (a) => {
						const v = robot(a.choisir(HORIZONTALES), n('A', a.entier(3, 7)));
						return (
							v && {
								...v,
								consigne:
									'Le robot doit atteindre le **drapeau**. Fais glisser des blocs depuis la palette et accroche-les sous le bloc « quand ▶ est cliqué », puis clique sur **Exécuter**.',
								indice:
									'Compte les cases entre le robot et le drapeau : il faut un bloc « avancer » par case.'
							}
						);
					}
				},
				{
					id: '1-2',
					titre: 'Le virage',
					situation: 'robot',
					blocs: ROBOT,
					enonce: (a) => {
						const pas = [...n('A', a.entier(2, 5)), a.choisir(SENS), ...n('A', a.entier(2, 4))];
						const v = robot(a.choisir(DIRECTIONS), pas);
						return (
							v && {
								...v,
								consigne:
									'Cette fois, le chemin tourne. Attention : « tourner » fait pivoter le robot **sur place**, sans le faire avancer.',
								indice:
									'Imagine-toi à la place du robot : regarde dans la direction de ses yeux. Au coin, tourne-t-il à ta gauche ou à ta droite ?'
							}
						);
					}
				},
				{
					id: '1-3',
					titre: 'Le chemin sinueux',
					situation: 'robot',
					blocs: ROBOT,
					enonce: (a) => {
						const direction = a.choisir(DIRECTIONS);
						const pas = cheminAuHasard(a, direction, 4, [2, 3]);
						const v = pas && robot(direction, pas);
						return (
							v && {
								...v,
								consigne: 'Guide le robot jusqu’au drapeau en suivant le chemin.',
								indice:
									'Utilise le bouton **Pas à pas** pour exécuter ton programme bloc par bloc et voir où le robot se trompe.'
							}
						);
					}
				},
				{
					id: '1-4',
					titre: 'La chasse aux gemmes',
					situation: 'robot',
					blocs: ROBOT_GEMMES,
					enonce: (a) => {
						const direction = a.choisir(DIRECTIONS);
						const chemin = cheminAuHasard(a, direction, 3, [2, 4]);
						if (!chemin) return null;
						// Deux gemmes sur des cases du chemin (ni le départ, ni le drapeau).
						const longueur = chemin.filter((p) => p === 'A').length;
						const g1 = a.entier(1, longueur - 1);
						const g2 = a.entier(1, longueur - 1);
						if (g1 === g2) return null;
						const pas: PasRobot[] = [];
						let k = 0;
						for (const p of chemin) {
							pas.push(p);
							if (p === 'A' && (++k === g1 || k === g2)) pas.push('P');
						}
						const v = robot(direction, pas);
						return (
							v && {
								...v,
								consigne:
									'Le robot doit **ramasser toutes les gemmes** puis arriver sur le drapeau. Le bloc « ramasser la gemme » ne fonctionne que si le robot est sur une gemme.',
								indice:
									'Écris d’abord le chemin jusqu’au drapeau, puis ajoute les blocs « ramasser » au bon endroit.'
							}
						);
					}
				},
				{
					id: '1-5',
					titre: 'Trouve l’erreur',
					situation: 'robot',
					blocs: ROBOT,
					enonce: (a) => {
						const direction = a.choisir(DIRECTIONS);
						const pas = cheminAuHasard(a, direction, 3, [2, 3]);
						const v = pas && robot(direction, pas);
						if (!v) return null;
						// L'erreur : un des virages est dans le mauvais sens.
						const virages = pas.flatMap((p, i) => (p === 'G' || p === 'D' ? [i] : []));
						const i = a.choisir(virages);
						const fautif = pas.map((p, k) => (k === i ? inverse(p as 'G' | 'D') : p));
						const programmeInitial = programmeRobot(fautif);
						const bilan = executerTout(
							pilePrincipale(programmeInitial)!.blocs,
							situationRobot,
							v.config
						);
						if (!bilan.erreur && situationRobot.verifier(bilan.scene, v.config).reussi) return null;
						return {
							...v,
							programmeInitial,
							consigne:
								'Le programme ci-dessous contient **une erreur**. Exécute-le pas à pas pour la trouver, puis corrige-le.',
							indice:
								'Le bloc surligné est celui qui vient d’être exécuté. Repère le moment où le robot ne va plus dans la bonne direction.'
						};
					}
				},
				{
					id: '1-6',
					titre: 'Le labyrinthe',
					situation: 'robot',
					blocs: ROBOT,
					enonce: (a) => {
						const direction = a.choisir(DIRECTIONS);
						const pas = cheminAuHasard(a, direction, 6, [1, 3]);
						if (!pas) return null;
						const impasses = impassesAuHasard(a, parcourir(direction, pas).cases, 3);
						if (impasses.length < 2) return null;
						const v = robot(direction, pas, [9, 7], impasses);
						return (
							v && {
								...v,
								consigne:
									'Trouve le chemin du labyrinthe et écris le programme qui mène le robot au drapeau.',
								indice:
									'Trace d’abord le chemin avec ton doigt sur l’écran, en disant à voix haute chaque instruction.'
							}
						);
					}
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
					situation: 'robot',
					blocs: [...ROBOT, 'repeter'],
					enonce: (a) => {
						const longueur = a.entier(8, 13);
						const v = robot(a.choisir(HORIZONTALES), n('A', longueur), [14, 1]);
						return (
							v && {
								...v,
								solution: programme(repeter(longueur, avancer())),
								maxBlocs: 2,
								consigne:
									'Le drapeau est très loin… et tu n’as droit qu’à **2 blocs** sous « quand ▶ est cliqué ». Le bloc « répéter » exécute plusieurs fois les blocs placés **à l’intérieur**.',
								indice:
									'Place un bloc « avancer » dans la bouche du bloc « répéter », et change le nombre de répétitions.'
							}
						);
					}
				},
				{
					id: '2-2',
					titre: 'L’escalier',
					situation: 'robot',
					blocs: [...ROBOT, 'repeter'],
					enonce: (a) => {
						const marches = a.entier(3, 5);
						const sens = a.choisir(SENS);
						const marche: PasRobot[] = ['A', sens, 'A', inverse(sens)];
						const pas = [...Array(marches).fill(marche).flat(), 'A'];
						const v = robot(a.choisir(HORIZONTALES), pas);
						const solution = programme(repeter(marches, blocsRobot(marche)), avancer());
						return (
							v && {
								...v,
								solution,
								maxBlocs: blocsDe(solution),
								consigne: `Le robot parcourt un escalier. Repère le **motif** qui se répète pour écrire un programme d’au plus **${blocsDe(solution)} blocs**.`,
								indice: `Une marche, c’est : avancer, tourner ${nomSens[sens]}, avancer, tourner ${nomSens[inverse(sens)]}. Combien y a-t-il de marches ? Que reste-t-il à faire à la fin ?`
							}
						);
					}
				},
				{
					id: '2-3',
					titre: 'Les gemmes alignées',
					situation: 'robot',
					blocs: [...ROBOT_GEMMES, 'repeter'],
					enonce: (a) => {
						const gemmes = a.entier(3, 6);
						const motif: PasRobot[] = [...n('A', a.entier(1, 2)), 'P', ...n('A', a.entier(1, 2))];
						const pas = Array(gemmes).fill(motif).flat();
						const v = robot(a.choisir(HORIZONTALES), pas, [14, 1]);
						const solution = programme(repeter(gemmes, blocsRobot(motif)));
						return (
							v && {
								...v,
								solution,
								maxBlocs: blocsDe(solution),
								consigne: `Ramasse toutes les gemmes et rejoins le drapeau, avec au plus **${blocsDe(solution)} blocs**.`,
								indice:
									'Entre deux gemmes, le robot fait toujours la même chose. Qu’est-ce qui se répète ?'
							}
						);
					}
				},
				{
					id: '2-4',
					titre: 'Le tour du lac',
					situation: 'robot',
					blocs: [...ROBOT, 'repeter'],
					enonce: (a) => {
						const cote = a.entier(3, 5);
						const sens = a.choisir(SENS);
						const pas = Array(3)
							.fill([...n('A', cote), sens])
							.flat();
						const v = robot(a.choisir(DIRECTIONS), pas);
						return (
							v && {
								...v,
								solution: programme(repeter(3, repeter(cote, avancer()), blocsRobot([sens]))),
								maxBlocs: 4,
								consigne:
									'Fais le tour du lac jusqu’au drapeau avec au plus **4 blocs**. Astuce : on peut placer un bloc « répéter » **dans** un autre bloc « répéter » !',
								indice: `Un côté du lac : avancer ${cote} fois. Combien de côtés le robot doit-il longer ?`
							}
						);
					}
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
					situation: 'crayon',
					blocs: CRAYON,
					enonce: (a) => {
						const solution = programme(
							avancerDe(a.entier(80, 180, 10)),
							virage(a.choisir(SENS), 90),
							avancerDe(a.entier(60, 140, 10))
						);
						const v = crayon(solution, a.choisir(CAPS));
						return (
							v && {
								...v,
								consigne:
									'Voici un **crayon** qui laisse une trace quand il avance. Reproduis la figure en pointillés. Le quadrillage est formé de carreaux de 10 pas.',
								indice:
									'Compte les carreaux pour trouver les longueurs. Un angle droit, c’est un quart de tour : 90 degrés.'
							}
						);
					}
				},
				{
					id: '3-2',
					titre: 'Le carré',
					situation: 'crayon',
					blocs: CRAYON,
					enonce: (a) => {
						const cote = a.entier(60, 140, 10);
						const sens = a.choisir(SENS);
						const solution = programme(nFois(4, () => [avancerDe(cote), virage(sens, 90)]));
						const v = crayon(solution, a.choisir(CAPS));
						return (
							v && {
								...v,
								consigne: 'Trace le carré en pointillés.',
								indice: 'Un carré a 4 côtés de même longueur et 4 angles droits.'
							}
						);
					}
				},
				{
					id: '3-3',
					titre: 'Le carré en 3 blocs',
					situation: 'crayon',
					blocs: [...CRAYON, 'repeter'],
					enonce: (a) => {
						const solution = programme(
							repeter(4, avancerDe(a.entier(60, 140, 10)), virage(a.choisir(SENS), 90))
						);
						const v = crayon(solution, a.choisir(CAPS));
						return (
							v && {
								...v,
								maxBlocs: 3,
								consigne: 'Trace ce carré avec au plus **3 blocs**.',
								indice: 'Pour tracer un carré, on répète 4 fois : « avancer », puis « tourner ».'
							}
						);
					}
				},
				{
					id: '3-4',
					titre: 'Le rectangle',
					situation: 'crayon',
					blocs: [...CRAYON, 'repeter'],
					enonce: (a) => {
						const longueur = a.entier(120, 220, 10);
						const largeur = a.entier(50, 120, 10);
						if (longueur - largeur < 40) return null;
						const sens = a.choisir(SENS);
						const [c1, c2] = a.pile() ? [longueur, largeur] : [largeur, longueur];
						const solution = programme(
							repeter(2, avancerDe(c1), virage(sens, 90), avancerDe(c2), virage(sens, 90))
						);
						const v = crayon(solution, a.choisir(CAPS));
						return (
							v && {
								...v,
								maxBlocs: 5,
								consigne: 'Trace ce rectangle avec au plus **5 blocs**.',
								indice:
									'Un rectangle n’a pas 4 côtés égaux, mais on peut répéter 2 fois : un côté, un angle, l’autre côté, un angle.'
							}
						);
					}
				},
				{
					id: '3-5',
					titre: 'Le triangle équilatéral',
					situation: 'crayon',
					blocs: [...CRAYON, 'repeter'],
					enonce: (a) => {
						const solution = programme(
							repeter(3, avancerDe(a.entier(100, 180, 10)), virage(a.choisir(SENS), 120))
						);
						const v = crayon(solution, a.choisir(CAPS));
						return (
							v && {
								...v,
								maxBlocs: 3,
								consigne:
									'Un triangle équilatéral a 3 côtés de même longueur et 3 angles de 60°. Trace celui du modèle avec au plus **3 blocs**.',
								indice:
									'Essaie de tourner de 60° et observe le résultat… Le crayon tourne de l’angle **extérieur** au triangle : de combien faut-il tourner pour faire demi-tour (180°) moins l’angle du triangle ?'
							}
						);
					}
				},
				{
					id: '3-6',
					titre: 'L’hexagone',
					situation: 'crayon',
					blocs: [...CRAYON, 'repeter'],
					enonce: (a) => {
						const solution = programme(
							repeter(6, avancerDe(a.entier(50, 90, 10)), virage(a.choisir(SENS), 60))
						);
						const v = crayon(solution, a.choisir(CAPS));
						return (
							v && {
								...v,
								maxBlocs: 3,
								consigne:
									'Trace cet hexagone régulier : 6 côtés de même longueur. Au bout du tracé, le crayon aura fait un tour complet sur lui-même.',
								indice: 'Un tour complet fait 360°, partagé en 6 virages égaux.'
							}
						);
					}
				},
				{
					id: '3-7',
					titre: 'La frise',
					situation: 'crayon',
					blocs: [...CRAYON, 'repeter', 'stylo_haut', 'stylo_bas'],
					enonce: (a) => {
						const carres = a.entier(3, 6);
						const cote = a.entier(20, 40, 10);
						const ecart = a.entier(10, 30, 10);
						const sens = a.choisir(SENS);
						const solution = programme(
							repeter(
								carres,
								repeter(4, avancerDe(cote), virage(sens, 90)),
								styloHaut(),
								avancerDe(cote + ecart),
								styloBas()
							)
						);
						const v = crayon(solution, a.choisir([0, 180]));
						return (
							v && {
								...v,
								maxBlocs: blocsDe(solution) + 1,
								consigne: `Trace la frise de **${carres} carrés**. Pour déplacer le crayon **sans laisser de trace**, relève le stylo… sans oublier de le reposer !`,
								indice: `Commence par écrire le programme d’un seul carré. Puis place-le dans un « répéter ${carres} fois », avec le déplacement jusqu’au carré suivant.`
							}
						);
					}
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
					situation: 'suites',
					blocs: SUITES,
					variables: ['n'],
					enonce: (a) => {
						const debut = a.entier(0, 5);
						const nombre = a.entier(5, 7);
						const attendu = suite(debut, 1, nombre);
						return {
							situation: 'suites',
							config: { attendu },
							consigne: `Une **variable** est une boîte qui porte un nom et contient un nombre. Ici, la boîte s’appelle **n**. Complète le programme pour qu’il écrive **${liste(attendu)}**.`,
							programmeInitial: programme(
								mettre('n', debut),
								repeter(nombre, ecrire(variable('n')))
							),
							indice:
								'Exécute le programme pas à pas en regardant le contenu de la boîte n. Il manque un bloc pour la faire augmenter de 1 à chaque tour.',
							solution: programme(
								mettre('n', debut),
								repeter(nombre, ecrire(variable('n')), ajouter('n', 1))
							)
						};
					}
				},
				{
					id: '4-2',
					titre: 'Les nombres pairs',
					situation: 'suites',
					blocs: SUITES,
					variables: ['n'],
					enonce: (a) => {
						const debut = a.entier(0, 16, 2);
						const nombre = a.entier(6, 10);
						return suiteReguliere(debut, 2, nombre, {
							consigne: `Écris la suite des nombres pairs : **${liste(suite(debut, 2, nombre))}**.`,
							indice:
								'Par quel nombre commence la suite ? De combien augmente-t-elle à chaque fois ?'
						});
					}
				},
				{
					id: '4-3',
					titre: 'Les sauts réguliers',
					situation: 'suites',
					blocs: SUITES,
					variables: ['n'],
					enonce: (a) => {
						const debut = a.entier(0, 9);
						const raison = a.entier(3, 6);
						const nombre = a.entier(6, 8);
						return suiteReguliere(debut, raison, nombre, {
							consigne: `Écris la suite : **${liste(suite(debut, raison, nombre))}**.`,
							indice: 'Calcule la différence entre deux nombres qui se suivent.'
						});
					}
				},
				{
					id: '4-4',
					titre: 'Le compte à rebours',
					situation: 'suites',
					blocs: SUITES,
					variables: ['n'],
					enonce: (a) => {
						const debut = a.entier(8, 15);
						return suiteReguliere(debut, -1, debut + 1, {
							consigne: `Écris le compte à rebours : **${liste(suite(debut, -1, debut + 1))}**.`,
							indice:
								'Ajouter un nombre négatif, c’est enlever : que se passe-t-il si on ajoute −1 ?'
						});
					}
				},
				{
					id: '4-5',
					titre: 'Le motif qui grandit',
					situation: 'suites',
					blocs: SUITES,
					variables: ['carreaux'],
					enonce: (a) => {
						const debut = a.entier(1, 4);
						const raison = a.entier(2, 3);
						const nombre = a.entier(6, 8);
						const attendu = suite(debut, raison, nombre);
						if (attendu.at(-1)! > 25) return null;
						return {
							situation: 'suites',
							config: { attendu, motif: 'carres' },
							maxBlocs: 4,
							consigne: `La figure 1 a **${carreaux(debut)}**, la figure 2 en a **${attendu[1]}**, la figure 3 en a **${attendu[2]}**… Chaque figure a ${carreaux(raison)} de plus que la précédente. Écris le nombre de carreaux des **${nombre} premières figures**.`,
							indice: `La variable « carreaux » commence à ${debut}. Que faut-il lui ajouter pour passer à la figure suivante ?`,
							solution: programme(
								mettre('carreaux', debut),
								repeter(nombre, ecrire(variable('carreaux')), ajouter('carreaux', raison))
							)
						};
					}
				},
				{
					id: '4-6',
					titre: 'La table de multiplication',
					situation: 'suites',
					blocs: [...SUITES, ...OPERATEURS],
					variables: ['n'],
					enonce: (a) => {
						const table = a.choisir([3, 4, 6, 7, 8, 9]);
						const attendu = suite(table, table, 10);
						return {
							situation: 'suites',
							config: { attendu },
							maxBlocs: 4,
							consigne: `Écris la table de ${table} : **${liste(attendu.slice(0, 3))}, …, ${attendu[9]}**. Tu peux utiliser un bloc de calcul : on peut glisser la variable **n** dans un emplacement blanc.`,
							indice:
								'Si n vaut 1, puis 2, puis 3… que faut-il écrire ? Glisse le bloc « × » dans « écrire », puis n dedans.',
							solution: programme(
								mettre('n', 1),
								repeter(10, ecrire(fois(variable('n'), table)), ajouter('n', 1))
							)
						};
					}
				},
				{
					id: '4-7',
					titre: 'Les nombres carrés',
					situation: 'suites',
					blocs: [...SUITES, ...OPERATEURS],
					variables: ['n'],
					enonce: (a) => {
						const premier = a.entier(1, 3);
						const nombre = a.entier(5, 7);
						const dernier = premier + nombre - 1;
						if (dernier > 7) return null;
						const consigne =
							premier === 1
								? `Écris les **${nombre} premiers nombres carrés**.`
								: `Écris les nombres carrés de **${premier} × ${premier} = ${premier * premier}** jusqu’à **${dernier} × ${dernier} = ${dernier * dernier}**.`;
						return {
							situation: 'suites',
							config: {
								attendu: suite(premier, 1, nombre).map((k) => k * k),
								motif: 'carres'
							},
							maxBlocs: 4,
							consigne: `Les nombres carrés comptent les carreaux de carrés de plus en plus grands : 1 × 1 = 1, 2 × 2 = 4, 3 × 3 = 9… ${consigne}`,
							indice: 'On peut mettre la même variable dans les deux emplacements du bloc « × ».',
							solution: programme(
								mettre('n', premier),
								repeter(nombre, ecrire(fois(variable('n'), variable('n'))), ajouter('n', 1))
							)
						};
					}
				},
				{
					id: '4-8',
					titre: 'La spirale',
					situation: 'crayon',
					blocs: [...CRAYON, 'repeter', 'mettre', 'ajouter', 'variable', ...OPERATEURS],
					variables: ['longueur'],
					enonce: (a) => {
						const debut = a.choisir([10, 20]);
						const pas = a.choisir([10, 20]);
						const segments = pas === 10 ? a.entier(10, 16) : a.entier(7, 10);
						const solution = programme(
							mettre('longueur', debut),
							repeter(
								segments,
								avancerDe(variable('longueur')),
								virage(a.choisir(SENS), 90),
								ajouter('longueur', pas)
							)
						);
						const v = crayon(solution, a.choisir(CAPS), ['longueur']);
						return (
							v && {
								...v,
								maxBlocs: 5,
								consigne: `Retour au crayon ! Trace la spirale : chaque segment mesure **${pas} pas de plus** que le précédent (${liste(suite(debut, pas, 3))}…). Utilise la variable **longueur**.`,
								indice: `Glisse la variable « longueur » dans le bloc « avancer de … pas », et pense à l’augmenter de ${pas} à chaque tour. Compte les segments du modèle.`
							}
						);
					}
				}
			]
		}
	]
};

/** Version d'un exercice « écris la suite » : n part de `debut` et augmente de `raison`. */
function suiteReguliere(
	debut: number,
	raison: number,
	nombre: number,
	textes: { consigne: string; indice: string }
) {
	return {
		situation: 'suites' as const,
		config: { attendu: suite(debut, raison, nombre) },
		maxBlocs: 4,
		...textes,
		solution: programme(
			mettre('n', debut),
			repeter(nombre, ecrire(variable('n')), ajouter('n', raison))
		)
	};
}

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
