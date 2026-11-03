<!--
	Transition « voyage » : la page rapetisse et devient une carte parmi tous les
	exercices du niveau ; la caméra traverse cette carte jusqu'au nouvel
	exercice, s'arrête pour afficher son titre, puis plonge dedans.
-->
<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { exercicesSixieme } from '$lib/exercices/sixieme';
	import { couleurSequence } from '$lib/exercices/couleurs';
	import { progression } from '$lib/progression.svelte';
	import { transition, type Demande } from '$lib/transition.svelte';

	const icones = { robot: '🤖', crayon: '✏️', suites: '🔢' };

	/** Échelle de la caméra quand on survole la carte des exercices. */
	const LOIN = 0.2;
	/** Échelle de l'arrêt sur le nouvel exercice, le temps de lire son titre. */
	const ARRET = 0.5;
	const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

	let actif: Demande | null = $state(null);
	let etape: 'depart' | 'voyage' | 'arrivee' = $state('depart');
	let W = $state(1);
	let H = $state(1);
	let monde: HTMLDivElement | undefined = $state();

	// Disposition : une rangée par séquence, une carte (taille de l'écran) par exercice.
	const ecartX = $derived(W * 0.22);
	const ecartY = $derived(H * 0.55);
	const cartes = $derived.by(() => {
		const rangs = new Map<string, number>();
		const parSequence = new Map<string, number>();
		return exercicesSixieme.map((e, i) => {
			if (!rangs.has(e.sequence.id)) rangs.set(e.sequence.id, rangs.size);
			const ligne = rangs.get(e.sequence.id)!;
			const col = parSequence.get(e.sequence.id) ?? 0;
			parSequence.set(e.sequence.id, col + 1);
			// Une rangée sur deux est décalée, pour un effet de parcours.
			const x = col * (W + ecartX) + (ligne % 2) * (W + ecartX) * 0.5;
			const y = ligne * (H + ecartY);
			return { ...e, numero: i + 1, x, y, ligne, col };
		});
	});
	const sequences = $derived(
		cartes
			.filter((c) => c.col === 0)
			.map((c) => ({ id: c.sequence.id, titre: c.sequence.titre, x: c.x, y: c.y }))
	);
	const chemin = $derived(cartes.map((c) => `${c.x + W / 2},${c.y + H / 2}`).join(' '));
	const etendue = $derived({
		l: Math.max(...cartes.map((c) => c.x)) + W,
		h: Math.max(...cartes.map((c) => c.y)) + H
	});

	const centre = (id: string) => {
		const c = cartes.find((c) => c.id === id)!;
		return { x: c.x + W / 2, y: c.y + H / 2 };
	};
	const camera = (c: { x: number; y: number }, s: number, r: number) =>
		`translate(${W / 2}px, ${H / 2}px) rotate(${r}deg) scale(${s}) translate(${-c.x}px, ${-c.y}px)`;
	const vue = (s: number, r: number) => `rotate(${r}deg) scale(${s})`;
	const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

	function animer(el: Element, images: Keyframe[] | PropertyIndexedKeyframes, duree: number) {
		return el.animate(images, { duration: duree, easing: EASE, fill: 'forwards' }).finished;
	}

	$effect(() => {
		const d = transition.demande;
		if (d) untrack(() => jouer(d));
	});

	async function jouer(d: Demande) {
		if (actif) return;
		W = innerWidth;
		H = innerHeight;
		actif = d;
		etape = 'depart';
		await tick();
		const page = document.querySelector<HTMLElement>('.page');
		if (!monde || !page) return finir(page);
		const A = centre(d.depuis);
		const B = centre(d.vers);
		monde.style.transform = camera(A, 1, 0);
		page.classList.add('en-voyage');

		// 1. Recul : la page rapetisse et se fond dans sa carte.
		page.animate({ opacity: [1, 1, 1, 0] }, { duration: 800, fill: 'forwards' });
		await Promise.all([
			animer(monde, { transform: [camera(A, 1, 0), camera(A, LOIN, -5)] }, 800),
			animer(page, { transform: [vue(1, 0), vue(LOIN, -5)] }, 800)
		]);

		// 2. Voyage jusqu'au nouvel exercice (la vraie page change, cachée).
		etape = 'voyage';
		const navigation = goto(d.url);
		const distance = Math.hypot(B.x - A.x, B.y - A.y);
		const loin = distance > 1.6 * (W + ecartX) ? LOIN * 0.6 : LOIN * 0.9;
		const milieu = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
		const dureeVoyage = Math.min(1600, 700 + distance / 6);
		await animer(
			monde,
			{ transform: [camera(A, LOIN, -5), camera(milieu, loin, 0), camera(B, LOIN, 5)] },
			dureeVoyage
		);
		await navigation;

		// 3. Approche et arrêt : le titre du nouvel exercice au centre.
		etape = 'arrivee';
		await animer(monde, { transform: [camera(B, LOIN, 5), camera(B, ARRET, 0)] }, 650);
		await attendre(650);

		// 4. Plongée dans le nouvel exercice.
		page.getAnimations().forEach((a) => a.cancel());
		page.animate({ opacity: [0, 1, 1, 1] }, { duration: 700, fill: 'forwards' });
		await Promise.all([
			animer(monde, { transform: [camera(B, ARRET, 0), camera(B, 1, 0)] }, 700),
			animer(page, { transform: [vue(ARRET, 0), vue(1, 0)] }, 700)
		]);
		finir(page);
	}

	function finir(page: HTMLElement | null) {
		page?.getAnimations().forEach((a) => a.cancel());
		page?.classList.remove('en-voyage');
		actif = null;
		transition.terminer();
	}
