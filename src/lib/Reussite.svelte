<!--
	Célébration au centre de l'écran quand une version d'un exercice est réussie :
	une boule par version à réussir, verte si elle est réussie, grise sinon.
	La boule qui vient d'être gagnée se remplit avec un rebond.
-->
<script lang="ts">
	let {
		reussites,
		total
	}: {
		/** Nombre de versions réussies, y compris celle qui vient de l'être. */
		reussites: number;
		total: number;
	} = $props();

	// La célébration est recréée à chaque réussite (cf. {#key} chez le parent).
	// svelte-ignore state_referenced_locally
	const fini = reussites >= total;
	// svelte-ignore state_referenced_locally
	const titre = fini ? 'Exercice validé !' : 'Bravo !';
	// svelte-ignore state_referenced_locally
	const sousTitre = fini
		? total > 1
			? `${total} versions réussies d’affilée`
			: 'Tu as réussi l’exercice'
		: `Version ${reussites} sur ${total} réussie · une nouvelle version arrive…`;
</script>

<div class="voile" class:fini aria-hidden="true">
	<div class="carte">
		<p class="titre">{titre}</p>
		<div class="boules">
			{#each { length: total }, i (i)}
				<span
					class="boule"
					class:gagnee={i < reussites - 1}
					class:nouvelle={i === reussites - 1}
					style:--i={i}
				>
					{#if i < reussites}<span class="coche">✓</span>{/if}
				</span>
			{/each}
		</div>
		<p class="sous-titre">{sousTitre}</p>
	</div>
</div>
<div class="sr-only" role="status">{titre} {sousTitre}</div>

<style>
	.voile {
		position: fixed;
		inset: 0;
		z-index: 4000;
		display: grid;
		place-items: center;
		pointer-events: none;
		background: radial-gradient(circle, rgb(255 255 255 / 0.55), transparent 60%);
		animation: voile 2s ease both;
	}
	.carte {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		padding: 22px 34px 18px;
		border-radius: 22px;
		background: var(--surface);
		box-shadow:
			0 20px 50px rgb(15 23 42 / 0.25),
			0 0 0 1px var(--border);
		animation: carte 2s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
	}
	.titre {
		margin: 0;
		font-size: 1.7rem;
		font-weight: 800;
		color: var(--vert);
	}
	.sous-titre {
		margin: 0;
		color: var(--text-soft);
		font-weight: 600;
	}
	.boules {
		display: flex;
		gap: 18px;
	}
	.boule {
		position: relative;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: radial-gradient(circle at 35% 30%, #e5e7eb, #9ca3af);
		box-shadow: inset 0 -4px 8px rgb(0 0 0 / 0.15);
		animation: apparition 0.4s calc(0.15s + var(--i) * 0.08s) cubic-bezier(0.3, 1.6, 0.5, 1) both;
	}
	.boule.gagnee,
	.boule.nouvelle {
		background: radial-gradient(circle at 35% 30%, #6ee7b7, #059669);
	}
	.boule.nouvelle {
		animation:
			apparition 0.4s calc(0.15s + var(--i) * 0.08s) cubic-bezier(0.3, 1.6, 0.5, 1) both,
			remplissage 0.55s 0.6s cubic-bezier(0.3, 1.8, 0.5, 1) both;
	}
	/* Onde qui part de la nouvelle boule. */
	.boule.nouvelle::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 3px solid #10b981;
		animation: onde 0.7s 0.7s ease-out both;
	}
	.coche {
		color: #fff;
		font-size: 1.5rem;
		font-weight: 900;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
	}
	.nouvelle .coche {
		animation: apparition 0.3s 0.75s cubic-bezier(0.3, 1.8, 0.5, 1) both;
	}
	.fini .carte {
		animation-duration: 2.6s;
	}
	.fini.voile {
		animation-duration: 2.6s;
	}

	@keyframes voile {
		0% {
			opacity: 0;
		}
		12%,
		82% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	@keyframes carte {
		0% {
			transform: scale(0.6) rotate(-4deg);
			opacity: 0;
		}
		14% {
			transform: scale(1) rotate(0);
			opacity: 1;
		}
		84% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(0.9) translateY(-20px);
			opacity: 0;
		}
	}
	@keyframes apparition {
		from {
			transform: scale(0);
		}
	}
	@keyframes remplissage {
		0% {
			background: radial-gradient(circle at 35% 30%, #e5e7eb, #9ca3af);
			transform: scale(1);
		}
		40% {
			transform: scale(1.3);
		}
		100% {
			transform: scale(1);
		}
	}
	@keyframes onde {
		from {
			transform: scale(1);
			opacity: 1;
		}
		to {
			transform: scale(2.2);
			opacity: 0;
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	@media (prefers-reduced-motion: reduce) {
		.carte,
		.boule,
		.boule.nouvelle,
		.boule.nouvelle::after,
		.nouvelle .coche {
			animation: none;
		}
	}
</style>
