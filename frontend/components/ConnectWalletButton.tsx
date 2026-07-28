'use client';

import { useWallet } from '@/lib/wallet';

export default function ConnectWalletButton() {
  const { isConnected, isConnecting, address, connect, disconnect, error } = useWallet();

  return (
    <nav className="flex items-center justify-between w-full p-4 border-b border-gray-200">
      <div className="text-xl font-bold">Kredit</div>
      <div className="flex items-center gap-4">
        {isConnected && address && (
          <span className="text-sm text-gray-600 font-mono">
            {address.slice(0, 8)}...{address.slice(-6)}
          </span>
        )}
        <button
          type="button"
          onClick={isConnected ? disconnect : connect}
          disabled={isConnecting}
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect Wallet'}
        </button>
      </div>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </nav>
  );
}
