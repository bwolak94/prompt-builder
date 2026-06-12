import type { WebhookEventType } from '@/db/repositories/webhook.repo';

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
}

interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
}

const COLORS: Record<WebhookEventType, number> = {
  'prompt.forked': 0x5865f2,
  'prompt.commented': 0x57f287,
  'prompt.rated': 0xfee75c,
  'prompt.score_ready': 0xeb459e,
  'challenge.won': 0xffd700,
};

export function formatDiscordPayload(
  event: WebhookEventType,
  data: Record<string, unknown>,
): DiscordMessage {
  switch (event) {
    case 'prompt.forked': {
      const forkedBy = (data.forked_by as { display_name?: string } | undefined)?.display_name ?? 'Someone';
      return {
        embeds: [{
          title: '🔀 Prompt Forked',
          description: `**${forkedBy}** forked your prompt **${data.prompt_title ?? ''}**`,
          color: COLORS[event],
        }],
      };
    }
    case 'prompt.commented': {
      const preview = String(data.comment_text ?? '').slice(0, 100);
      return {
        embeds: [{
          title: '💬 New Comment',
          description: `On **${data.prompt_title ?? ''}**: "${preview}"`,
          color: COLORS[event],
        }],
      };
    }
    case 'prompt.rated': {
      return {
        embeds: [{
          title: '⭐ New Rating',
          description: `Your prompt **${data.prompt_title ?? ''}** received ${data.rating}/5 stars`,
          color: COLORS[event],
        }],
      };
    }
    case 'prompt.score_ready': {
      return {
        embeds: [{
          title: '🤖 AI Score Ready',
          description: `**${data.prompt_title ?? ''}** scored ${data.overall_score}/100`,
          color: COLORS[event],
        }],
      };
    }
    case 'challenge.won': {
      return {
        embeds: [{
          title: '🏆 Challenge Won!',
          description: `You won **${data.challenge_title ?? ''}**! Badge: ${data.badge ?? ''}`,
          color: COLORS[event],
        }],
      };
    }
    default:
      return { content: `PromptBase event: ${event}` };
  }
}
