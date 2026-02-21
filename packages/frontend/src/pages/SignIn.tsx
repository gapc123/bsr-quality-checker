import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
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
    </div>
  );
}
