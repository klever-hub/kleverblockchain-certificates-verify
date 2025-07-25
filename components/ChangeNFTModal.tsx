'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChangeNFTModalProps {
  isOpen: boolean
  onClose: () => void
  currentNFT: string
}

export default function ChangeNFTModal({ isOpen, onClose, currentNFT }: ChangeNFTModalProps) {
  const router = useRouter()
  const [nftId, setNftId] = useState(currentNFT)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nftId.includes('/')) {
      setError('Invalid format. NFT ID must be in format: TICKER/NONCE')
      return
    }

    router.push(`/${nftId}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-dark rounded-xl shadow-xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Change NFT ID
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label 
                htmlFor="nft-id" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Enter NFT ID
              </label>
              <input
                id="nft-id"
                type="text"
                value={nftId}
                onChange={(e) => {
                  setNftId(e.target.value)
                  setError('')
                }}
                placeholder="TICKER/NONCE"
                className="w-full px-4 py-2 bg-white dark:bg-dark-lighter border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Format: COLLECTION/NUMBER (e.g., KCERT-V2YJ/1)
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-primary hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Change NFT
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}