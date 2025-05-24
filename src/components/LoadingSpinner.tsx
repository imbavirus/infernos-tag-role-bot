export function LoadingSpinner() {
  return (
    <div className="h-[calc(100vh-65px)] bg-dark-darker flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-lime-light border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lime-light">Loading...</p>
      </div>
    </div>
  );
} 