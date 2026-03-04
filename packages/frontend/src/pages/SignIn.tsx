import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--cream)',
      padding: '48px 24px'
    }}>
      {/* Team portal badge */}
      <div style={{
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <span className="eyebrow" style={{
          display: 'inline-block',
          background: 'var(--navy)',
          color: 'var(--cream)',
          padding: '6px 16px',
          marginBottom: '16px'
        }}>
          TEAM PORTAL
        </span>
        <h1 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '32px',
          fontWeight: 200,
          color: 'var(--navy)',
          marginBottom: '8px',
          letterSpacing: '-0.02em'
        }}>
          attlee.ai Internal Tools
        </h1>
        <p style={{
          color: 'var(--muted)',
          fontSize: '15px',
          fontWeight: 300
        }}>
          Sign in to access client assessment tools
        </p>
      </div>

      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl border border-slate-200",
            headerTitle: "text-slate-900",
            headerSubtitle: "text-slate-600",
            socialButtonsBlockButton: "border-slate-300 hover:bg-slate-50",
            formFieldInput: "border-slate-300 focus:border-blue-500 focus:ring-blue-500",
            footerActionLink: "text-blue-600 hover:text-blue-700"
          }
        }}
      />

      <p style={{
        marginTop: '32px',
        fontSize: '13px',
        color: 'var(--muted)',
        maxWidth: '500px',
        textAlign: 'center',
        lineHeight: 1.6
      }}>
        This portal is for attlee.ai team members only.
        If you're a client looking to engage our services, please visit our{' '}
        <a href="/" style={{
          color: 'var(--gold)',
          textDecoration: 'underline'
        }}>
          homepage
        </a>.
      </p>
    </div>
  );
}
