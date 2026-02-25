import { useState } from 'react';
import { SECURITY_EMAIL } from '../config/contact';

interface SecurityPanelProps {
  variant?: 'inline' | 'compact';
}

export default function SecurityPanel({ variant = 'inline' }: SecurityPanelProps) {
  const [showFaq, setShowFaq] = useState(false);

  const securityPoints = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Encrypted in transit',
      description: 'All data transferred over HTTPS/TLS 1.3',
      status: 'active'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      title: 'Secure cloud storage',
      description: 'Documents stored in encrypted PostgreSQL database',
      status: 'active'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      title: 'No third-party sharing',
      description: 'Your documents are never shared externally',
      status: 'active'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      title: 'Data retention',
      description: 'Documents retained for 90 days, then deleted',
      status: 'active'
    }
  ];

  const faqItems = [
    {
      question: 'Who can access my uploaded documents?',
      answer: 'Only you can access your documents through your authenticated account. Our support team cannot view your document contents without explicit permission.'
    },
    {
      question: 'Is my data used to train AI models?',
      answer: 'No. Your documents are processed for analysis only and are not used to train any AI models. We use the Anthropic Claude API which does not retain or train on submitted data.'
    },
    {
      question: 'How long are my documents stored?',
      answer: 'Documents are retained for 90 days after upload to allow you to re-run analyses and download reports. After 90 days, documents are permanently deleted. You can request earlier deletion at any time.'
    },
    {
      question: 'What happens if there is a data breach?',
      answer: 'We follow industry best practices for security. In the unlikely event of a breach, affected users would be notified within 72 hours as required by UK GDPR.'
    },
    {
      question: 'Can I delete my data immediately?',
      answer: 'Yes. You can delete individual submission packs or your entire account at any time. Deletion is permanent and cannot be undone.'
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Your data is encrypted and secure</span>
        <button
          onClick={() => setShowFaq(true)}
          className="text-blue-600 hover:text-blue-700 underline"
        >
          Learn more
        </button>

        {showFaq && (
          <SecurityFaqModal onClose={() => setShowFaq(false)} faqItems={faqItems} />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Data Security</h3>
              <p className="text-sm text-slate-500">How we protect your documents</p>
            </div>
          </div>
          <button
            onClick={() => setShowFaq(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Security FAQ
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-4">
          {securityPoints.map((point, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                {point.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{point.title}</p>
                <p className="text-xs text-slate-500">{point.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Meridian complies with UK GDPR and data protection requirements.
            For questions, contact{' '}
            <a href={`mailto:${SECURITY_EMAIL}`} className="text-blue-600 hover:underline">
              {SECURITY_EMAIL}
            </a>
          </p>
        </div>
      </div>

      {showFaq && (
        <SecurityFaqModal onClose={() => setShowFaq(false)} faqItems={faqItems} />
      )}
    </div>
  );
}

interface FaqItem {
  question: string;
  answer: string;
}

function SecurityFaqModal({ onClose, faqItems }: { onClose: () => void; faqItems: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Security FAQ</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-slate-900 text-sm">{item.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-3 text-sm text-slate-600">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
