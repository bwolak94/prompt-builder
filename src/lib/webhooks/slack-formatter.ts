import type { WebhookEventType } from '@/db/repositories/webhook.repo';

export interface SlackMessage {
  text: string;
  blocks?: unknown[];
}

export function formatSlackPayload(
  event: WebhookEventType,
  data: Record<string, unknown>,
): SlackMessage {
  switch (event) {
    case 'prompt.forked': {
      const forkedBy = (data.forked_by as { display_name?: string } | undefined)?.display_name ?? 'Someone';
      return {
        text: `🔀 *${forkedBy}* forked your prompt *${data.prompt_title ?? ''}*`,
      };
    }
    case 'prompt.commented': {
      const preview = String(data.comment_text ?? '').slice(0, 100);
      return {
        text: `💬 New comment on *${data.prompt_title ?? ''}*: "${preview}"`,
      };
    }
    case 'prompt.rated': {
      return {
        text: `⭐ Your prompt *${data.prompt_title ?? ''}* received a ${data.rating}/5 rating`,
      };
    }
    case 'prompt.score_ready': {
      return {
        text: `🤖 AI score ready for *${data.prompt_title ?? ''}*: ${data.overall_score}/100`,
      };
    }
    case 'challenge.won': {
      return {
        text: `🏆 You won the challenge *${data.challenge_title ?? ''}*! Badge: ${data.badge ?? ''}`,
      };
    }
    default:
      return { text: `PromptBase event: ${event}` };
  }
}
