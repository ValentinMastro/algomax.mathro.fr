<script lang="ts">
	import type { Bloc as TBloc } from '$lib/blocs/types';
	import Bloc from './Bloc.svelte';

	let { blocs, inerte = false }: { blocs: TBloc[]; inerte?: boolean } = $props();
</script>

<div class="suite">
	{#each blocs as bloc (bloc.uid)}
		<Bloc {bloc} {inerte} />
	{/each}
</div>

<style>
	.suite {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
</style>
