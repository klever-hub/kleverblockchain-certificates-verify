'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [certificateId, setCertificateId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (certificateId.includes('/')) {
      router.push(`/${certificateId}`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold mb-4">
              <span className="text-gradient">Klever</span>
              <span className="block text-3xl sm:text-4xl mt-2 text-white">Certificate Verification</span>
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-300 mb-12">
            Verify your blockchain-secured certificates with confidence
          </p>
        </div>
        
        <div className="glass-card p-8 neon-glow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="certificate-id" className="block text-sm font-medium text-gray-300 mb-2">
                Certificate ID
              </label>
              <input
                id="certificate-id"
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Enter TICKER/NONCE"
                className="input-modern"
              />
              <p className="mt-3 text-sm text-gray-400">
                Example: CERT/123456
              </p>
            </div>
            
            <button
              type="submit"
              disabled={!certificateId.includes('/')}
              className="btn-primary w-full text-lg"
            >
              Verify Certificate
            </button>
          </form>
        </div>
        
        <div className="text-center pt-8">
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <span className="text-gradient font-semibold">Klever Blockchain</span>
          </p>
        </div>
      </div>
    </main>
  )
}