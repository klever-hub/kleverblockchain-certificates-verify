'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchNFTMetadata, NFTMetadata } from '@/lib/klever-api'
import CertificateVerifierWrapper from '@/components/CertificateVerifierWrapper'
import CopyButton from '@/components/CopyButton'

export default function VerifyPage() {
  const params = useParams()
  const id = params.id as string[]
  const [ticker, nonce] = id && id.length >= 2 ? [id[0], id[1]] : ['', '']
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ticker && nonce) {
      loadNFTMetadata()
    }
  }, [ticker, nonce])

  const loadNFTMetadata = async () => {
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
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 text-center animate-slide-up">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-gradient">Certificate Verification</span>
          </h1>
          <p className="text-lg text-gray-300">
            Verify your NFT-backed certificate on the Klever Blockchain
          </p>
        </div>
        
        <div className="glass-card p-6 sm:p-8 mb-8 animate-fade-in animation-delay-200">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NFT Details
            </span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-dark-lighter rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Collection Ticker</p>
              <p className="text-xl font-mono text-white">{ticker || '—'}</p>
            </div>
            <div className="bg-dark-lighter rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">NFT Nonce</p>
              <p className="text-xl font-mono text-white">{nonce || '—'}</p>
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
              <svg className="w-6 h-6 text-red-400 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Unable to Load Certificate</h3>
                <p className="text-gray-300 mb-4">
                  {error.includes('404') || error.includes('not found') 
                    ? 'This certificate ID was not found. Please check the ID and try again.'
                    : error.includes('network') || error.includes('fetch')
                    ? 'Network error. Please check your connection and try again.'
                    : 'Something went wrong while loading the certificate.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.href = '/'}
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
          <div className="space-y-8 animate-fade-in">
            <div className="glass-card p-6 sm:p-8 neon-glow">
              <h3 className="text-2xl font-bold mb-6 text-white">
                Certificate Metadata
              </h3>
              <div className="space-y-4">
                <div className="bg-dark-lighter rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-2">Document Hash</p>
                      <p className="font-mono text-sm text-white break-all">{metadata.hash}</p>
                    </div>
                    <CopyButton text={metadata.hash} label="Copy" />
                  </div>
                </div>
                <div className="bg-dark-lighter rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-2">Merkle Root Hash</p>
                      <p className="font-mono text-sm text-white break-all">{metadata.rootHash}</p>
                    </div>
                    <CopyButton text={metadata.rootHash} label="Copy" />
                  </div>
                </div>
              </div>
            </div>

            <CertificateVerifierWrapper metadata={metadata} />
          </div>
        )}
      </div>
    </main>
  )
}