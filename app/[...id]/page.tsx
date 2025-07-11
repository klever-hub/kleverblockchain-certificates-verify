'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchNFTMetadata, NFTMetadata } from '@/lib/klever-api'
import CertificateVerifier from '@/components/CertificateVerifier'

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
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-1">Error Loading Certificate</h3>
                <p className="text-gray-300">{error}</p>
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
                  <p className="text-sm text-gray-400 mb-2">Document Hash</p>
                  <p className="font-mono text-sm text-white break-all">{metadata.hash}</p>
                </div>
                <div className="bg-dark-lighter rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-2">Merkle Root Hash</p>
                  <p className="font-mono text-sm text-white break-all">{metadata.rootHash}</p>
                </div>
              </div>
            </div>

            <CertificateVerifier metadata={metadata} />
          </div>
        )}
      </div>
    </main>
  )
}