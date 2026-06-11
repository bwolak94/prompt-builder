/**
 * ChallengesIsland — F-07
 * Weekly prompt challenges with submissions, voting, leaderboard, and proposals.
 * Renders as a React island (client:load).
 */

import React, { useState, useEffect, useCallback } from 'react';
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
        <h1 className="text-2xl font-bold text-text-primary">{t('challenges.title')}</h1>
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
            <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
              <p className="text-sm text-text-muted">{t('challenges.noActive')}</p>
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
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(targetIso).getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, new Date(targetIso).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const days    = Math.floor(remaining / 86400000);
  const hours   = Math.floor((remaining % 86400000) / 3600000);
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
  challenge, isLoggedIn, userPrompts, isSubmitting, onSubmit, t,
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
    challenge.status === 'active'   ? t('challenges.statusActive') :
    challenge.status === 'voting'   ? t('challenges.statusVoting') :
    challenge.status === 'upcoming' ? t('challenges.statusUpcoming') :
                                      t('challenges.statusCompleted');

  return (
    <div className="rounded-xl border border-brand-500/30 bg-surface-raised p-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-semibold text-brand-400">
          {t('challenges.activeChallenge')}
        </span>
        <span className="text-xs text-text-muted">{statusLabel}</span>
      </div>

      <h2 className="text-xl font-bold text-text-primary">{challenge.title}</h2>
      <p className="mt-2 text-sm text-text-muted">{challenge.description}</p>

      {!expired && (
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-text-secondary">
          <span className="text-xs text-text-muted mr-1">{t('challenges.timeRemaining')}</span>
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
                className="rounded-md border border-border bg-surface-base px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                <option value="">— wybierz prompt —</option>
                {userPrompts.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              {error && <p className="text-[10px] text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button size="sm" disabled={!selectedPromptId || isSubmitting} onClick={() => void handleSubmit()}>
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
  submissions, isLoggedIn, challengeStatus, onVote, t,
}) => {
  const canVote = isLoggedIn && challengeStatus === 'voting';

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-text-primary">
        {t('challenges.submissions')} ({submissions.length})
      </h3>
      {submissions.length === 0 ? (
        <p className="text-xs text-text-muted">{t('challenges.noSubmissions')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {submissions.map((s) => (
            <SubmissionCard
              key={s.id}
              submission={s}
              canVote={canVote}
              onVote={onVote}
              t={t}
            />
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

const SubmissionCard: React.FC<SubmissionCardProps> = React.memo(({ submission, canVote, onVote, t }) => (
  <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-raised p-4">
    {submission.rank && (
      <span className="w-fit rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
        #{submission.rank}
      </span>
    )}

    <div className="flex items-center gap-1.5">
      {submission.author_avatar ? (
        <img src={submission.author_avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
      ) : (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500/20 text-[9px] font-bold text-brand-400">
          {(submission.author_name ?? 'A')[0]?.toUpperCase()}
        </div>
      )}
      <span className="text-[11px] text-text-muted">{submission.author_name}</span>
    </div>

    <a
      href={`/p/${submission.prompt_id}`}
      className="font-medium text-sm text-text-primary hover:text-brand-400 transition-colors line-clamp-2"
    >
      {submission.prompt_title}
    </a>

    {submission.prompt_content_md && (
      <p className="text-[11px] text-text-muted line-clamp-3 font-mono">
        {submission.prompt_content_md.slice(0, 120)}…
      </p>
    )}

    <div className="mt-auto flex items-center justify-between">
      <span className="text-xs text-text-muted">
        {submission.vote_count} {submission.vote_count === 1 ? t('challenges.vote') : t('challenges.votes')}
      </span>
      {canVote && (
        <button
          onClick={() => void onVote(submission.id)}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            submission.viewer_voted
              ? 'bg-brand-500/20 text-brand-400'
              : 'border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          {submission.viewer_voted ? t('challenges.voted') : t('challenges.vote')}
        </button>
      )}
    </div>
  </div>
));
SubmissionCard.displayName = 'SubmissionCard';

// ── LeaderboardSidebar ────────────────────────────────────────────────────────

interface LeaderboardSidebarProps {
  leaderboard: LeaderboardEntry[];
  t: ReturnType<typeof useI18n>['t'];
}

const LeaderboardSidebar: React.FC<LeaderboardSidebarProps> = ({ leaderboard, t }) => (
  <div className="rounded-xl border border-border bg-surface-raised p-4">
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
      {t('challenges.leaderboard')}
    </h3>
    {leaderboard.length === 0 ? (
      <p className="text-xs text-text-muted">{t('challenges.leaderboardEmpty')}</p>
    ) : (
      <ol className="flex flex-col gap-2">
        {leaderboard.slice(0, 10).map((entry, i) => (
          <li key={entry.user_id} className="flex items-center gap-2">
            <span className="w-5 text-center text-xs font-bold text-text-muted">
              {i + 1}
            </span>
            {entry.avatar_url ? (
              <img src={entry.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-400">
                {(entry.display_name ?? 'A')[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{entry.display_name}</p>
              <p className="text-[10px] text-text-muted">
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
  proposals, isLoggedIn, onVote, onCreate, t,
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{t('challenges.proposals')}</h3>
        {isLoggedIn && (
          <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
            {t('challenges.propose')}
          </Button>
        )}
      </div>

      {proposals.length === 0 ? (
        <p className="text-xs text-text-muted">{t('challenges.noProposals')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {proposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              isLoggedIn={isLoggedIn}
              onVote={onVote}
              t={t}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ProposalModal
          onCreate={onCreate}
          onClose={() => setShowModal(false)}
          t={t}
        />
      )}
    </section>
  );
};

interface ProposalCardProps {
  proposal: ChallengeProposal;
  isLoggedIn: boolean;
  onVote: (id: string) => Promise<void>;
  t: ReturnType<typeof useI18n>['t'];
}

const ProposalCard: React.FC<ProposalCardProps> = React.memo(({ proposal, isLoggedIn, onVote, t }) => (
  <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-raised p-3">
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <p className="text-xs font-medium text-text-primary">{proposal.title}</p>
      <p className="line-clamp-2 text-[11px] text-text-muted">{proposal.description}</p>
      <p className="text-[10px] text-text-muted">
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
              : 'border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          ▲
        </button>
      ) : (
        <span className="rounded-md border border-border px-2 py-1 text-xs text-text-muted/50">▲</span>
      )}
      <span className="text-xs font-bold text-text-primary">{proposal.upvotes}</span>
    </div>
  </div>
));
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-base p-6 shadow-xl">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">{t('challenges.propose')}</h3>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('challenges.proposalTitlePlaceholder')}
            maxLength={200}
            required
            minLength={5}
            className="rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-400"
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
          {error && <p className="text-[10px] text-destructive">{error}</p>}
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
