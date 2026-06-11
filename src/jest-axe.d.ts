// Ambient module declaration for jest-axe (no bundled types)
declare module 'jest-axe' {
  import type { AxeResults, RunOptions, Spec } from 'axe-core';

  export interface JestAxeConfigureOptions {
    globalOptions?: Spec;
    impactLevels?: string[];
  }

  export const toHaveNoViolations: { toHaveNoViolations: () => { pass: boolean; message: () => string } };

  export function axe(html: Element | string, options?: RunOptions): Promise<AxeResults>;
  export function configureAxe(options?: JestAxeConfigureOptions): typeof axe;
}
