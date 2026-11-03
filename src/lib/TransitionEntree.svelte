<!--
	Animation d'entrée dans un exercice depuis la liste : la tuile cliquée
	s'agrandit jusqu'à remplir l'écran, l'icône arrive en tournant au-dessus du
	titre, puis le panneau remonte comme un rideau pour dévoiler l'exercice.
-->
<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { transition, type Ouverture } from '$lib/transition.svelte';

	const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

	let actif: Ouverture | null = $state(null);
	let titreVisible = $state(false);
	let panneau: HTMLDivElement | undefined = $state();

	const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

	$effect(() => {
		const o = transition.ouverture;
		if (o) untrack(() => jouer(o));
	});

	async function jouer(o: Ouverture) {
		if (actif) return;
		actif = o;
		titreVisible = false;
		await tick();
		const page = document.querySelector<HTMLElement>('.page');
		if (!panneau || !page) return finir(page);
		const { x, y, l, h } = o.rect;

		// 1. La tuile s'agrandit et prend la couleur de sa séquence.
		await panneau.animate(
			[
				{
					left: `${x}px`,
					top: `${y}px`,
					width: `${l}px`,
					height: `${h}px`,
					borderRadius: '12px',
					backgroundColor: '#ffffff'
				},
				{ backgroundColor: o.couleur, offset: 0.45 },
				{
					left: '0px',
					top: '0px',
					width: '100vw',
					height: '100vh',
					borderRadius: '0px',
					backgroundColor: o.couleur
				}
			],
			{ duration: 650, easing: EASE, fill: 'forwards' }
		).finished;

		// 2. Titre au centre, pendant que la page de l'exercice se prépare derrière.
		titreVisible = true;
		page.classList.add('en-entree');
		await Promise.all([goto(o.url), attendre(1100)]);

		// 3. Le panneau remonte et dévoile l'exercice.
		page.animate(
			[
				{ transform: 'translateY(8vh) scale(0.97)', opacity: 0 },
				{ transform: 'none', opacity: 1 }
			],
			{ duration: 700, easing: EASE }
		);
		await panneau.animate([{ transform: 'none' }, { transform: 'translateY(-100%)' }], {
			duration: 700,
			easing: EASE,
			fill: 'forwards'
		}).finished;
		finir(page);
	}

	function finir(page: HTMLElement | null) {
		page?.classList.remove('en-entree');
		actif = null;
		titreVisible = false;
		transition.terminer();
	}
</script>

{#if actif}
	<div class="panneau" bind:this={panneau} style:--c={actif.couleur}>
		{#if titreVisible}
			<div class="contenu">
				<span class="icone">{actif.icone}</span>
				<span class="sequence">{actif.sequence}</span>
				<span class="numero">Exercice {actif.numero}</span>
				<h2>{actif.titre}</h2>
			</div>
		{/if}
	</div>
{/if}

<style>
	.panneau {
		position: fixed;
		z-index: 5000;
		overflow: hidden;
		display: grid;
		place-items: center;
		color: #fff;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
		cursor: wait;
	}
	.contenu {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		text-align: center;
		padding: 0 24px;
	}
	.icone {
		font-size: clamp(4rem, 12vh, 7rem);
		line-height: 1;
		margin-bottom: 12px;
		filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
		animation: icone 0.8s cubic-bezier(0.2, 1.3, 0.4, 1) both;
	}
	.sequence {
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		opacity: 0.85;
		animation: monte 0.5s ease-out 0.15s both;
	}
	.numero {
		font-size: 1.3rem;
		font-weight: 600;
		animation: monte 0.5s ease-out 0.25s both;
	}
	h2 {
		margin: 0;
		color: #fff;
		font-size: clamp(2.2rem, 6vw, 4.2rem);
		text-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
		animation: monte 0.55s cubic-bezier(0.2, 1.2, 0.4, 1) 0.35s both;
	}
	@keyframes icone {
		from {
			transform: scale(0) rotate(-360deg);
		}
	}
	@keyframes monte {
		from {
			opacity: 0;
			transform: translateY(24px);
		}
	}
</style>
