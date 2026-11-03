<script lang="ts">
	import { egaux, formater, type ConfigSuites, type EtatSuites } from './suites';

	let { config, etat }: { config: ConfigSuites; etat: EtatSuites } = $props();

	const MAX_CARREAUX = 60;
</script>

<div class="suites">
	<div class="rangee">
		<span class="titre">Attendu</span>
		<div class="tuiles">
			{#each config.attendu as v, i (i)}
				<span class="tuile attendue">{formater(v)}</span>
			{/each}
		</div>
	</div>
	<div class="rangee">
		<span class="titre">Ton programme</span>
		<div class="tuiles">
			{#each etat.sortie as v, i (i)}
				<span class="tuile" class:juste={i < config.attendu.length && egaux(v, config.attendu[i])}>
					{formater(v)}
				</span>
			{:else}
				<span class="vide">rien pour l’instant</span>
			{/each}
		</div>
	</div>

	{#if config.motif === 'carres' && etat.sortie.length > 0}
		<div class="figures">
			{#each etat.sortie as v, i (i)}
				{@const n = Math.max(0, Math.min(MAX_CARREAUX, Math.round(v)))}
				<figure>
					<div class="carreaux" style:--cols={Math.max(1, Math.ceil(Math.sqrt(n)))}>
						{#each { length: n }, k (k)}
							<span></span>
						{/each}
					</div>
					<figcaption>Figure {i + 1}</figcaption>
				</figure>
			{/each}
		</div>
	{/if}
</div>

<style>
	.suites {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 12px;
		background: #fff;
		border-radius: 8px;
		min-height: 200px;
	}
	.rangee {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.titre {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-soft);
		font-weight: 600;
	}
	.tuiles {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		min-height: 38px;
	}
	.tuile {
		min-width: 38px;
		height: 38px;
		padding: 0 8px;
		display: grid;
		place-items: center;
		border-radius: 8px;
		font-weight: 700;
		font-size: 1.05rem;
		background: #fee2e2;
		color: #991b1b;
		border: 2px solid #fca5a5;
		animation: apparaitre 0.25s ease-out;
	}
	.tuile.juste {
		background: #dcfce7;
		color: #166534;
		border-color: #86efac;
	}
	.tuile.attendue {
		background: #f1f5f9;
		color: #64748b;
		border: 2px dashed #cbd5e1;
		animation: none;
	}
	.vide {
		color: var(--text-soft);
		font-style: italic;
		align-self: center;
	}
	.figures {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 14px;
		padding-top: 8px;
		border-top: 1px solid var(--border);
	}
	figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	.carreaux {
		display: grid;
		grid-template-columns: repeat(var(--cols), 12px);
		gap: 2px;
	}
	.carreaux span {
		width: 12px;
		height: 12px;
		background: #8b5cf6;
		border-radius: 2px;
	}
	figcaption {
		font-size: 0.75rem;
		color: var(--text-soft);
	}
	@keyframes apparaitre {
		from {
			transform: scale(0.6);
			opacity: 0;
		}
	}
</style>
