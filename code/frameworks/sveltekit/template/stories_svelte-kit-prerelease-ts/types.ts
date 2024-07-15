import type { Snippet } from 'svelte';

export type MyPropsA = {
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

export type Sizes = 'small' | 'medium' | 'large';
