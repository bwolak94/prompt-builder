/**
 * ChallengesIsland — F-07
 * Weekly prompt challenges with submissions, voting, leaderboard, and proposals.
 * Renders as a React island (client:load).
 */

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  Challenge,
  ChallengeSubmission,
  ChallengeProposal,
  LeaderboardEntry,
} from '@/db/repositories/challenge.repo';
import { useChallenges } from './hooks/useChallenges';

interface ChallengesIslandProps {
  lang: Lang;
  initialChallenge: Challenge | null;
  initialSubmissions: ChallengeSubmission[];
  initialProposals: ChallengeProposal[];
  initialLeaderboard: LeaderboardEntry[];
  isLoggedIn: boolean;
  userPrompts: Array<{ id: string; title: string }>;
}

export const ChallengesIsland: React.FC<ChallengesIslandProps> = ({
  lang,
  initialChallenge,
  initialSubmissions,
  initialProposals,
  initialLeaderboard,
  isLoggedIn,
  userPrompts,
}) => {
  const { t } = useI18n(lang);
  const {
    challenge,
    submissions,
    proposals,
    leaderboard,
    isSubmitting,
    submitPrompt,
    toggleVote,
    toggleProposalVote,
    createProposal,
  } = useChallenges(initialChallenge, initialSubmissions, initialProposals, initialLeaderboard);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">{t('challenges.title')}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="flex flex-col gap-8">
          {challenge ? (
            <>
              <ActiveChallengeHero
                challenge={challenge}
                isLoggedIn={isLoggedIn}
                userPrompts={userPrompts}
                isSubmitting={isSubmitting}
                onSubmit={submitPrompt}
                t={t}
              />
              <SubmissionsGrid
                submissions={submissions}
                isLoggedIn={isLoggedIn}
                challengeStatus={challenge.status}
                onVote={toggleVote}
                t={t}
              />
            </>
          ) : (
            <div className="border-border bg-surface-raised rounded-xl border p-8 text-center">
              <p className="text-text-muted text-sm">{t('challenges.noActive')}</p>
            </div>
          )}

          <ProposalSection
            proposals={proposals}
            isLoggedIn={isLoggedIn}
            onVote={toggleProposalVote}
            onCreate={createProposal}
            t={t}
          />
        </div>

        {/* Leaderboard sidebar */}
        <aside>
          <LeaderboardSidebar leaderboard={leaderboard} t={t} />
        </aside>
      </div>
    </div>
  );
};

// ── Countdown Timer ───────────────────────────────────────────────────────────

function useCountdown(targetIso: string) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(targetIso).getTime() - Date.now()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, new Date(targetIso).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return { days, hours, minutes, seconds, expired: remaining === 0 };
}

// ── ActiveChallengeHero ───────────────────────────────────────────────────────

interface HeroProps {
  challenge: Challenge;
  isLoggedIn: boolean;
  userPrompts: Array<{ id: string; title: string }>;
  isSubmitting: boolean;
  onSubmit: (promptId: string) => Promise<void>;
  t: ReturnType<typeof useI18n>['t'];
}

