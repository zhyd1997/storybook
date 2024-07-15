<script>
  /**
   * @component Button View
   * @wrapper
   */
  import { global as globalThis } from '@storybook/global';
  // @ts-ignore
  const Button = globalThis.Components?.Button;

  import { createEventDispatcher } from 'svelte';

  /**
   * @type {boolean} Rounds the button
   */
  export let primary = false;

  /**
   * @type {number} Counter
   */
  export let count = 0;

  /**
   * @typedef {'large' | 'medium' | 'small'} Sizes
   */

  /**
   * How large should the button be?
   * @type {Sizes}
   */
  export let size = 'medium';

  /**
   * Button text
   * @slot
   */
  export let text = 'You clicked';

  const dispatch = createEventDispatcher();

  function handleClick(_event) {
    count += 1;
  }

  function onMouseHover(event) {
    dispatch('mousehover', event);
  }
</script>

<h1>Button view</h1>

<Button
  {primary}
  {size}
  on:click
  on:click={handleClick}
  on:mousehover={onMouseHover}
  label="{text}: {count}"
/>

<!-- Default slot -->
<slot foo={count} />
<!-- Named slot -->
<slot name="namedSlot1" bar={text} />

<p>A little text to show this is a view.</p>
<p>If we need to test components in a Svelte environment, for instance to test slot behaviour,</p>
<p>then wrapping the component up in a view</p>
<p>made just for the story is the simplest way to achieve this.</p>
