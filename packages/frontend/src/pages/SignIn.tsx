import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Team portal badge */}
      <div className="mb-6 text-center">
        <span className="inline-block bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-3 tracking-wider">
          TEAM PORTAL
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Attlee.AI Internal Tools</h1>
        <p className="text-slate-500 text-sm">Sign in to access client assessment tools</p>
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

      <p className="mt-6 text-xs text-slate-400 max-w-sm text-center">
        This portal is for Attlee.AI team members only.
        If you're a client looking to engage our services, please visit our{' '}
        <a href="/" className="text-blue-600 hover:underline">homepage</a>.
      </p>
    </div>
  );
}
