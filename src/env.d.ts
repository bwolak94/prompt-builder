/// <reference path="../.astro/types.d.ts" />

// App.Locals is extended in src/middleware/index.ts (TASK-008)
// Defined here as the canonical interface for TypeScript awareness
declare namespace App {
  interface Locals {
    // Populated by middleware after TASK-008
  }
}
