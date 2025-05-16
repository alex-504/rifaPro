export default function Logo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/rifapro-logo.svg"
      alt="RifaPro Logo"
      className={`mb-8 ${className}`}
      draggable={false}
    />
  );
} 