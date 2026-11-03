<script lang="ts">
	import { onDestroy } from 'svelte';
	import { clonerProgramme, programme as programmeVide } from '$lib/blocs/construire';
	import { compterBlocs, pilePrincipale } from '$lib/blocs/operations';
	import type { Pile } from '$lib/blocs/types';
	import Editeur from '$lib/editeur/Editeur.svelte';
	import type { Exercice, Sequence } from '$lib/exercices/types';
	import { Controleur } from '$lib/moteur/controleur.svelte';
	import { chargerProgramme, progression, sauverProgramme } from '$lib/progression.svelte';
	import SceneCrayon from '$lib/situations/crayon/SceneCrayon.svelte';
	import type { EtatCrayon } from '$lib/situations/crayon/crayon';
	import SceneRobot from '$lib/situations/robot/SceneRobot.svelte';
	import type { EtatRobot } from '$lib/situations/robot/robot';
	import SceneSuites from '$lib/situations/suites/SceneSuites.svelte';
	import { formater, type EtatSuites } from '$lib/situations/suites/suites';
	import { enrichir } from '$lib/texte';

	type ExerciceSitue = Exercice & { sequence: Sequence };

	let {
		exercice,
		precedent,
		suivant,
		numero,
		base
	}: {
		exercice: ExerciceSitue;
		precedent: ExerciceSitue | null;
		suivant: ExerciceSitue | null;
		numero: number;
		/** Chemin de la liste des exercices du niveau. */
		base: string;
	} = $props();

	// L'atelier est recréé à chaque changement d'exercice (cf. {#key} dans la page).
	// svelte-ignore state_referenced_locally
	const ex = exercice;

	const depart = () => clonerProgramme(ex.programmeInitial ?? programmeVide());
	let programme = $state<Pile[]>(chargerProgramme(ex.id) ?? depart());
	$effect(() => sauverProgramme(ex.id, $state.snapshot(programme)));

	const ctrl = new Controleur(
		ex,
		() => programme,
		() => progression.marquer(ex.id)
	);
	onDestroy(() => ctrl.detruire());

	const nbBlocs = $derived(compterBlocs(pilePrincipale(programme)?.blocs ?? []));
	const duree = $derived(Math.min(320, ctrl.delai * 0.8));

	let indice = $state(false);
	let confirmerEffacement = $state(false);

	function effacer() {
		if (!confirmerEffacement) {
			confirmerEffacement = true;
			setTimeout(() => (confirmerEffacement = false), 3000);
			return;
		}
		confirmerEffacement = false;
		ctrl.reinitialiser();
		programme = depart();
	}
</script>

