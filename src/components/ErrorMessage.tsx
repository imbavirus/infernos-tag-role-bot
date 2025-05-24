interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="min-h-screen bg-dark-darker flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-400 text-xl bg-red-900/20 border border-red-900/40 rounded-lg p-6 mb-4">
          {message}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-lime text-dark-darker rounded-lg hover:bg-lime-light transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
} 