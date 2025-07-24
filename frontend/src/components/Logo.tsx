import Image from 'next/image';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/rifapro-logo.svg"
      alt="RifaPro Logo"
      width={120}
      height={40}
      className={`mb-8 ${className}`}
      draggable={false}
      priority
    />
  );
} 