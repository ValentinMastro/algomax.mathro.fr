<script lang="ts">
	import { lireCarte, type ConfigRobot, type EtatRobot } from './robot';

	let { config, etat, duree }: { config: ConfigRobot; etat: EtatRobot; duree: number } = $props();

	const T = 56;
	const carte = $derived(lireCarte(config.carte));
	const cases = $derived(
		Array.from({ length: carte.hauteur }, (_, y) =>
			Array.from({ length: carte.largeur }, (_, x) => ({ x, y, mur: carte.murs.has(`${x},${y}`) }))
		).flat()
	);
	const chemin = $derived(
		etat.chemin.map(([x, y]) => `${x * T + T / 2},${y * T + T / 2}`).join(' ')
	);
</script>

<svg
	viewBox="-4 -4 {carte.largeur * T + 8} {carte.hauteur * T + 8}"
	role="img"
	aria-label="Terrain du robot"
	style:--duree="{duree}ms"
>
	{#each cases as c (`${c.x},${c.y}`)}
		{#if c.mur}
			<rect class="mur" x={c.x * T + 2} y={c.y * T + 2} width={T - 4} height={T - 4} rx="8" />
		{:else}
			<rect class="case" x={c.x * T + 2} y={c.y * T + 2} width={T - 4} height={T - 4} rx="8" />
		{/if}
	{/each}

	<polyline class="chemin" points={chemin} />

	{#if carte.drapeau}
		<text class="emoji" x={carte.drapeau[0] * T + T / 2} y={carte.drapeau[1] * T + T / 2}>🚩</text>
	{/if}
	{#each etat.gemmes as [x, y] (`${x},${y}`)}
		<text class="emoji" x={x * T + T / 2} y={y * T + T / 2}>💎</text>
	{/each}

	<g
		class="robot"
		class:choc={etat.choc}
		style:transform="translate({etat.x * T + T / 2}px, {etat.y * T + T / 2}px) rotate({etat.angle}deg)"
	>
		<g class="corps">
			<rect x="-15" y="-21" width="22" height="7" rx="3" class="roue" />
			<rect x="-15" y="14" width="22" height="7" rx="3" class="roue" />
			<rect x="-18" y="-16" width="34" height="32" rx="9" class="carrosserie" />
			<rect x="6" y="-11" width="9" height="22" rx="4" class="visiere" />
			<circle cx="11" cy="-5" r="2.6" class="oeil" />
			<circle cx="11" cy="5" r="2.6" class="oeil" />
		</g>
	</g>
</svg>

<style>
	svg {
		width: 100%;
		max-height: 100%;
		display: block;
	}
	.case {
		fill: #eef2f8;
		stroke: #dbe3ee;
	}
	.mur {
		fill: #64748b;
		stroke: #475569;
	}
	.chemin {
		fill: none;
		stroke: #93c5fd;
		stroke-width: 6;
		stroke-linecap: round;
		stroke-linejoin: round;
		opacity: 0.7;
	}
	.emoji {
		font-size: 30px;
		text-anchor: middle;
		dominant-baseline: central;
	}
	.robot {
		transition: transform var(--duree) ease-in-out;
	}
	.carrosserie {
		fill: #3d7ff5;
		stroke: #1e40af;
		stroke-width: 2;
	}
	.roue {
		fill: #1f2a44;
	}
	.visiere {
		fill: #1f2a44;
	}
	.oeil {
		fill: #7dd3fc;
	}
	.choc .carrosserie {
		fill: #ef4444;
		stroke: #991b1b;
	}
	.choc .corps {
		animation: secousse 0.4s ease-in-out 2;
	}
	@keyframes secousse {
		25% {
			transform: translateX(4px);
		}
		75% {
			transform: translateX(-4px);
		}
	}
</style>
