'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [certificateId, setCertificateId] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (certificateId.includes('/')) {
      router.push(`/${certificateId}`)
    }
  }

  const handleDemo = () => {
    setCertificateId('KCERT-V2YJ/1')
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold mb-4">
              <span className="text-gradient">Klever</span>
              <span className="block text-3xl sm:text-4xl mt-2 text-white">Certificate Verification</span>
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Instantly verify the authenticity of your educational certificates secured on the Klever Blockchain
          </p>
        </div>

        {/* Main Verification Card */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="glass-card p-8 neon-glow animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Verify Your Certificate</h2>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle help"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {showHelp && (
              <div className="mb-6 p-4 bg-primary/10 rounded-xl text-sm text-gray-300 animate-fade-in">
                <p className="mb-2">
                  <strong>How to find your Certificate ID:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your certificate email for the NFT ID</li>
                  <li>Look for a QR code on your PDF certificate</li>
                  <li>Format: COLLECTION/NUMBER (e.g., KCERT-V2YJ/1)</li>
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="certificate-id" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter Certificate ID
                </label>
                <div className="relative">
                  <input
                    id="certificate-id"
                    type="text"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    placeholder="TICKER/NONCE"
                    className="input-modern pr-20"
                  />
                  <button
                    type="button"
                    onClick={handleDemo}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-primary hover:text-primary-light transition-colors"
                  >
                    Try Demo
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  Example: KCERT-V2YJ/1
                </p>
              </div>
              
              <button
                type="submit"
                disabled={!certificateId.includes('/')}
                className="btn-primary w-full text-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verify Certificate
              </button>
            </form>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 animate-fade-in animation-delay-200">
          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Enter Certificate ID</h3>
            <p className="text-sm text-gray-400">
              Find the unique NFT ID on your certificate or in your email
            </p>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Upload PDF</h3>
            <p className="text-sm text-gray-400">
              Drop your certificate PDF to verify its authenticity
            </p>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Get Verified</h3>
            <p className="text-sm text-gray-400">
              Blockchain verification ensures your certificate is genuine
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4">
            Trusted by educational institutions worldwide
          </p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-gradient">10,000+</p>
              <p className="text-xs text-gray-500">Certificates Verified</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gradient">99.9%</p>
              <p className="text-xs text-gray-500">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gradient">Instant</p>
              <p className="text-xs text-gray-500">Verification</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}