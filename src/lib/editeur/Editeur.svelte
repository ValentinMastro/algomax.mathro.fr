<script lang="ts">
	import { categories, definition } from '$lib/blocs/catalogue';
	import { cloner, creerBloc } from '$lib/blocs/construire';
	import { detacher, inserer, type Cible } from '$lib/blocs/operations';
	import type { Bloc as TBloc, Categorie, Pile } from '$lib/blocs/types';
	import Bloc from './Bloc.svelte';
	import Suite from './Suite.svelte';
	import { fournirContexte } from './contexte';

	let {
		programme = $bindable(),
		blocs,
		variables = [],
		actif = null,
		erreur = null,
		verrouille = false
	}: {
		programme: Pile[];
		/** Types de blocs proposés dans la palette. */
		blocs: string[];
		variables?: string[];
		actif?: string | null;
		erreur?: string | null;
		verrouille?: boolean;
	} = $props();

	// ── Palette ─────────────────────────────────────────────────────────────────
	const groupes = $derived.by(() => {
		const modeles: TBloc[] = [];
		for (const type of blocs) {
			const def = definition(type);
			if (def.champs?.length) {
				// Un modèle par variable pour le rapporteur, la première sinon.
				const noms = type === 'variable' ? variables : variables.slice(0, 1);
				for (const nom of noms) modeles.push(creerBloc(type, {}, { champs: { var: nom } }));
			} else {
				modeles.push(creerBloc(type));
			}
		}
		return (Object.keys(categories) as Categorie[])
			.map((cat) => ({
				cat,
				modeles: modeles.filter((m) => definition(m.type).categorie === cat)
			}))
			.filter((g) => g.modeles.length > 0);
	});

	// ── Glisser-déposer ───────────────────────────────────────────────────────────
	interface Glisse {
		blocs: TBloc[];
		dx: number;
		dy: number;
		x: number;
		y: number;
	}

	const SEUIL_AIMANT = 36;

	let zone: HTMLDivElement;
	let toile: HTMLDivElement;
	let palette: HTMLDivElement;
	let fantome: HTMLDivElement | undefined = $state();

	let glisse: Glisse | null = $state(null);
	let cible: Cible | null = $state(null);
	let indicateur: { x: number; y: number } | null = $state(null);
	let surPalette = $state(false);
	let attente: { uid: string; x: number; y: number; dx: number; dy: number } | null = null;

	fournirContexte({
		get variables() {
			return variables;
		},
		get actif() {
			return actif;
		},
		get erreur() {
			return erreur;
		},
		get verrouille() {
			return verrouille;
		},
		get entreeSurvolee() {
			return cible?.genre === 'entree' ? `${cible.uid}:${cible.nom}` : null;
		},
		saisir
	});

	function interrompreSaisie(e: PointerEvent): boolean {
		if (verrouille || e.button !== 0) return true;
		if ((e.target as HTMLElement).closest('input, select')) return true;
		e.stopPropagation();
		e.preventDefault();
		(document.activeElement as HTMLElement | null)?.blur?.();
		return false;
	}

	/** Saisie d'un bloc de la zone de script (le glissement démarre après un petit mouvement). */
	function saisir(e: PointerEvent, uid: string) {
		if (interrompreSaisie(e)) return;
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		attente = { uid, x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top };
		ecouter();
	}

	/** Saisie d'un modèle de la palette : on en glisse une copie. */
	function saisirModele(e: PointerEvent, modele: TBloc) {
		if (interrompreSaisie(e)) return;
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		glisse = {
			blocs: [cloner(modele)],
			dx: e.clientX - r.left,
			dy: e.clientY - r.top,
			x: e.clientX,
			y: e.clientY
		};
		ecouter();
	}

	function ecouter() {
		window.addEventListener('pointermove', bouger);
		window.addEventListener('pointerup', lacher);
		window.addEventListener('pointercancel', lacher);
	}

	function arreterEcoute() {
		window.removeEventListener('pointermove', bouger);
		window.removeEventListener('pointerup', lacher);
		window.removeEventListener('pointercancel', lacher);
	}

	const dans = (r: DOMRect, x: number, y: number) =>
		x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

	function bouger(e: PointerEvent) {
		if (attente && !glisse) {
			if (Math.hypot(e.clientX - attente.x, e.clientY - attente.y) < 5) return;
			const blocs = $state.snapshot(detacher(programme, attente.uid)) as TBloc[];
			glisse = { blocs, dx: attente.dx, dy: attente.dy, x: e.clientX, y: e.clientY };
			attente = null;
		}
		if (!glisse) return;
		glisse.x = e.clientX;
		glisse.y = e.clientY;
		surPalette = dans(palette.getBoundingClientRect(), e.clientX, e.clientY);
		chercherCible(e.clientX, e.clientY);
	}

	function chercherCible(px: number, py: number) {
		cible = null;
		indicateur = null;
		if (!glisse || surPalette || !dans(zone.getBoundingClientRect(), px, py)) return;

		const gx = glisse.x - glisse.dx;
		const gy = glisse.y - glisse.dy;
		const gh = fantome?.offsetHeight ?? 40;
		const t = toile.getBoundingClientRect();
		const forme = definition(glisse.blocs[0].type).forme;
		let meilleure = SEUIL_AIMANT;

		const proposer = (c: Cible, ax: number, ay: number, bx: number, by: number, montrer = true) => {
			const d = Math.hypot(ax - bx, ay - by);
			if (d >= meilleure) return;
			meilleure = d;
			cible = c;
			indicateur = montrer ? { x: bx - t.left, y: by - t.top } : null;
		};

		if (forme === 'rapporteur') {
			for (const el of zone.querySelectorAll<HTMLElement>('[data-entree]')) {
				const r = el.getBoundingClientRect();
				const c: Cible = { genre: 'entree', uid: el.dataset.entree!, nom: el.dataset.nom! };
				proposer(c, gx, gy + gh / 2, r.left, r.top + r.height / 2, false);
			}
			return;
		}

		if (forme !== 'chapeau') {
			for (const el of zone.querySelectorAll<HTMLElement>('.bloc[data-uid]')) {
				if (el.dataset.forme === 'rapporteur') continue;
				const r = el.getBoundingClientRect();
				proposer({ genre: 'apres', uid: el.dataset.uid! }, gx, gy, r.left, r.bottom - 6);
			}
			for (const el of zone.querySelectorAll<HTMLElement>('[data-corps]')) {
				const r = el.getBoundingClientRect();
				proposer({ genre: 'corps', uid: el.dataset.corps! }, gx, gy, r.left, r.top);
			}
		}
		for (const el of zone.querySelectorAll<HTMLElement>('[data-pile]')) {
			if (el.dataset.chapeau === 'true') continue;
			if (definition(glisse.blocs.at(-1)!.type).forme === 'rapporteur') continue;
			const r = el.getBoundingClientRect();
			proposer({ genre: 'avant-pile', pileId: el.dataset.pile! }, gx, gy + gh - 6, r.left, r.top);
		}
	}

	function lacher() {
		arreterEcoute();
		attente = null;
		if (!glisse) return;
		const { blocs } = glisse;
		const t = toile.getBoundingClientRect();
		const z = zone.getBoundingClientRect();
		let gx = glisse.x - glisse.dx;
		let gy = glisse.y - glisse.dy;

		if (!surPalette) {
			if (cible?.genre === 'avant-pile') {
				const id = cible.pileId;
				inserer(programme, cible, blocs);
				const pile = programme.find((p) => p.id === id);
				if (pile) {
					pile.x = Math.max(4, gx - t.left);
					pile.y = Math.max(4, gy - t.top);
				}
			} else if (cible) {
				inserer(programme, cible, blocs);
			} else {
				// Lâché ailleurs : le bloc reste dans la partie visible de la zone.
				gx = Math.min(Math.max(gx, z.left + 4), z.right - 60);
				gy = Math.min(Math.max(gy, z.top + 4), z.bottom - 40);
				inserer(programme, { genre: 'nouvelle-pile', x: gx - t.left, y: gy - t.top }, blocs);
			}
		}
		glisse = null;
		cible = null;
		indicateur = null;
		surPalette = false;
	}

	// Taille de la toile : elle s'agrandit avec les piles.
	const taille = $derived({
		l: Math.max(...programme.map((p) => p.x + 500), 0),
		h: Math.max(...programme.map((p) => p.y + 600), 0)
	});