const ActiveChallengeHero: React.FC<HeroProps> = ({
  challenge,
  isLoggedIn,
  userPrompts,
  isSubmitting,
  onSubmit,
  t,
}) => {
  const target = challenge.status === 'voting' ? challenge.voting_ends_at : challenge.ends_at;
  const { days, hours, minutes, seconds, expired } = useCountdown(target);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedPromptId) return;
    setError(null);
    try {
      await onSubmit(selectedPromptId);
      setShowSelector(false);
      setSelectedPromptId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const statusLabel =
    challenge.status === 'active'
      ? t('challenges.statusActive')
      : challenge.status === 'voting'
        ? t('challenges.statusVoting')
        : challenge.status === 'upcoming'
          ? t('challenges.statusUpcoming')
          : t('challenges.statusCompleted');

  return (
    <div className="border-brand-500/30 bg-surface-raised rounded-xl border p-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="bg-brand-500/15 text-brand-400 rounded-full px-2.5 py-0.5 text-xs font-semibold">
          {t('challenges.activeChallenge')}
        </span>
        <span className="text-text-muted text-xs">{statusLabel}</span>
      </div>

      <h2 className="text-text-primary text-xl font-bold">{challenge.title}</h2>
      <p className="text-text-muted mt-2 text-sm">{challenge.description}</p>

      {!expired && (
        <div className="text-text-secondary mt-4 flex items-center gap-1 text-sm font-medium">
          <span className="text-text-muted mr-1 text-xs">{t('challenges.timeRemaining')}</span>
          {days > 0 && <span>{days}d</span>}
          <span>{String(hours).padStart(2, '0')}h</span>
          <span>{String(minutes).padStart(2, '0')}m</span>
          <span>{String(seconds).padStart(2, '0')}s</span>
        </div>
      )}

      {isLoggedIn && challenge.status === 'active' && (
        <div className="mt-4">
          {!showSelector ? (
            <Button size="sm" onClick={() => setShowSelector(true)}>
              {t('challenges.submit')}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <select
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                className="border-border bg-surface-base text-text-primary focus:ring-brand-400 rounded-md border px-3 py-1.5 text-xs focus:ring-1 focus:outline-none"
              >
                <option value="">— wybierz prompt —</option>
                {userPrompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {error && <p className="text-destructive text-[10px]">{error}</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!selectedPromptId || isSubmitting}
                  onClick={() => void handleSubmit()}
                >
                  {isSubmitting ? t('common.loading') : t('challenges.submitConfirm')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSelector(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── SubmissionsGrid ───────────────────────────────────────────────────────────

interface SubmissionsGridProps {
  submissions: ChallengeSubmission[];
  isLoggedIn: boolean;
  challengeStatus: Challenge['status'];
  onVote: (id: string) => Promise<void>;
  t: ReturnType<typeof useI18n>['t'];
}

const SubmissionsGrid: React.FC<SubmissionsGridProps> = ({
  submissions,
  isLoggedIn,
  challengeStatus,
  onVote,
  t,
}) => {
  const canVote = isLoggedIn && challengeStatus === 'voting';

  return (
    <section>
      <h3 className="text-text-primary mb-3 text-sm font-semibold">
        {t('challenges.submissions')} ({submissions.length})
      </h3>
      {submissions.length === 0 ? (
        <p className="text-text-muted text-xs">{t('challenges.noSubmissions')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {submissions.map((s) => (
            <SubmissionCard key={s.id} submission={s} canVote={canVote} onVote={onVote} t={t} />
          ))}
        </div>
      )}
    </section>
  );
};

interface SubmissionCardProps {
  submission: ChallengeSubmission;
  canVote: boolean;
  onVote: (id: string) => Promise<void>;
  t: ReturnType<typeof useI18n>['t'];
}

const SubmissionCard: React.FC<SubmissionCardProps> = React.memo(
  ({ submission, canVote, onVote, t }) => (
    <div className="border-border bg-surface-raised flex flex-col gap-2 rounded-xl border p-4">
      {submission.rank && (
        <span className="w-fit rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
          #{submission.rank}
        </span>
      )}

      <div className="flex items-center gap-1.5">
        {submission.author_avatar ? (
          <img
            src={submission.author_avatar}
            alt=""
            className="h-4 w-4 rounded-full object-cover"
          />
        ) : (
          <div className="bg-brand-500/20 text-brand-400 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold">
            {(submission.author_name ?? 'A')[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-text-muted text-[11px]">{submission.author_name}</span>
      </div>

      <a
        href={`/p/${submission.prompt_id}`}
        className="text-text-primary hover:text-brand-400 line-clamp-2 text-sm font-medium transition-colors"
      >
        {submission.prompt_title}
      </a>

      {submission.prompt_content_md && (
        <p className="text-text-muted line-clamp-3 font-mono text-[11px]">
          {submission.prompt_content_md.slice(0, 120)}…
        </p>
      )}

      <div className="mt-auto flex items-center justify-between">
        <span className="text-text-muted text-xs">
          {submission.vote_count}{' '}
          {submission.vote_count === 1 ? t('challenges.vote') : t('challenges.votes')}
        </span>
        {canVote && (
          <button
            onClick={() => void onVote(submission.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              submission.viewer_voted
                ? 'bg-brand-500/20 text-brand-400'
                : 'border-border text-text-muted hover:text-text-primary border'
            }`}
          >
            {submission.viewer_voted ? t('challenges.voted') : t('challenges.vote')}
          </button>
        )}
      </div>
    </div>
  ),
);
SubmissionCard.displayName = 'SubmissionCard';

// ── LeaderboardSidebar ────────────────────────────────────────────────────────

interface LeaderboardSidebarProps {
  leaderboard: LeaderboardEntry[];
  t: ReturnType<typeof useI18n>['t'];
}

const LeaderboardSidebar: React.FC<LeaderboardSidebarProps> = ({ leaderboard, t }) => (
  <div className="border-border bg-surface-raised rounded-xl border p-4">
    <h3 className="text-text-muted mb-3 text-xs font-semibold tracking-wider uppercase">
      {t('challenges.leaderboard')}
    </h3>
    {leaderboard.length === 0 ? (
      <p className="text-text-muted text-xs">{t('challenges.leaderboardEmpty')}</p>
    ) : (
      <ol className="flex flex-col gap-2">
        {leaderboard.slice(0, 10).map((entry, i) => (
          <li key={entry.user_id} className="flex items-center gap-2">
            <span className="text-text-muted w-5 text-center text-xs font-bold">{i + 1}</span>
            {entry.avatar_url ? (
              <img src={entry.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="bg-brand-500/20 text-brand-400 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold">
                {(entry.display_name ?? 'A')[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-text-primary truncate text-xs font-medium">{entry.display_name}</p>
              <p className="text-text-muted text-[10px]">
                🏆 {entry.wins} · 🥈 {entry.top10s}
              </p>
            </div>
          </li>
        ))}
      </ol>
    )}
  </div>
);

// ── ProposalSection ───────────────────────────────────────────────────────────

interface ProposalSectionProps {
  proposals: ChallengeProposal[];
  isLoggedIn: boolean;
  onVote: (id: string) => Promise<void>;
  onCreate: (title: string, description: string) => Promise<void>;
  t: ReturnType<typeof useI18n>['t'];
}

const ProposalSection: React.FC<ProposalSectionProps> = ({
  proposals,
  isLoggedIn,
  onVote,
  onCreate,
  t,
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-text-primary text-sm font-semibold">{t('challenges.proposals')}</h3>
        {isLoggedIn && (
          <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
            {t('challenges.propose')}
          </Button>
        )}
      </div>

      {proposals.length === 0 ? (
        <p className="text-text-muted text-xs">{t('challenges.noProposals')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} isLoggedIn={isLoggedIn} onVote={onVote} t={t} />
          ))}
        </div>
      )}

      {showModal && <ProposalModal onCreate={onCreate} onClose={() => setShowModal(false)} t={t} />}
    </section>
  );
};

interface ProposalCardProps {
  proposal: ChallengeProposal;
  isLoggedIn: boolean;
  onVote: (id: string) => Promise<void>;
  t: ReturnType<typeof useI18n>['t'];
}

const ProposalCard: React.FC<ProposalCardProps> = React.memo(
  ({ proposal, isLoggedIn, onVote, t }) => (
    <div className="border-border bg-surface-raised flex items-start gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-text-primary text-xs font-medium">{proposal.title}</p>
        <p className="text-text-muted line-clamp-2 text-[11px]">{proposal.description}</p>
        <p className="text-text-muted text-[10px]">
          {t('challenges.proposalThreshold').replace('{{n}}', '10')}
        </p>
      </div>
      <div className="flex flex-col items-center gap-1">
        {isLoggedIn ? (
          <button
            onClick={() => void onVote(proposal.id)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              proposal.viewer_voted
                ? 'bg-brand-500/20 text-brand-400'
                : 'border-border text-text-muted hover:text-text-primary border'
            }`}
          >
            ▲
          </button>
        ) : (
          <span className="border-border text-text-muted/50 rounded-md border px-2 py-1 text-xs">
            ▲
          </span>
        )}
        <span className="text-text-primary text-xs font-bold">{proposal.upvotes}</span>
      </div>
    </div>
  ),
);
ProposalCard.displayName = 'ProposalCard';

interface ProposalModalProps {
  onCreate: (title: string, description: string) => Promise<void>;
  onClose: () => void;
  t: ReturnType<typeof useI18n>['t'];
}

const ProposalModal: React.FC<ProposalModalProps> = ({ onCreate, onClose, t }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onCreate(title, description);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="border-border bg-surface-base w-full max-w-md rounded-xl border p-6 shadow-xl">
        <h3 className="text-text-primary mb-4 text-sm font-semibold">{t('challenges.propose')}</h3>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('challenges.proposalTitlePlaceholder')}
            maxLength={200}
            required
            minLength={5}
            className="border-border bg-surface-raised text-text-primary placeholder:text-text-muted focus:ring-brand-400 rounded-md border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('challenges.proposalDescPlaceholder')}
            rows={4}
            maxLength={1000}
            required
            minLength={20}
            className="min-h-0 resize-none text-xs"
          />
          {error && <p className="text-destructive text-[10px]">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChallengesIsland;
