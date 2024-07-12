<script lang="ts">
  import type { Snippet } from "svelte";

  type MyProps = {
    /**
     * Is this the principal call to action on the page?
     */
    primary?: boolean;
    /**
     * What background color to use
     */
    backgroundColor?: string;
    /**
     * How large should the button be?
     */
    size?: 'small' | 'medium' | 'large';
    /**
     * Snippet contents
     */
    children?: Snippet;
    /**
     * Text contents
     */
    label: string;
    /**
     * Click handler
     */
    onclick?: () => void;
  };

  let {
    primary = true,
    backgroundColor,
    size = 'medium',
    onclick,
    children,
    label,
  }: MyProps = $props();

  let mode = $derived(primary ? 'storybook-button--primary' : 'storybook-button--secondary');
  let style = $derived(backgroundColor ? `background-color: ${backgroundColor}` : '');
</script>

<button
  type="button"
  class={['storybook-button', `storybook-button--${size}`, mode].join(' ')}
  {style}
  {onclick}
>
  {#if label}
    {label}
  {:else if children}
    {@render children()}
  {/if}
</button>
