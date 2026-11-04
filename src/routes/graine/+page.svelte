<script lang="ts">
	import { trouverExercice } from '$lib/exercices/sixieme';
	import { versions } from '$lib/exercices/variantes';
	import { estGraine, graine } from '$lib/graine.svelte';
	import { robot, type ConfigRobot } from '$lib/situations/robot/robot';
	import SceneRobot from '$lib/situations/robot/SceneRobot.svelte';

	// Un champ numérique lié renvoie un nombre, ou `null` quand il est vide.
	let saisie = $state<number | null>(graine.valeur);
	const valeur = $derived(saisie ?? NaN);
	const valide = $derived(estGraine(valeur));

	function changer() {
		if (valide) graine.valeur = valeur;
	}

	function auHasard() {
		saisie = Math.floor(Math.random() * 10000);
		changer();
	}

	// Aperçu : les versions de « Le virage » avec la graine choisie.
	const exemple = trouverExercice('1-2')!.exercice;
	const apercu = $derived(versions(exemple, graine.valeur).map((v) => v.config as ConfigRobot));
</script>

<svelte:head>
	<title>Graine — Algomax</title>
</svelte:head>

<main>
	<a class="retour" href="/">← Accueil</a>
	<h1>Graine des exercices</h1>

	<p class="explication">
		Chaque exercice existe en plusieurs <strong>versions</strong> (chemin différent, autres
		longueurs, autres nombres…). La <strong>graine</strong> est le nombre entier qui décide de ces versions
		: deux élèves qui ont la même graine ont exactement les mêmes exercices.
	</p>

	<div class="champ card">
		<label for="graine">Graine</label>
		<input
			id="graine"
			type="number"
			step="1"
			inputmode="numeric"
			bind:value={saisie}
			oninput={changer}
			aria-invalid={!valide}
			aria-describedby="aide"
		/>
		<button onclick={auHasard}>🎲 Au hasard</button>
		<p id="aide" class:erreur={!valide}>
			{#if valide}
				Graine actuelle : <strong>{graine.valeur}</strong>{graine.valeur === 0
					? ' (graine par défaut)'
					: ''}.
			{:else}
				Entre un nombre entier (sans virgule), par exemple 0, 7 ou 2024.
			{/if}
		</p>
	</div>

	<p class="note">
		Changer de graine ne retire pas les exercices déjà validés, mais les séries de versions en cours
		recommencent avec les nouvelles versions.
	</p>

	<section>
		<h2>Aperçu : les {apercu.length} versions de « {exemple.titre} »</h2>
		<div class="apercu">
			{#each apercu as config, i (i)}
				<figure class="card">
					<SceneRobot {config} etat={robot.etatInitial(config)} duree={0} />
					<figcaption>Version {i + 1}</figcaption>
				</figure>
			{/each}
		</div>
	</section>
</main>

<style>
	main {
		max-width: 900px;
		margin: 0 auto;
		padding: 32px 20px 48px;
	}
	.retour {
		color: var(--accent);
		font-weight: 600;
	}
	h1 {
		font-size: 2rem;
	}
	.explication {
		font-size: 1.05rem;
		line-height: 1.5;
		max-width: 680px;
	}
	.champ {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		padding: 18px 20px;
		max-width: 680px;
	}
	label {
		font-weight: 700;
		font-size: 1.1rem;
	}
	input {
		width: 160px;
		font: inherit;
		font-size: 1.4rem;
		font-weight: 700;
		padding: 6px 12px;
		border-radius: 10px;
		border: 2px solid var(--border);
	}
	input:focus {
		outline: none;
		border-color: var(--accent);
	}
	input[aria-invalid='true'] {
		border-color: var(--rouge);
	}
	button {
		font: inherit;
		font-weight: 600;
		padding: 8px 14px;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
	}
	button:hover {
		background: var(--surface-2);
	}
	#aide {
		flex-basis: 100%;
		margin: 0;
		color: var(--text-soft);
	}
	#aide.erreur {
		color: var(--rouge);
		font-weight: 600;
	}
	.note {
		color: var(--text-soft);
		max-width: 680px;
	}
	h2 {
		font-size: 1.2rem;
		margin-top: 32px;
	}
	.apercu {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 12px;
	}
	figure {
		margin: 0;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	figure :global(svg) {
		max-height: 200px;
	}
	figcaption {
		text-align: center;
		color: var(--text-soft);
		font-weight: 600;
	}
</style>
