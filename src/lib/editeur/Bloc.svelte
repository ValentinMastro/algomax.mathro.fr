<script lang="ts">
	import { categories, decouperLibelle, definition } from '$lib/blocs/catalogue';
	import type { Bloc as TBloc } from '$lib/blocs/types';
	import Bloc from './Bloc.svelte';
	import Suite from './Suite.svelte';
	import { contexteEditeur } from './contexte';

	let { bloc, inerte = false }: { bloc: TBloc; inerte?: boolean } = $props();

	const ctx = contexteEditeur();
	const def = $derived(definition(bloc.type));
	const cat = $derived(categories[def.categorie]);
	const morceaux = $derived(decouperLibelle(def));

	const afficher = (n: number) => String(n).replace('.', ',');

	function lire(texte: string): number {
		const n = parseFloat(texte.replace(',', '.').replace('−', '-'));
		return Number.isFinite(n) ? n : 0;
	}

	function largeur(texte: string) {
		return `${Math.max(2, texte.length) + 1}ch`;
	}

	function saisir(e: PointerEvent) {
		if (inerte) return;
		ctx.saisir(e, bloc.uid);
	}
</script>

{#snippet libelle()}
	{#each morceaux as m, i (i)}
		{#if m.genre === 'texte'}
			<span class="texte">{m.texte}</span>
		{:else if m.genre === 'champ'}
			{#if inerte || ctx.variables.length <= 1}
				<span class="champ">{bloc.champs[m.nom]}</span>
			{:else}
				<select
					class="champ"
					value={bloc.champs[m.nom]}
					disabled={ctx.verrouille}
					onchange={(e) => (bloc.champs[m.nom] = e.currentTarget.value)}
				>
					{#each ctx.variables as v (v)}
						<option value={v}>{v}</option>
					{/each}
				</select>
			{/if}
		{:else}
			{@const v = bloc.entrees[m.nom]}
			<span
				class="emplacement"
				class:vide={typeof v === 'number'}
				class:survole={!inerte && ctx.entreeSurvolee === `${bloc.uid}:${m.nom}`}
				data-entree={inerte ? undefined : bloc.uid}
				data-nom={m.nom}
			>
				{#if typeof v !== 'number'}
					<Bloc bloc={v} {inerte} />
				{:else if inerte}
					<span class="nombre">{afficher(v)}</span>
				{:else}
					<input
						class="nombre"
						type="text"
						inputmode="decimal"
						aria-label={m.nom}
						value={afficher(v)}
						style:width={largeur(afficher(v))}
						disabled={ctx.verrouille}
						oninput={(e) => (e.currentTarget.style.width = largeur(e.currentTarget.value))}
						onchange={(e) => (bloc.entrees[m.nom] = lire(e.currentTarget.value))}
						onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
					/>
				{/if}
			</span>
		{/if}
	{/each}
{/snippet}

<div
	class="bloc {def.forme}"
	class:actif={!inerte && ctx.actif === bloc.uid}
	class:fautif={!inerte && ctx.erreur === bloc.uid}
	data-uid={inerte ? undefined : bloc.uid}
	data-forme={def.forme}
	style:--c={cat.couleur}
	style:--s={cat.sombre}
	onpointerdown={saisir}
	role="group"
>
	{#if def.forme === 'c'}
		<div class="ligne haut">{@render libelle()}</div>
		<div class="bouche">
			<div class="bras"></div>
			<div class="interieur" data-corps={inerte ? undefined : bloc.uid}>
				<Suite blocs={bloc.corps ?? []} {inerte} />
			</div>
		</div>
		<div class="ligne bas"></div>
	{:else}
		<div class="ligne">{@render libelle()}</div>
	{/if}
</div>

<style>
	.bloc {
		--encoche: 6px;
		position: relative;
		user-select: none;
		touch-action: none;
		cursor: grab;
		filter: drop-shadow(0 1px 0 var(--s));
		font-size: 14px;
		font-weight: 600;
		color: #fff;
	}
	.bloc.actif {
		filter: drop-shadow(0 0 3px #fde047) drop-shadow(0 0 3px #facc15);
		z-index: 1;
	}
	.bloc.fautif {
		filter: drop-shadow(0 0 3px #ef4444) drop-shadow(0 0 3px #dc2626);
		z-index: 1;
	}

	.ligne {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--c);
		white-space: nowrap;
		min-width: 60px;
	}

	/* Commande : encoche en haut, tenon en bas. */
	.commande {
		margin-bottom: calc(-1 * var(--encoche));
	}
	.commande > .ligne,
	.c > .haut {
		padding: 10px 12px 16px;
		min-height: 42px;
		clip-path: polygon(
			0 0,
			14px 0,
			18px 6px,
			34px 6px,
			38px 0,
			100% 0,
			100% calc(100% - 6px),
			38px calc(100% - 6px),
			34px 100%,
			18px 100%,
			14px calc(100% - 6px),
			0 calc(100% - 6px)
		);
		border-radius: 4px;
	}

	/* Chapeau : dôme en haut, tenon en bas. */
	.chapeau {
		margin-bottom: calc(-1 * var(--encoche));
	}
	.chapeau > .ligne {
		padding: 22px 12px 16px;
		min-width: 150px;
		clip-path: polygon(
			0 16px,
			1.4px 11.9px,
			5.4px 8px,
			11.7px 4.7px,
			20px 2.1px,
			29.6px 0.5px,
			40px 0,
			50.4px 0.5px,
			60px 2.1px,
			68.3px 4.7px,
			74.6px 8px,
			78.6px 11.9px,
			80px 16px,
			100% 16px,
			100% calc(100% - 6px),
			38px calc(100% - 6px),
			34px 100%,
			18px 100%,
			14px calc(100% - 6px),
			0 calc(100% - 6px)
		);
	}

	/* Bloc en C. */
	.c {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		margin-bottom: calc(-1 * var(--encoche));
	}
	.c > .haut {
		margin-bottom: calc(-1 * var(--encoche));
		clip-path: polygon(
			0 0,
			14px 0,
			18px 6px,
			34px 6px,
			38px 0,
			100% 0,
			100% calc(100% - 6px),
			54px calc(100% - 6px),
			50px 100%,
			34px 100%,
			30px calc(100% - 6px),
			0 calc(100% - 6px)
		);
	}
	.bouche {
		display: flex;
	}
	.bras {
		width: 16px;
		flex: none;
		background: var(--c);
	}
	.interieur {
		min-height: 30px;
		min-width: 80px;
		padding-bottom: var(--encoche);
	}
	.c > .bas {
		height: 30px;
		margin-top: calc(-1 * var(--encoche));
		clip-path: polygon(
			0 0,
			30px 0,
			34px 6px,
			50px 6px,
			54px 0,
			100% 0,
			100% calc(100% - 6px),
			38px calc(100% - 6px),
			34px 100%,
			18px 100%,
			14px calc(100% - 6px),
			0 calc(100% - 6px)
		);
	}

	/* Rapporteur : forme ovale. */
	.rapporteur {
		display: inline-flex;
		filter: none;
	}
	.rapporteur > .ligne {
		min-width: 0;
		min-height: 30px;
		padding: 3px 10px;
		border-radius: 999px;
		border: 1px solid var(--s);
	}

	/* Emplacements et champs. */
	.emplacement {
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
	}
	.emplacement.vide {
		background: #fff;
		min-width: 30px;
		min-height: 26px;
		justify-content: center;
	}
	.emplacement.survole {
		box-shadow:
			0 0 0 3px #fff,
			0 0 0 5px #1f2a44;
	}
	.nombre {
		color: #1f2a44;
		font: inherit;
		font-weight: 600;
		text-align: center;
		padding: 0 8px;
	}
	input.nombre {
		border: none;
		background: transparent;
		border-radius: 999px;
		height: 26px;
		padding: 0 4px;
		cursor: text;
	}
	input.nombre:focus {
		outline: 2px solid var(--s);
	}
	.champ {
		background: var(--s);
		color: #fff;
		border-radius: 999px;
		padding: 3px 10px;
		font: inherit;
		font-weight: 700;
		border: none;
	}
	select.champ {
		cursor: pointer;
	}
</style>
