'use client'

import dynamic from 'next/dynamic'
import { NFTMetadata } from '@/lib/klever-api'

// Dynamically import CertificateVerifier to avoid SSR issues with PDF.js
const CertificateVerifier = dynamic(
  () => import('./CertificateVerifier'),
  { 
    ssr: false,
    loading: () => (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-300">Loading verifier...</p>
      </div>
    )
  }
)

interface CertificateVerifierWrapperProps {
  metadata: NFTMetadata
}

export default function CertificateVerifierWrapper({ metadata }: CertificateVerifierWrapperProps) {
  return <CertificateVerifier metadata={metadata} />
}