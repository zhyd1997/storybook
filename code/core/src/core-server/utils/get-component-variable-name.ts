import { camelCase } from 'es-toolkit';

/**
 * Get a valid variable name for a component.
 *
 * @param name The name of the component.
 * @returns A valid variable name.
 */
export const getComponentVariableName = async (name: string) => {
  const camelCased = camelCase(name.replace(/^[^a-zA-Z_$]*/, ''));
  const sanitized = camelCased.replace(/[^a-zA-Z_$]+/, '');
  return sanitized;
};
