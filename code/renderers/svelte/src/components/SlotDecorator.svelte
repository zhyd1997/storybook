<script>
  import { onMount, getContext } from 'svelte';
  import { VERSION as SVELTE_VERSION } from 'svelte/compiler';
  import { ARG_TYPES_CONTEXT_KEY } from './PreviewRender.svelte';

  export let decorator = undefined;
  export let Component;
  export let props = {};
  export let on = undefined;
  export let isOriginalStory = false;

  let instance;
  let decoratorInstance;

  const IS_SVELTE_V4 = Number(SVELTE_VERSION[0]) <= 4;

  /*
    Svelte Docgen will create argTypes for events with the name 'event_eventName'
    The Actions addon will convert these to args because they are type: 'action'
    We need to filter these args out so they are not passed to the component
  */
  let propsWithoutDocgenEvents;
  $: propsWithoutDocgenEvents = isOriginalStory
    ? Object.fromEntries(Object.entries(props).filter(([key]) => !key.startsWith('event_')))
    : { ...props };

  if (isOriginalStory && IS_SVELTE_V4) {
    const argTypes = getContext(ARG_TYPES_CONTEXT_KEY) ?? {};
    const eventsFromArgTypes = Object.fromEntries(
      Object.entries(argTypes)
        .filter(([key, value]) => value.action && props[key] != null)
        .map(([key, value]) => [value.action, props[key]])
    );
    // Attach Svelte event listeners in Svelte v4
    // In Svelte v5 this is not possible anymore as instances are no longer classes with $on() properties, so it will be a no-op
    onMount(() => {
      Object.entries({ ...eventsFromArgTypes, ...on }).forEach(([eventName, eventCallback]) => {
        // instance can be undefined if a decorator doesn't have a <slot/>
        const inst = instance ?? decoratorInstance;
        inst?.$on?.(eventName, eventCallback);
      });
    });
  }
</script>

{#if decorator}
  <svelte:component this={decorator.Component} {...decorator.props} bind:this={decoratorInstance}>
    <svelte:component this={Component} {...propsWithoutDocgenEvents} bind:this={instance} />
  </svelte:component>
{:else}
  <svelte:component this={Component} {...propsWithoutDocgenEvents} bind:this={instance} />
{/if}
