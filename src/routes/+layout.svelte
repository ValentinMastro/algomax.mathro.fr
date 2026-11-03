<script lang="ts">
	import '../app.css';
	import TransitionEntree from '$lib/TransitionEntree.svelte';
	import TransitionExercice from '$lib/TransitionExercice.svelte';

	let { children } = $props();
</script>

<div class="page">
	{@render children()}
</div>
<TransitionExercice />
<TransitionEntree />

<style>
	:global(html:has(.page.en-voyage)),
	:global(html:has(.page.en-entree)) {
		overflow: hidden;
	}
	/* Pendant la transition, la page passe au-dessus du voile pour rapetisser
	   (ou grandir) exactement à la place de sa carte. */
	:global(.page.en-voyage) {
		position: relative;
		z-index: 5001;
		background: var(--bg);
		transform-origin: 50vw 50vh;
		pointer-events: none;
	}
</style>
