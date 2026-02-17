export default function Disclaimer() {
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-amber-800">
            <strong className="font-semibold">Not a compliance tool:</strong>{' '}
            This tool assesses document quality, clarity, and internal consistency only.
            It does NOT determine regulatory compliance — that is the sole responsibility of the{' '}
            <span className="font-medium">Building Safety Regulator (BSR)</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
