'use client'

import CopyButton from './CopyButton'

interface HolderSectionProps {
  holderAddress?: string
}

export default function HolderSection({ holderAddress }: HolderSectionProps) {
  if (!holderAddress) {
    return null
  }

  // Format address for display (show first 8 and last 8 characters)
  const formatAddress = (address: string) => {
    if (address.length <= 20) return address
    return `${address.slice(0, 12)}...${address.slice(-10)}`
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Current Certificate Holder
            </h3>
            <p className="font-mono text-sm text-gray-900 dark:text-white mt-1 break-all sm:break-normal">
              {formatAddress(holderAddress)}
            </p>
          </div>
        </div>
        <CopyButton text={holderAddress} label="Copy" />
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>This address currently owns this certificate NFT on the Klever blockchain.</p>
      </div>
    </div>
  )
}