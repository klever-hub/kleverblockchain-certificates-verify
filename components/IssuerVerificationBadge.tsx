'use client'

import { IssuerVerificationResult } from '@/lib/issuer-registry'

interface IssuerVerificationBadgeProps {
  verification?: IssuerVerificationResult
  issuerAddress?: string
  compact?: boolean
}

export default function IssuerVerificationBadge({
  verification,
  issuerAddress,
  compact = false,
}: IssuerVerificationBadgeProps) {
  if (!verification && !issuerAddress) {
    return null
  }

  // If no verification result, show unverified status
  if (!verification) {
    return (
      <div
        className={`${compact ? 'inline-flex' : 'flex'} items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-500/20 border border-gray-300 dark:border-gray-500/30`}
      >
        <span className="text-gray-600 dark:text-gray-400">⚠️</span>
        <div className={compact ? 'text-sm' : ''}>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Issuer Not Verified</p>
          {!compact && issuerAddress && (
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-mono truncate max-w-xs">
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
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-400/20',
      borderColor: 'border-yellow-300 dark:border-yellow-400/30',
      icon: '🏆',
      badge: 'Gold Verified',
    },
    silver: {
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-400/20',
      borderColor: 'border-blue-300 dark:border-blue-400/30',
      icon: '🥈',
      badge: 'Silver Verified',
    },
    bronze: {
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-400/20',
      borderColor: 'border-orange-300 dark:border-orange-400/30',
      icon: '🥉',
      badge: 'Bronze Verified',
    },
    unverified: {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-400/20',
      borderColor: 'border-red-300 dark:border-red-400/30',
      icon: '⚠️',
      badge: 'Not Verified',
    },
  }

  const config = levelConfig[verificationLevel]

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${config.borderColor} border`}
      >
        <span>{config.icon}</span>
        <span>{config.badge}</span>
      </span>
    )
  }

  return (
    <div className={`rounded-lg p-4 ${config.bgColor} border ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold ${config.color}`}>
              {issuerInfo?.name || 'Unknown Issuer'}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} border ${config.borderColor}`}
            >
              {config.badge}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{message}</p>

          {issuerInfo && (
            <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              {issuerInfo.type && (
                <p>Type: {issuerInfo.type.charAt(0).toUpperCase() + issuerInfo.type.slice(1)}</p>
              )}
              {issuerInfo.website && (
                <p>
                  Website:{' '}
                  <a
                    href={issuerInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {issuerInfo.website}
                  </a>
                </p>
              )}
              {issuerInfo.country && <p>Country: {issuerInfo.country}</p>}
              {issuerInfo.accreditation && issuerInfo.accreditation.length > 0 && (
                <p>Accreditations: {issuerInfo.accreditation.join(', ')}</p>
              )}
              {issuerAddress && <p className="font-mono truncate">Address: {issuerAddress}</p>}
            </div>
          )}

          {verificationLevel === 'unverified' && issuerAddress && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-500/10 rounded border border-red-200 dark:border-red-500/20">
              <p className="text-xs text-red-600 dark:text-red-400">
                ⚠️ This certificate was issued by an unverified entity. Exercise caution when
                accepting this certificate.
              </p>
            </div>
          )}

          {verificationLevel === 'bronze' && (
            <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-500/10 rounded border border-orange-200 dark:border-orange-500/20">
              <p className="text-xs text-orange-600 dark:text-orange-400">
                ℹ️ This issuer is registered but pending full verification. Contact the issuer for
                more information.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
