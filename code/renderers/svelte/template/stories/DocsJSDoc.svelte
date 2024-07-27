<script>
  /**
   * @typedef {100 | 1000 | 10000} LiteralNumbers
   */

  /**
   * @typedef {"apple" | "grape" | "orange"} LiteralStrings
   */

  /**
   * @typedef {Object} MyObject
   * @property {string} foo
   * @property {number} bar
   */

  /**
   * @type {boolean} Boolean
   */
  export let boolean = true;
  /**
   * @type {string} String
   */
  export let string = 'default';
  /**
   * @type {string} String (required)
   */
  export let stringRequired;
  /**
   * @type {number} Number
   */
  export let number = 123;
  /**
   * True literal
   * @type {true=}
   */
  export let trueLiteral;
  /**
   * Undefined
   * @type {undefined}
   */
  export let undefined;
  /**
   * Array of number
   * @type {number[]}
   */
  export let arrayOfNumber = [1, 20, 300];
  /**
   * Union of literal strings
   * @type {LiteralStrings=}
   */
  export let unionLiteralStrings;
  /**
   * Union of literal numbers
   * @type {LiteralNumbers=}
   */
  export let unionLiteralNumbers;
  /**
   * @type {MyObject=} Object
   */
  export let object;
  /**
   * Inline object
   * @type {{ foo: string; bar: number } =}
   */
  export let inlineObject;
  /**
   * Record
   * @type {Record<string, number>}
   */
  export let record = { a: 1, b: 2 };
  /**
   * Date
   * @type {Date}
   */
  export let date = new Date('20 Jan 1983');
  /**
   * Union of types
   * @type {number | string =}
   */
  export let unionTypes;
  /**
   * Intersection of types
   * @type {{ a: number } & { b: string } =}
   */
  export let intersection;
  /**
   * Event callback function
   * @type {(event: MouseEvent) => number}
   */
  export let func = () => 10;
</script>

<div>Docs: JSDoc</div>
