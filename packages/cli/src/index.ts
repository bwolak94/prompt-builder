#!/usr/bin/env node

import { Command } from 'commander';
import { loginCommand, logoutCommand } from './commands/login.js';
import { listCommand } from './commands/list.js';
import { pullCommand } from './commands/pull.js';
import { pushCommand } from './commands/push.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('promptbase')
  .description('PromptBase CLI — manage your AI prompts from the terminal')
  .version('1.0.0');

program
  .command('login')
  .description('Save your API key')
  .requiredOption('--key <key>', 'API key (pb_live_...)')
  .action(loginCommand);

program
  .command('logout')
  .description('Remove your saved API key')
  .action(() => logoutCommand());

program
  .command('list')
  .description('List your prompts')
  .option('--format <format>', 'Output format: table | json', 'table')
  .action(listCommand);

program
  .command('pull <id>')
  .description('Download a prompt to a .md file')
  .option('--env <env>', 'Environment (dev|staging|production)', 'dev')
  .option('--output <file>', 'Output file path')
  .action(pullCommand);

program
  .command('push <file>')
  .description('Upload a .md file as a prompt (create or update)')
  .option('--env <env>', 'Target environment', 'dev')
  .action(pushCommand);

program
  .command('sync <directory>')
  .description('Sync a directory of .md files with PromptBase')
  .option('--env <env>', 'Target environment', 'dev')
  .option('--dry-run', 'Show changes without applying them')
  .action((dir: string, opts: { watch?: boolean; env?: string; dryRun?: boolean }) => syncCommand(dir, opts));

program.parse(process.argv);
