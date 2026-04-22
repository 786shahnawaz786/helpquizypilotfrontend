import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, CheckCircle } from 'lucide-react';
import { submitFeedback } from '../services/api';

interface Props {
  articleId: string;
}

type Step = 'initial' | 'comment' | 'done';

export default function FeedbackWidget({ articleId }: Props) {
  const [step, setStep] = useState<Step>('initial');
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleVote = (vote: boolean) => {
    setHelpful(vote);
    setStep('comment');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (helpful === null) return;
    setSubmitting(true);
    try {
      await submitFeedback(articleId, helpful, comment, email);
      setStep('done');
    } catch {
      // silently fail — feedback is non-critical
      setStep('done');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <CheckCircle size={16} />
        Thanks for your feedback — it helps us improve our docs!
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
      {step === 'initial' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Was this article helpful?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition"
            >
              <ThumbsUp size={14} />
              Yes
            </button>
            <button
              onClick={() => handleVote(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:border-red-400 hover:text-red-700 hover:bg-red-50 transition"
            >
              <ThumbsDown size={14} />
              No
            </button>
          </div>
        </div>
      )}

      {step === 'comment' && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            {helpful ? (
              <><ThumbsUp size={14} className="text-green-600" /> Glad it helped!</>
            ) : (
              <><ThumbsDown size={14} className="text-red-500" /> Sorry to hear that.</>
            )}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={helpful ? 'Anything else to tell us? (optional)' : 'What was missing or unclear? (optional)'}
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          />
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email (optional — we may follow up)"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 disabled:opacity-60 transition"
            >
              <Send size={13} />
              {submitting ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
