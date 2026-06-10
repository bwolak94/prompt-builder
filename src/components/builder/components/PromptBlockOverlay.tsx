import React from 'react';
import { VARIABLE_REGEX } from '@/lib/constants';

interface PromptBlockOverlayProps {
  content: string;
  className?: string;
}

/**
 * Renders the block textarea content as an overlay div with
 * {{variable}} tokens highlighted in amber.
 *
 * This is positioned absolutely on top of a transparent textarea
 * to provide visual variable highlighting without breaking editing.
 */
export const PromptBlockOverlay: React.FC<PromptBlockOverlayProps> = ({ content, className }) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(VARIABLE_REGEX.source, 'g');

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>,
      );
    }
    parts.push(
      <mark
        key={`var-${match.index}`}
        className="rounded-sm bg-amber-400/20 text-amber-300"
      >
        {match[0]}
      </mark>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={`text-end`}>{content.slice(lastIndex)}</span>);
  }

  return (
    <div
      aria-hidden="true"
      className={[
        'pointer-events-none absolute inset-0 whitespace-pre-wrap break-words',
        'p-2 font-mono text-xs leading-relaxed text-transparent',
        className,
      ].join(' ')}
    >
      {parts}
      {/* trailing newline to prevent textarea height mismatch */}
      {'\n'}
    </div>
  );
};