<div class="atelier">
	<header>
		<a class="retour" href={base}>← Exercices</a>
		<div class="titre">
			<span class="sequence">Séquence {ex.sequence.id} · {ex.sequence.titre}</span>
			<h1>
				<span class="numero">{numero}</span>
				{ex.titre}
				{#if progression.estReussi(ex.id)}<span class="coche" title="Exercice réussi">✓</span>{/if}
			</h1>
		</div>
		<nav>
			{#if precedent}<a href="{base}/{precedent.id}" title="Exercice précédent">◀</a>{/if}
			{#if suivant}<a href="{base}/{suivant.id}" title="Exercice suivant">▶</a>{/if}
		</nav>
	</header>

	<section class="consigne">
		<p>{@html enrichir(ex.consigne)}</p>
		<div class="outils">
			{#if ex.maxBlocs}
				<span class="compteur" class:depasse={nbBlocs > ex.maxBlocs}>
					Blocs : {nbBlocs} / {ex.maxBlocs}
				</span>
			{/if}
			<button class="secondaire" onclick={() => (indice = !indice)}>💡 Indice</button>
			<button class="secondaire" onclick={effacer}>
				{confirmerEffacement ? 'Sûr ? Clique encore' : '↺ Recommencer'}
			</button>
		</div>
		{#if indice}
			<p class="indice">{@html enrichir(ex.indice)}</p>
		{/if}
	</section>

	<div class="espace">
		<div class="programme">
			<Editeur
				bind:programme
				blocs={ex.blocs}
				variables={ex.variables}
				actif={ctrl.actif}
				erreur={ctrl.erreur}
				verrouille={ctrl.enCours}
			/>
			{#if ctrl.enCours}
				<div class="bandeau">
					Programme en cours d’exécution : clique sur <strong>Réinitialiser</strong> pour le modifier.
				</div>
			{/if}
		</div>

		<aside>
			<div class="controles">
				{#if ctrl.statut === 'lecture'}
					<button class="principal" onclick={() => ctrl.pause()}>⏸ Pause</button>
				{:else}
					<button class="principal" onclick={() => ctrl.lancer()}>▶ Exécuter</button>
				{/if}
				<button onclick={() => ctrl.pas()} title="Exécuter le bloc suivant">⏭ Pas à pas</button>
				<button onclick={() => ctrl.reinitialiser()}>⏹ Réinitialiser</button>
				<label class="vitesse">
					<span>🐢</span>
					<input
						type="range"
						min="60"
						max="1000"
						step="20"
						value={1060 - ctrl.delai}
						oninput={(e) => (ctrl.delai = 1060 - Number(e.currentTarget.value))}
						aria-label="Vitesse"
					/>
					<span>🐇</span>
				</label>
			</div>

			<div class="scene">
				{#if ex.situation === 'robot'}
					<SceneRobot config={ex.config} etat={ctrl.scene as EtatRobot} {duree} />
				{:else if ex.situation === 'crayon'}
					<SceneCrayon config={ex.config} etat={ctrl.scene as EtatCrayon} {duree} />
				{:else}
					<SceneSuites config={ex.config} etat={ctrl.scene as EtatSuites} />
				{/if}
			</div>

			{#if ex.variables?.length}
				<div class="variables">
					{#each ex.variables as nom (nom)}
						<span class="variable"
							><span class="nom">{nom}</span><span class="valeur"
								>{formater(ctrl.variables[nom] ?? 0)}</span
							></span
						>
					{/each}
				</div>
			{/if}

			{#if ctrl.message}
				<div class="message {ctrl.message.genre}" role="status">
					<p>{ctrl.message.texte}</p>
					{#if ctrl.reussi && suivant}
						<a class="suivant" href="{base}/{suivant.id}">Exercice suivant →</a>
					{:else if ctrl.reussi}
						<a class="suivant" href={base}>Tu as terminé la série ! 🎉</a>
					{/if}
				</div>
			{/if}
		</aside>
	</div>
</div>

<style>
	.atelier {
		height: 100vh;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px 14px 14px;
	}

	header {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.retour {
		color: var(--accent);
		font-weight: 600;
		white-space: nowrap;
	}
	.titre {
		flex: 1;
		min-width: 0;
	}
	.sequence {
		font-size: 0.8rem;
		color: var(--text-soft);
	}
	h1 {
		margin: 0;
		font-size: 1.3rem;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.numero {
		display: inline-grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
		font-size: 0.95rem;
	}
	.coche {
		color: var(--vert);
	}
	nav {
		display: flex;
		gap: 6px;
	}
	nav a {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: var(--surface);
		border: 1px solid var(--border);
		color: var(--accent);
	}

	.consigne {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 10px 14px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 16px;
	}
	.consigne > p {
		flex: 1 1 400px;
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.45;
	}
	.outils {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.compteur {
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		white-space: nowrap;
	}
	.compteur.depasse {
		background: #fee2e2;
		color: var(--rouge);
	}
	.indice {
		flex-basis: 100%;
		margin: 0;
		padding: 8px 12px;
		border-radius: 8px;
		background: #fef9c3;
		color: #713f12;
	}

	.espace {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(320px, 440px);
		gap: 12px;
	}
	.programme {
		position: relative;
		min-height: 0;
	}
	.bandeau {
		position: absolute;
		left: 50%;
		bottom: 12px;
		transform: translateX(-50%);
		background: #1f2a44;
		color: #fff;
		padding: 6px 14px;
		border-radius: 999px;
		font-size: 0.85rem;
		white-space: nowrap;
	}

	aside {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-height: 0;
		overflow: auto;
	}
	.controles {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
	}
	button {
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text);
		border-radius: 8px;
		padding: 7px 12px;
		font-weight: 600;
	}
	button:hover {
		background: var(--surface-2);
	}
	button.principal {
		background: var(--vert);
		border-color: var(--vert);
		color: #fff;
	}
	button.principal:hover {
		background: #065f46;
	}
	button.secondaire {
		padding: 5px 10px;
	}
	.vitesse {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
	}
	.vitesse input {
		width: 90px;
	}

	.scene {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 10px;
	}

	.variables {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.variable {
		display: inline-flex;
		border-radius: 8px;
		overflow: hidden;
		border: 2px solid #e2577a;
		font-weight: 700;
	}
	.variable .nom {
		background: #e2577a;
		color: #fff;
		padding: 4px 10px;
	}
	.variable .valeur {
		background: #fff;
		padding: 4px 12px;
		min-width: 40px;
		text-align: center;
	}

	.message {
		border-radius: var(--radius);
		padding: 10px 14px;
		font-weight: 600;
	}
	.message p {
		margin: 0;
	}
	.message.succes {
		background: #dcfce7;
		color: #166534;
	}
	.message.erreur {
		background: #fee2e2;
		color: #991b1b;
	}
	.message.info {
		background: var(--accent-soft);
		color: #1e40af;
	}
	.suivant {
		display: inline-block;
		margin-top: 8px;
		padding: 6px 12px;
		border-radius: 8px;
		background: var(--vert);
		color: #fff;
	}

	@media (max-width: 900px) {
		.atelier {
			height: auto;
		}
		.espace {
			grid-template-columns: 1fr;
		}
		.programme {
			height: 60vh;
		}
	}
</style>
