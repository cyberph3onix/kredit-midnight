'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/lib/wallet';
import { cn } from '@/lib/utils';

const links = [
  { href: '/issuer', label: 'Issuer' },
  { href: '/user', label: 'Holder' },
  { href: '/verify', label: 'Verifier' },
];

export default function ConnectWalletButton() {
  const { isConnected, isConnecting, address, connect, disconnect, error } = useWallet();
  const pathname = usePathname();

  return (
    <header className="relative z-10 border-b border-line bg-ink/75 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span className="text-[15px] font-medium tracking-tight">Kredit</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'px-3 py-1.5 rounded-[2px] text-sm transition-colors',
                  pathname === l.href
                    ? 'text-paper bg-panel-raised'
                    : 'text-dim hover:text-paper',
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && address && (
            <span className="hidden sm:inline-block font-mono text-xs text-dim border border-line rounded-[2px] px-2.5 py-1.5">
              {address.slice(0, 8)}&hellip;{address.slice(-6)}
            </span>
          )}
          <button
            type="button"
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className={cn(
              'px-4 py-2 rounded-[2px] text-sm font-medium transition-colors disabled:opacity-50',
              isConnected
                ? 'border border-line text-dim hover:text-paper hover:border-signal-dim'
                : 'bg-signal text-ink hover:bg-[#b0a2ff]',
            )}
          >
            {isConnecting ? 'Connecting…' : isConnected ? 'Disconnect' : 'Connect wallet'}
          </button>
        </div>
      </nav>
      {error && (
        <div className="border-t border-fail/30 bg-fail/5">
          <p className="max-w-6xl mx-auto px-4 sm:px-6 py-2 text-xs text-fail font-mono">{error}</p>
        </div>
      )}
    </header>
  );
}