</script>

<div class="editeur" class:verrouille>
	<div class="palette" class:poubelle={surPalette} bind:this={palette}>
		{#each groupes as g (g.cat)}
			<h3 style:--c={categories[g.cat].couleur}>{categories[g.cat].nom}</h3>
			{#each g.modeles as modele (modele.uid)}
				<div
					class="modele"
					role="button"
					tabindex="-1"
					onpointerdown={(e) => saisirModele(e, modele)}
				>
					<Bloc bloc={modele} inerte />
				</div>
			{/each}
		{/each}
		{#if surPalette}
			<div class="supprimer">Relâche pour supprimer</div>
		{/if}
	</div>

	<div class="zone" bind:this={zone}>
		<div
			class="toile"
			bind:this={toile}
			style:width="max(100%, {taille.l}px)"
			style:height="max(100%, {taille.h}px)"
		>
			{#each programme as pile (pile.id)}
				<div
					class="pile"
					data-pile={pile.id}
					data-chapeau={pile.blocs[0]?.type === 'drapeau'}
					style:left="{pile.x}px"
					style:top="{pile.y}px"
				>
					<Suite blocs={pile.blocs} />
				</div>
			{/each}
			{#if indicateur}
				<div class="indicateur" style:left="{indicateur.x}px" style:top="{indicateur.y}px"></div>
			{/if}
		</div>
	</div>
</div>

{#if glisse}
	<div
		class="fantome"
		bind:this={fantome}
		style:left="{glisse.x - glisse.dx}px"
		style:top="{glisse.y - glisse.dy}px"
	>
		<Suite blocs={glisse.blocs} inerte />
	</div>
{/if}

<style>
	.editeur {
		display: flex;
		min-height: 0;
		height: 100%;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.palette {
		position: relative;
		flex: none;
		width: 250px;
		overflow: auto;
		padding: 8px 12px 24px;
		background: var(--surface-2);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}
	.palette h3 {
		margin: 8px 0 0;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-soft);
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.palette h3::before {
		content: '';
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--c);
	}
	.modele {
		touch-action: none;
	}
	.palette.poubelle {
		background: #fee2e2;
	}
	.supprimer {
		position: sticky;
		bottom: 0;
		align-self: stretch;
		text-align: center;
		padding: 10px;
		border-radius: 8px;
		background: #b91c1c;
		color: #fff;
		font-weight: 600;
	}

	.zone {
		position: relative;
		flex: 1;
		min-width: 0;
		overflow: auto;
		background-color: #fbfcfe;
		background-image: radial-gradient(#d7deea 1px, transparent 1px);
		background-size: 20px 20px;
	}
	.toile {
		position: relative;
	}
	.pile {
		position: absolute;
	}
	.verrouille .zone :global(.bloc),
	.verrouille .modele {
		cursor: not-allowed;
	}

	.indicateur {
		position: absolute;
		width: 140px;
		height: 8px;
		margin-top: -2px;
		border-radius: 4px;
		background: rgba(31, 42, 68, 0.35);
		pointer-events: none;
		z-index: 2;
	}

	.fantome {
		position: fixed;
		z-index: 1000;
		pointer-events: none;
		opacity: 0.9;
		filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.25));
	}
</style>
