/**
 * Smart Variable Validator — F-04
 *
 * Validates user-provided values against variable definitions.
 */

import type { SmartVariable } from './parser';

export interface VariableValidationError {
  name: string;
  message: string;
}

export function validateVariableValues(
  variables: SmartVariable[],
  values: Record<string, string>,
): VariableValidationError[] {
  const errors: VariableValidationError[] = [];

  for (const variable of variables) {
    const value = values[variable.name] ?? variable.defaultValue;

    // Required check: no default and no value provided
    if (!value && variable.defaultValue === '' && variable.type !== 'boolean') {
      errors.push({ name: variable.name, message: `Variable "${variable.name}" is required` });
      continue;
    }

    if (variable.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push({ name: variable.name, message: `"${variable.name}" must be a number` });
      } else {
        if (variable.min !== undefined && num < variable.min) {
          errors.push({
            name: variable.name,
            message: `"${variable.name}" must be ≥ ${variable.min}`,
          });
        }
        if (variable.max !== undefined && num > variable.max) {
          errors.push({
            name: variable.name,
            message: `"${variable.name}" must be ≤ ${variable.max}`,
          });
        }
      }
    }

    if (variable.type === 'select' && variable.options?.length) {
      if (!variable.options.includes(value)) {
        errors.push({
          name: variable.name,
          message: `"${variable.name}" must be one of: ${variable.options.join(', ')}`,
        });
      }
    }
  }

  return errors;
}
