import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
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