</script>

{#if actif}
	<div class="voile" class:arrivee={etape === 'arrivee'}>
		<div class="monde" bind:this={monde} style:--W="{W}px" style:--H="{H}px">
			<div
				class="fond"
				style:width="{etendue.l + 4 * W}px"
				style:height="{etendue.h + 4 * H}px"
				style:left="{-2 * W}px"
				style:top="{-2 * H}px"
			></div>
			<svg class="parcours" width={etendue.l} height={etendue.h} style:stroke-width={H * 0.035}>
				<polyline points={chemin} />
			</svg>
			{#each sequences as s (s.id)}
				<div
					class="etiquette"
					style:left="{s.x}px"
					style:top="{s.y - H * 0.32}px"
					style:--c={couleurSequence(Number(s.id))}
				>
					<span class="badge">{s.id}</span>
					{s.titre}
				</div>
			{/each}
			{#each cartes as c (c.id)}
				<div
					class="carte"
					class:depuis={c.id === actif.depuis}
					class:vers={c.id === actif.vers}
					class:reussie={progression.estReussi(c.id)}
					style:left="{c.x}px"
					style:top="{c.y}px"
					style:--c={couleurSequence(Number(c.sequence.id))}
				>
					<!-- Maquette de la page d'exercice, pour que le zoom s'y fonde. -->
					<div class="maquette">
						<div class="m-entete"></div>
						<div class="m-consigne"></div>
						<div class="m-espace">
							<div class="m-editeur">
								<div class="m-palette">
									<span></span><span></span><span></span><span></span>
								</div>
							</div>
							<div class="m-scene">{icones[c.situation]}</div>
						</div>
					</div>
					<div class="titre">
						<span class="seq">Séquence {c.sequence.id} · {c.sequence.titre}</span>
						<span class="num">Exercice {c.numero}</span>
						<strong>{c.titre}</strong>
					</div>
					{#if progression.estReussi(c.id)}<span class="coche">✓</span>{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.voile {
		position: fixed;
		inset: 0;
		z-index: 5000;
		overflow: hidden;
		background: #141c30;
		cursor: wait;
	}
	.monde {
		position: absolute;
		left: 0;
		top: 0;
		transform-origin: 0 0;
	}
	.fond {
		position: absolute;
		background-color: #141c30;
		background-image: radial-gradient(
			rgba(255, 255, 255, 0.14) calc(var(--H) * 0.012),
			transparent 0
		);
		background-size: calc(var(--H) * 0.25) calc(var(--H) * 0.25);
	}
	.parcours {
		position: absolute;
		left: 0;
		top: 0;
		overflow: visible;
	}
	.parcours polyline {
		fill: none;
		stroke: rgba(255, 255, 255, 0.25);
		stroke-dasharray: 0.1 2;
		stroke-dasharray: calc(var(--H) * 0.01) calc(var(--H) * 0.09);
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.etiquette {
		position: absolute;
		display: flex;
		align-items: center;
		gap: calc(var(--H) * 0.05);
		color: #fff;
		font-weight: 700;
		font-size: calc(var(--H) * 0.16);
		white-space: nowrap;
	}
	.etiquette .badge {
		display: inline-grid;
		place-items: center;
		width: calc(var(--H) * 0.24);
		height: calc(var(--H) * 0.24);
		border-radius: calc(var(--H) * 0.05);
		background: var(--c);
	}

	.carte {
		position: absolute;
		width: var(--W);
		height: var(--H);
		container-type: size;
		background: var(--bg);
		border-radius: 1.2cqh;
		overflow: hidden;
		box-shadow: 0 0 0 0.6cqh color-mix(in srgb, var(--c) 70%, transparent);
	}
	.carte.vers {
		box-shadow:
			0 0 0 1cqh var(--c),
			0 0 8cqh 4cqh color-mix(in srgb, var(--c) 60%, transparent);
	}
	.arrivee .carte.vers {
		animation: pulse 0.65s ease-in-out infinite alternate;
	}
	@keyframes pulse {
		to {
			box-shadow:
				0 0 0 1.4cqh var(--c),
				0 0 14cqh 6cqh color-mix(in srgb, var(--c) 70%, transparent);
		}
	}

	.maquette {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		gap: 1.2cqh;
		padding: 1.2cqh 1cqw 1.6cqh;
	}
	.m-entete {
		height: 4.5cqh;
		width: 30%;
		border-radius: 1cqh;
		background: #dfe5ef;
	}
	.m-consigne,
	.m-editeur,
	.m-scene {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 1.4cqh;
	}
	.m-consigne {
		height: 5.5cqh;
	}
	.m-espace {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 31%;
		gap: 1cqw;
	}
	.m-editeur {
		display: flex;
		overflow: hidden;
	}
	.m-palette {
		width: 18cqw;
		background: #f8fafc;
		border-right: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		gap: 1.6cqh;
		padding: 2cqh 1cqw;
	}
	.m-palette span {
		height: 3.6cqh;
		border-radius: 0.6cqh;
		background: var(--c);
		opacity: 0.8;
	}
	.m-palette span:nth-child(2) {
		width: 70%;
	}
	.m-palette span:nth-child(4) {
		width: 85%;
	}
	.m-scene {
		align-self: start;
		height: 45cqh;
		display: grid;
		place-items: center;
		font-size: 16cqh;
	}

	/* Le titre au centre de la carte. */
	.titre {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5cqh;
		text-align: center;
		color: #fff;
		background: color-mix(in srgb, var(--c) 88%, transparent);
	}
	.depuis .titre {
		background: color-mix(in srgb, var(--c) 70%, transparent);
	}
	.titre .seq {
		font-size: 4.5cqh;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.85;
	}
	.titre .num {
		font-size: 6cqh;
		font-weight: 600;
	}
	.titre strong {
		font-size: 15cqh;
		line-height: 1.05;
		padding: 0 4cqw;
		text-shadow: 0 0.5cqh 3cqh rgba(0, 0, 0, 0.25);
	}
	.coche {
		position: absolute;
		top: 3cqh;
		right: 2cqw;
		width: 12cqh;
		height: 12cqh;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--vert);
		color: #fff;
		font-size: 7cqh;
		font-weight: 700;
	}
</style>
