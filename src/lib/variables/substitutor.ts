/**
 * Smart Variable Substitutor — F-04
 *
 * Replaces {{name}}, {{name:type}}, {{name:type:params}} with values.
 * Unknown variables (no value, no default) are replaced with empty string.
 * Shared by: VariablesPanel preview, /p/[slug], F-01 Run, F-03 A/B.
 */

import { SMART_VAR_REGEX, parseVariableDefinition } from './parser';

/**
 * Replace all smart variable tokens in content with resolved values.
 *
 * Resolution order:
 *   1. values[name] (user-provided)
 *   2. variable's defaultValue (parsed from token)
 *   3. empty string
 */
export function substituteSmartVariables(
  content: string,
  values: Record<string, string>,
): string {
  const regex = new RegExp(SMART_VAR_REGEX.source, 'g');
  return content.replace(regex, (_match, name: string, rawType?: string, rawParams?: string) => {
    if (name in values) return values[name];
    // Fall back to parsed default
    const variable = parseVariableDefinition(name, rawType, rawParams);
    return variable.defaultValue;
  });
}
