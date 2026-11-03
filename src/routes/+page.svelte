<script lang="ts">
	import { exercicesSixieme } from '$lib/exercices/sixieme';
	import { progression } from '$lib/progression.svelte';

	const reussis = $derived(exercicesSixieme.filter((e) => progression.estReussi(e.id)).length);
</script>

<svelte:head>
	<title>Algomax — apprendre à programmer</title>
</svelte:head>

<main>
	<header>
		<h1>Algo<span>max</span></h1>
		<p>
			Apprends à programmer en assemblant des blocs : guide un robot, trace des figures, fabrique
			des suites de nombres.
		</p>
	</header>

	<div class="niveaux">
		<a class="niveau card" href="/6e">
			<span class="nom">6ème</span>
			<span class="detail"
				>{exercicesSixieme.length} exercices · {reussis} réussi{reussis > 1 ? 's' : ''}</span
			>
		</a>
		{#each ['5ème', '4ème', '3ème'] as n (n)}
			<div class="niveau card bientot">
				<span class="nom">{n}</span>
				<span class="detail">bientôt</span>
			</div>
		{/each}
	</div>
</main>

<style>
	main {
		max-width: 900px;
		margin: 0 auto;
		padding: 48px 20px;
	}
	header {
		text-align: center;
		margin-bottom: 40px;
	}
	h1 {
		font-size: 3rem;
		margin: 0 0 12px;
	}
	h1 span {
		color: var(--accent);
	}
	header p {
		font-size: 1.15rem;
		color: var(--text-soft);
		max-width: 560px;
		margin: 0 auto;
	}
	.niveaux {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 16px;
	}
	.niveau {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 24px;
		transition: transform 0.1s ease;
	}
	a.niveau:hover {
		transform: translateY(-2px);
		border-color: var(--accent);
	}
	.nom {
		font-size: 1.8rem;
		font-weight: 700;
	}
	.detail {
		color: var(--text-soft);
	}
	.bientot {
		opacity: 0.5;
		box-shadow: none;
	}
</style>
