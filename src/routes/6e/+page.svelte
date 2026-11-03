<script lang="ts">
	import { sixieme } from '$lib/exercices/sixieme';
	import { progression } from '$lib/progression.svelte';
	import { categories } from '$lib/blocs/catalogue';

	const icones = { robot: '🤖', crayon: '✏️', suites: '🔢' };
	const couleurs = ['mouvement', 'controle', 'stylo', 'variables'] as const;
	let numero = 0;
	const sequences = sixieme.sequences.map((s) => ({
		...s,
		exercices: s.exercices.map((e) => ({ ...e, numero: ++numero }))
	}));
</script>

<svelte:head>
	<title>Algomax — 6ème</title>
</svelte:head>

<main>
	<a class="retour" href="/">← Accueil</a>
	<h1>Programmer en 6ème</h1>

	{#each sequences as s, i (s.id)}
		<section style:--c={categories[couleurs[i % couleurs.length]].couleur}>
			<h2><span class="badge">{s.id}</span> {s.titre}</h2>
			<p class="theme">{s.theme}</p>
			<div class="exercices">
				{#each s.exercices as e (e.id)}
					<a class="exercice card" class:reussi={progression.estReussi(e.id)} href="/6e/{e.id}">
						<span class="numero">{e.numero}</span>
						<span class="nom">{e.titre}</span>
						<span class="icone" title={e.situation}>{icones[e.situation]}</span>
						{#if progression.estReussi(e.id)}<span class="coche">✓</span>{/if}
					</a>
				{/each}
			</div>
		</section>
	{/each}
</main>

<style>
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
