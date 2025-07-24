'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { fetchNFTMetadata, NFTMetadata } from '@/lib/klever-api'
import CertificateVerifierWrapper from '@/components/CertificateVerifierWrapper'
import CopyButton from '@/components/CopyButton'
import InstitutionSection from '@/components/InstitutionSection'

export default function VerifyPage() {
  const params = useParams()
  const id = params.id as string[]
  const [ticker, nonce] = id && id.length >= 2 ? [id[0], id[1]] : ['', '']
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNFTMetadata = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchNFTMetadata(ticker, nonce)
      setMetadata(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [ticker, nonce])

  useEffect(() => {
    if (ticker && nonce) {
      loadNFTMetadata()
    }
  }, [ticker, nonce, loadNFTMetadata])

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Certificate Verification
            </h1>
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 rounded-xl shadow-sm">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div className="text-left">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">NFT ID</p>
                <p className="font-mono text-lg font-bold text-primary">{ticker}/{nonce}</p>
              </div>
              <CopyButton text={`${ticker}/${nonce}`} label="Copy" />
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-gray-300">Loading NFT metadata...</p>
          </div>
        )}

        {error && (
          <div className="glass-card border-red-500/20 bg-red-500/10 p-6 mb-8 animate-scale-in">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-red-400 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Unable to Load Certificate
                </h3>
                <p className="text-gray-300 mb-4">
                  {error.includes('404') || error.includes('not found')
                    ? 'This certificate ID was not found. Please check the ID and try again.'
                    : error.includes('network') || error.includes('fetch')
                      ? 'Network error. Please check your connection and try again.'
                      : 'Something went wrong while loading the certificate.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => (window.location.href = '/')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {metadata && (
          <div className="space-y-6 animate-fade-in">
            {/* Institution Section - Same width as verifier */}
            <div className="max-w-4xl mx-auto">
              <InstitutionSection
                verification={metadata.issuerVerification}
                issuerAddress={metadata.issuerAddress}
              />
            </div>
            
            <CertificateVerifierWrapper metadata={metadata} />
            
            {/* Technical Details - Collapsible */}
            <div className="max-w-4xl mx-auto">
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  View Technical Details
                </summary>
                <div className="mt-4 glass-card p-6 sm:p-8 animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Certificate Metadata
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-dark-lighter rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Document Hash</p>
                          <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                            {metadata.hash}
                          </p>
                        </div>
                        <CopyButton text={metadata.hash} label="Copy" />
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-lighter rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Merkle Root Hash
                          </p>
                          <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                            {metadata.rootHash}
                          </p>
                        </div>
                        <CopyButton text={metadata.rootHash} label="Copy" />
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
