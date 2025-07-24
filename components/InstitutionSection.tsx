'use client'

import { IssuerVerificationResult } from '@/lib/issuer-registry'

interface InstitutionSectionProps {
  verification?: IssuerVerificationResult
  issuerAddress?: string
}

export default function InstitutionSection({
  verification,
  issuerAddress,
}: InstitutionSectionProps) {
  if (!verification) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Institution Not Verified
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Unable to verify the issuing institution for this certificate
          </p>
          {issuerAddress && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono truncate">
              {issuerAddress}
            </p>
          )}
        </div>
      </div>
    )
  }

  const { verificationLevel, issuerInfo, message } = verification

  const levelConfig = {
    gold: {
      bgColor:
        'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/50',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      badge: 'Gold Verified Institution',
      icon: '🏆',
    },
    silver: {
      bgColor:
        'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      borderColor: 'border-blue-300 dark:border-blue-700',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badge: 'Silver Verified Organization',
      icon: '🥈',
    },
    bronze: {
      bgColor:
        'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
      borderColor: 'border-orange-300 dark:border-orange-700',
      iconBg: 'bg-orange-100 dark:bg-orange-900/50',
      iconColor: 'text-orange-600 dark:text-orange-400',
      badge: 'Bronze Verified',
      icon: '🥉',
    },
    unverified: {
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
      borderColor: 'border-red-300 dark:border-red-700',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      iconColor: 'text-red-600 dark:text-red-400',
      badge: 'Not Verified',
      icon: '⚠️',
    },
  }

  const config = levelConfig[verificationLevel]

  return (
    <div className={`rounded-xl p-6 ${config.bgColor} border ${config.borderColor} transition-all`}>
      <div className="text-center">
        {/* Icon */}
        <div
          className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <span className="text-3xl">{config.icon}</span>
        </div>

        {/* Institution Name */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {issuerInfo?.name || 'Unknown Institution'}
        </h2>

        {/* Badge */}
        <p className={`text-sm font-medium ${config.iconColor} mb-2`}>{config.badge}</p>

        {/* Message */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{message}</p>

        {/* Additional Info */}
        {issuerInfo && (
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {issuerInfo.type && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {issuerInfo.type.charAt(0).toUpperCase() + issuerInfo.type.slice(1)}
              </span>
            )}
            {issuerInfo.country && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {issuerInfo.country}
              </span>
            )}
            {issuerInfo.website && (
              <a
                href={issuerInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                Visit Website
              </a>
            )}
          </div>
        )}

        {/* Warnings */}
        {verificationLevel === 'unverified' && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300">
              ⚠️ This certificate was issued by an unverified entity. Exercise caution.
            </p>
          </div>
        )}

        {verificationLevel === 'bronze' && (
          <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <p className="text-xs text-orange-700 dark:text-orange-300">
              ℹ️ This issuer is registered but pending full verification.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
