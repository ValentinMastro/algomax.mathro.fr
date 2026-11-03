<script lang="ts">
	import type { ConfigCrayon, EtatCrayon } from './crayon';

	let { config, etat, duree }: { config: ConfigCrayon; etat: EtatCrayon; duree: number } = $props();

	const lignesV = $derived(
		Array.from({ length: Math.floor(config.largeur / 10) + 1 }, (_, i) => i * 10)
	);
	const lignesH = $derived(
		Array.from({ length: Math.floor(config.hauteur / 10) + 1 }, (_, i) => i * 10)
	);
</script>

<svg
	viewBox="0 0 {config.largeur} {config.hauteur}"
	role="img"
	aria-label="Feuille du crayon"
	style:--duree="{duree}ms"
>
	<g transform="translate(0 {config.hauteur}) scale(1 -1)">
		{#each lignesV as x (x)}
			<line class="grille" class:forte={x % 50 === 0} x1={x} y1="0" x2={x} y2={config.hauteur} />
		{/each}
		{#each lignesH as y (y)}
			<line class="grille" class:forte={y % 50 === 0} x1="0" y1={y} x2={config.largeur} y2={y} />
		{/each}

		{#each config.cible as [x1, y1, x2, y2], i (i)}
			<line class="cible" {x1} {y1} {x2} {y2} />
		{/each}

		{#each etat.segments as [x1, y1, x2, y2], i (i)}
			<line class="trait" {x1} {y1} {x2} {y2} style:--l={Math.hypot(x2 - x1, y2 - y1)} />
		{/each}

		<g class="tortue" style:transform="translate({etat.x}px, {etat.y}px) rotate({etat.cap}deg)">
			<polygon points="11,0 -7,7 -4,0 -7,-7" class:leve={!etat.stylo} />
		</g>
	</g>
</svg>

<style>
	svg {
		width: 100%;
		max-height: 100%;
		display: block;
		background: #fff;
		border-radius: 8px;
	}
	.grille {
		stroke: #eef2f7;
		stroke-width: 0.6;
	}
	.grille.forte {
		stroke: #dbe3ee;
		stroke-width: 1;
	}
	.cible {
		stroke: #94a3b8;
		stroke-width: 3;
		stroke-dasharray: 6 5;
		stroke-linecap: round;
	}
	.trait {
		stroke: #0f9f8f;
		stroke-width: 3.5;
		stroke-linecap: round;
		stroke-dasharray: calc(var(--l) * 1px);
		animation: tracer var(--duree) ease-in-out both;
	}
	@keyframes tracer {
		from {
			stroke-dashoffset: calc(var(--l) * 1px);
		}
		to {
			stroke-dashoffset: 0;
		}
	}
	.tortue {
		transition: transform var(--duree) ease-in-out;
	}
	polygon {
		fill: #1f2a44;
		stroke: #1f2a44;
		stroke-width: 1.5;
		stroke-linejoin: round;
	}
	polygon.leve {
		fill: #fff;
	}
</style>
