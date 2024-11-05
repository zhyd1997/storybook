```svelte filename="MarginDecorator.svelte" renderer="svelte" language="js" tabTitle="Svelte 4"
<!-- TK: Vet this against recommendation -->
<div>
  <slot />
</div>

<style>
  div {
    margin: 3em;
  }
</style>
```

```svelte filename="MarginDecorator.svelte" renderer="svelte" language="js" tabTitle="Svelte 5"
<!-- TK: Vet this against recommendation -->
<script>
	let { children } = $props();
</script>

<div>
	{@render children()}
</div>

<style>
  div {
    margin: 3em;
  }
</style>
```

```svelte filename="MarginDecorator.svelte" renderer="svelte" language="ts" tabTitle="Svelte 4"
<!-- TK: Vet this against recommendation -->
<div>
  <slot />
</div>

<style>
  div {
    margin: 3em;
  }
</style>
```

```svelte filename="MarginDecorator.svelte" renderer="svelte" language="ts" tabTitle="Svelte 5"
<!-- TK: Vet this against recommendation -->
<script>
	// @ts-nocheck
	let { children } = $props();
</script>

<div>
	{@render children()}
</div>

<style>
  div {
    margin: 3em;
  }
</style>
```
