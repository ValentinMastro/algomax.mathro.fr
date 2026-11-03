<script lang="ts">
	import { page } from '$app/state';
	import Atelier from '$lib/Atelier.svelte';
	import { trouverExercice } from '$lib/exercices/sixieme';

	const info = $derived(trouverExercice(page.params.id ?? ''));
</script>

<svelte:head>
	<title>{info ? `${info.exercice.titre} — Algomax` : 'Algomax'}</title>
</svelte:head>

{#if info}
	{#key info.exercice.id}
		<Atelier {...info} base="/6e" />
	{/key}
{:else}
	<main style="padding: 40px; text-align: center">
		<p>Cet exercice n’existe pas.</p>
		<a href="/6e">← Retour aux exercices</a>
	</main>
{/if}
