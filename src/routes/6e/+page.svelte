<script lang="ts">
	import { sixieme } from '$lib/exercices/sixieme';
	import { progression } from '$lib/progression.svelte';
	import { couleurSequence } from '$lib/exercices/couleurs';
	import { transition } from '$lib/transition.svelte';
	import { VERSIONS, versionsAReussir } from '$lib/exercices/variantes';
	import { graine } from '$lib/graine.svelte';

	const icones = { robot: '🤖', crayon: '✏️', suites: '🔢' };
	let numero = 0;
	const sequences = sixieme.sequences.map((s) => ({
		...s,
		exercices: s.exercices.map((e) => ({ ...e, numero: ++numero }))
	}));

	type ExerciceNumerote = (typeof sequences)[number]['exercices'][number];

	/** Ouvre l'exercice avec l'animation d'entrée (clic simple uniquement). */
	function ouvrir(e: MouseEvent, ex: ExerciceNumerote, s: (typeof sequences)[number], i: number) {
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		transition.ouvrir({
			url: `/6e/${ex.id}`,
			rect: { x: r.left, y: r.top, l: r.width, h: r.height },
			numero: ex.numero,
			titre: ex.titre,
			sequence: `Séquence ${s.id} · ${s.titre}`,
			couleur: couleurSequence(i + 1),
			icone: icones[ex.situation]
		});
	}

	const choisi = $derived(transition.ouverture?.url);
</script>

<svelte:head>
	<title>Algomax — 6ème</title>
</svelte:head>

<main class:depart={!!choisi}>
	<a class="retour" href="/">← Accueil</a>
	<h1>Programmer en 6ème</h1>
	<p class="graine">
		Chaque exercice se valide en réussissant <strong>{VERSIONS} versions d’affilée</strong>. Graine
		:
		<a href="/graine">{graine.valeur}</a>
	</p>

	{#each sequences as s, i (s.id)}
		<section style:--c={couleurSequence(i + 1)}>
			<h2><span class="badge">{s.id}</span> {s.titre}</h2>
			<p class="theme">{s.theme}</p>
			<div class="exercices">
				{#each s.exercices as e (e.id)}
					<a
						class="exercice card"
						class:reussi={progression.estReussi(e.id)}
						class:choisi={choisi === `/6e/${e.id}`}
						href="/6e/{e.id}"
						onclick={(ev) => ouvrir(ev, e, s, i)}
					>
						<span class="numero">{e.numero}</span>
						<span class="nom">{e.titre}</span>
						<span class="icone" title={e.situation}>{icones[e.situation]}</span>
						{#if progression.estReussi(e.id)}
							<span class="coche">✓</span>
						{:else if progression.reussites(e.id, graine.valeur) > 0}
							{@const n = progression.reussites(e.id, graine.valeur)}
							<span class="points" title="{n} version{n > 1 ? 's' : ''} réussie{n > 1 ? 's' : ''}">
								{#each { length: versionsAReussir(e) }, k (k)}
									<span class:gagne={k < n}></span>
								{/each}
							</span>
						{/if}
					</a>
				{/each}
			</div>
		</section>
	{/each}
</main>

<style>
	/* Pendant l'ouverture d'un exercice, le reste de la page s'efface. */
	main > :global(*) {
		transition:
			opacity 0.35s ease,
			transform 0.35s ease;
	}
	.depart > :global(*:not(section)),
	.depart .theme,
	.depart h2,
	.depart .exercice:not(.choisi) {
		opacity: 0;
		transform: scale(0.92);
		transition:
			opacity 0.35s ease,
			transform 0.35s ease;
	}
	.depart .exercice.choisi {
		visibility: hidden;
	}
	main {
		max-width: 1000px;
		margin: 0 auto;
		padding: 24px 20px 60px;
	}
	.retour {
		color: var(--accent);
		font-weight: 600;
	}
	h1 {
		font-size: 2rem;
	}
	section {
		margin-bottom: 32px;
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0 0 4px;
	}
	.badge {
		display: inline-grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		background: var(--c);
		color: #fff;
	}
	.theme {
		margin: 0 0 12px 44px;
		color: var(--text-soft);
	}
	.exercices {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
		gap: 10px;
	}
	.exercice {
		position: relative;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border-left: 5px solid var(--c);
		transition: transform 0.1s ease;
	}
	.exercice:hover {
		transform: translateY(-2px);
	}
	.exercice.reussi {
		background: #f0fdf4;
	}
	.numero {
		font-weight: 700;
		color: var(--text-soft);
		min-width: 1.5em;
	}
	.nom {
		flex: 1;
		font-weight: 600;
	}
	.graine {
		margin: -8px 0 24px;
		color: var(--text-soft);
	}
	.graine a {
		font-weight: 700;
		color: var(--accent);
	}
	.points {
		position: absolute;
		top: -5px;
		right: 8px;
		display: flex;
		gap: 3px;
	}
	.points span {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: #d1d5db;
		border: 1.5px solid var(--surface);
	}
	.points span.gagne {
		background: var(--vert);
	}
	.coche {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 24px;
		height: 24px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--vert);
		color: #fff;
		font-size: 0.8rem;
		font-weight: 700;
	}
</style>
