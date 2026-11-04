<script lang="ts">
	import { onDestroy } from 'svelte';
	import { transition } from '$lib/transition.svelte';
	import { clonerProgramme, programme as programmeVide } from '$lib/blocs/construire';
	import { compterBlocs, pilePrincipale } from '$lib/blocs/operations';
	import type { Pile } from '$lib/blocs/types';
	import Editeur from '$lib/editeur/Editeur.svelte';
	import type { ModeleExercice, Sequence } from '$lib/exercices/types';
	import { versions, versionsAReussir } from '$lib/exercices/variantes';
	import { graine } from '$lib/graine.svelte';
	import { Controleur } from '$lib/moteur/controleur.svelte';
	import Reussite from '$lib/Reussite.svelte';
	import { chargerProgramme, progression, sauverProgramme } from '$lib/progression.svelte';
	import SceneCrayon from '$lib/situations/crayon/SceneCrayon.svelte';
	import type { EtatCrayon } from '$lib/situations/crayon/crayon';
	import SceneRobot from '$lib/situations/robot/SceneRobot.svelte';
	import type { EtatRobot } from '$lib/situations/robot/robot';
	import SceneSuites from '$lib/situations/suites/SceneSuites.svelte';
	import { formater, type EtatSuites } from '$lib/situations/suites/suites';
	import { enrichir } from '$lib/texte';

	type ExerciceSitue = ModeleExercice & { sequence: Sequence };

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
	const modele = exercice;

	// Versions de l'exercice : elles ne dépendent que de la graine.
	const g = graine.valeur;
	const lesVersions = versions(modele, g);
	const aReussir = versionsAReussir(modele);
	const valide = $derived(progression.estReussi(modele.id));
	const reussies = $derived(progression.reussites(modele.id, g));

	/** Version en cours : la prochaine à réussir (ou la première si l'exercice est validé). */
	let rang = $state(
		progression.estReussi(modele.id)
			? 0
			: Math.min(progression.reussites(modele.id, g), aReussir - 1)
	);
	const ex = $derived(lesVersions[rang]);

	const depart = () => clonerProgramme(ex.programmeInitial ?? programmeVide());
	let programme = $state<Pile[]>(chargerProgramme(modele.id) ?? depart());
	$effect(() => sauverProgramme(modele.id, $state.snapshot(programme)));

	// svelte-ignore state_referenced_locally
	const ctrl = new Controleur(ex, () => programme, surReussite);

	/** Durée de la célébration avant de passer à la version suivante. */
	const DUREE_CELEBRATION = 2000;
	let celebration = $state<{ cle: number; reussites: number } | null>(null);
	/** Une nouvelle version va être proposée : on ne relance pas le programme d'ici là. */
	let bascule = $state(false);
	const minuteurs = new Set<ReturnType<typeof setTimeout>>();
	const plusTard = (f: () => void, ms: number) => {
		const m = setTimeout(() => {
			minuteurs.delete(m);
			f();
		}, ms);
		minuteurs.add(m);
	};
	onDestroy(() => {
		ctrl.detruire();
		minuteurs.forEach(clearTimeout);
	});

	function surReussite() {
		const dejaValide = progression.estReussi(modele.id);
		const n = progression.reussir(modele.id, g, aReussir);
		const cle = Date.now();
		celebration = { cle, reussites: dejaValide ? aReussir : n };
		const duree = n >= aReussir ? DUREE_CELEBRATION + 600 : DUREE_CELEBRATION;
		plusTard(() => {
			if (celebration?.cle === cle) celebration = null;
		}, duree);
		if (!dejaValide && n < aReussir) {
			bascule = true;
			plusTard(() => {
				bascule = false;
				changerDeVersion(n);
				ctrl.message = {
					genre: 'info',
					texte: `Version ${n + 1} sur ${aReussir} : la situation a changé, adapte ton programme !`
				};
			}, duree);
		}
	}

	function changerDeVersion(r: number) {
		rang = r;
		ctrl.charger(lesVersions[r]);
		// Un programme de départ imposé (exercice « trouve l'erreur »…) change avec la version.
		if (lesVersions[r].programmeInitial) programme = depart();
	}

	const nbBlocs = $derived(compterBlocs(pilePrincipale(programme)?.blocs ?? []));
	const duree = $derived(Math.min(320, ctrl.delai * 0.8));

	/** Passe à l'exercice suivant avec la transition animée. */
	function allerAuSuivant(e: MouseEvent) {
		if (!suivant) return;
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		transition.lancer(`${base}/${suivant.id}`, ex.id, suivant.id);
	}

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
			<span class="sequence">Séquence {modele.sequence.id} · {modele.sequence.titre}</span>
			<h1>
				<span class="numero">{numero}</span>
				{modele.titre}
				{#if valide}<span class="coche" title="Exercice réussi">✓</span>{/if}
				{#if aReussir > 1}
					<span
						class="versions"
						title={valide
							? 'Exercice validé : clique sur une boule pour rejouer une version'
							: `Réussis ${aReussir} versions d’affilée pour valider l’exercice`}
					>
						{#each lesVersions as _, i (i)}
							<button
								class="point"
								class:gagne={valide || i < reussies}
								class:courant={i === rang}
								disabled={!valide || ctrl.enCours || bascule || i === rang}
								onclick={() => changerDeVersion(i)}
								aria-label="Version {i + 1}{valide || i < reussies ? ' (réussie)' : ''}"
							></button>
						{/each}
					</span>
				{/if}
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
					<button class="principal" onclick={() => ctrl.lancer()} disabled={bascule}
						>▶ Exécuter</button
					>
				{/if}
				<button onclick={() => ctrl.pas()} title="Exécuter le bloc suivant" disabled={bascule}
					>⏭ Pas à pas</button
				>
				<button onclick={() => ctrl.reinitialiser()} disabled={bascule}>⏹ Réinitialiser</button>
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
					{#if ctrl.reussi && valide && suivant}
						<a class="suivant" href="{base}/{suivant.id}" onclick={allerAuSuivant}
							>Exercice suivant →</a
						>
					{:else if ctrl.reussi && valide}
						<a class="suivant" href={base}>Tu as terminé la série ! 🎉</a>
					{/if}
				</div>
			{/if}
		</aside>
	</div>
</div>

{#if celebration}
	{#key celebration.cle}
		<Reussite reussites={celebration.reussites} total={aReussir} />
	{/key}
{/if}

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
	.versions {
		display: inline-flex;
		gap: 5px;
		margin-left: 4px;
	}
	.point {
		width: 14px;
		height: 14px;
		padding: 0;
		border-radius: 50%;
		border: none;
		background: #d1d5db;
		box-shadow: inset 0 -2px 3px rgb(0 0 0 / 0.12);
	}
	.point.gagne {
		background: var(--vert);
	}
	.point.courant {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.point:disabled {
		cursor: default;
	}
	.point:not(:disabled):hover {
		transform: scale(1.2);
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
	button:not(.point):hover:not(:disabled) {
		background: var(--surface-2);
	}
	button:disabled:not(.point) {
		opacity: 0.5;
		cursor: not-allowed;
	}
	button.principal {
		background: var(--vert);
		border-color: var(--vert);
		color: #fff;
	}
	button.principal:hover:not(:disabled) {
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
