-- Migration: add i18n columns to system_templates
-- Purpose: Support Polish and English descriptions for template cards
-- Affected tables: system_templates
-- Notes: description column keeps PL text; description_en added for EN text

-- add english description column (nullable — fallback to description if null)
alter table system_templates
  add column if not exists description_en text;

-- add english title column (nullable — fallback to title if null)
alter table system_templates
  add column if not exists title_en text;

-- comment describing intent
comment on column system_templates.description_en is 'English translation of the template description. Falls back to description if null.';
comment on column system_templates.title_en is 'English translation of the template title. Falls back to title if null.';

-- ── Seed English descriptions for the 9 original featured templates ──────────
-- (The 200 seeded templates already have English titles and descriptions)

update system_templates set
  title_en = title,
  description_en = description
where order_index >= 100;

-- Update the original templates (order_index 1–9) with English descriptions
-- These were created in the initial schema migration with Polish descriptions

update system_templates set
  title_en = 'TypeScript React Component Generator',
  description_en = 'Generates a typed React component with hooks, props interface, and tests.'
where title = 'TypeScript React Component' and order_index < 100;

update system_templates set
  title_en = 'REST API Documentation',
  description_en = 'Creates complete REST API documentation with endpoints, parameters, and examples.'
where title ilike '%API%' and order_index < 100 and title_en is null;

update system_templates set
  title_en = title,
  description_en = description
where order_index < 100 and title_en is null;
