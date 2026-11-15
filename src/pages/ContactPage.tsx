import { Clock, Mail, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { AnimatedHeadingBox } from '../components/MotionPrimitives';
import { PublicLayout } from '../components/PublicLayout';
import { AlertBanner } from '../components/StatusFeedback';
import { apiClient } from '../services/api';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (name.trim().length < 2) {
      setFeedback({ type: 'error', message: 'Please enter your full name.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (subject.trim().length < 3) {
      setFeedback({ type: 'error', message: 'Please enter a subject.' });
      return;
    }
    if (message.trim().length < 10) {
      setFeedback({
        type: 'error',
        message: 'Please provide a message of at least 10 characters.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.submitContact({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setFeedback({ type: 'success', message: response.message });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Unable to submit your message.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <PublicLayout>
      <section className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <AnimatedHeadingBox
              kicker="Contact Support"
              title="Speak with our platform desk"
              subtitle="Questions regarding account access, portfolio reporting exports, or asset classification? Send an inquiry directly to our support ledger."
            />

            <div className="space-y-4 pt-2">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3.5">
                <Mail className="w-5 h-5 text-[#0B1F3A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#0B1F3A]">Investor Desk</p>
                  <p className="text-sm text-slate-600">support@portfoliovault.io</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3.5">
                <Clock className="w-5 h-5 text-[#0B1F3A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#0B1F3A]">Response Hours</p>
                  <p className="text-sm text-slate-600">
                    Monday – Friday, 08:30 – 18:00 UTC
                  </p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#0B1F3A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#0B1F3A]">Office</p>
                  <p className="text-sm text-slate-600">
                    One Raffles Quay, North Tower, Singapore
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-xl p-7 sm:p-8">
              <h2 className="font-display text-xl font-bold text-[#0B1F3A] mb-5">
                Send an Inquiry
              </h2>

              {feedback && (
                <div className="mb-5">
                  <AlertBanner
                    type={feedback.type}
                    message={feedback.message}
                    onDismiss={() => setFeedback(null)}
                  />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Jordan Patel"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="jordan@example.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="Portfolio reporting or account support"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Describe your question or feedback..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0B1F3A] rounded-lg hover:bg-[#132E53] disabled:opacity-60 transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      </PublicLayout>
    </motion.div>
  );
};
