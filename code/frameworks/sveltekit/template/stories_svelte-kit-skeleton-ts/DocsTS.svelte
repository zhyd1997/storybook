<script lang="ts">
  import type { LiteralNumbers, LiteralStrings } from './types';

  type MyObject = {
    foo: string;
    bar: number;
  };

  /**
   * Boolean
   */
  export let boolean: boolean = true;
  /**
   * String
   */
  export let string: string = 'default';
  /**
   * String (required)
   */
  export let stringRequired: string;
  /**
   * Number
   */
  export let number: number = 123;
  /**
   * True literal
   */
  export let trueLiteral: true | undefined = true;
  /**
   * Undefined
   */
  export let undefined: undefined;
  /**
   * Any
   */
  export let any: any;
  /**
   * Array of number
   */
  export let arrayOfNumber: number[] = [1, 20, 300];
  /**
   * Union of literal strings
   */
  export let unionLiteralStrings: LiteralStrings | undefined;
  /**
   * Union of literal numbers
   */
  export let unionLiteralNumbers: LiteralNumbers | undefined;
  /**
   * Object
   */
  export let object: MyObject | undefined;
  /**
   * Inline object
   */
  export let inlineObject:
    | {
        foo: string;
        bar: number;
      }
    | undefined;
  /**
   * Record
   */
  export let record: Record<string, number> = { a: 1, b: 2 };
  /**
   * Date
   */
  export let date: Date = new Date('20 Jan 1983');
  /**
   * Union of types
   */
  export let unionTypes: number | string | undefined;
  /**
   * Intersection of types
   */
  export let intersection: ({ a: number } & { b: string }) | undefined;
  /**
   * Event callback function
   */
  export let func: (event: MouseEvent) => number = () => 10;
</script>

<div>Docs: TS</div>
