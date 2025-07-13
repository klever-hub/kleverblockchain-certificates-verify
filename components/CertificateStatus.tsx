'use client'

interface CertificateStatusProps {
  pdfValid: boolean | null
  fieldsVerified: number
  totalFields: number
  nftId?: string
}

export default function CertificateStatus({
  pdfValid,
  fieldsVerified,
  totalFields,
  nftId,
}: CertificateStatusProps) {
  const getOverallStatus = () => {
    // If no verification has been done yet
    if (pdfValid === null && fieldsVerified === 0) return 'pending'

    // If PDF is invalid
    if (pdfValid === false) return 'invalid'

    // If all fields are verified (with or without PDF)
    if (fieldsVerified === totalFields && totalFields > 0) {
      if (pdfValid === true) return 'fully-verified'
      return 'fields-verified'
    }

    // If some fields are verified
    if (fieldsVerified > 0) return 'partially-verified'

    // If only PDF is verified
    if (pdfValid === true) return 'pdf-only'

    return 'pending'
  }

  const status = getOverallStatus()

  const statusConfig = {
    pending: {
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/20',
      borderColor: 'border-gray-400/30',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Verification Pending',
      description: 'Upload your certificate PDF to begin verification',
    },
    invalid: {
      color: 'text-red-400',
      bgColor: 'bg-red-400/20',
      borderColor: 'border-red-400/30',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Invalid Certificate',
      description: 'This certificate could not be verified',
    },
    'pdf-only': {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/20',
      borderColor: 'border-yellow-400/30',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'PDF Verified',
      description: 'Document authenticity confirmed. Verify fields for complete validation.',
    },
    'partially-verified': {
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
      borderColor: 'border-blue-400/30',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Partially Verified',
      description: `${fieldsVerified} of ${totalFields} fields verified`,
    },
    'fields-verified': {
      color: 'text-accent',
      bgColor: 'bg-accent/20',
      borderColor: 'border-accent/30',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Fields Verified',
      description:
        'All certificate details have been validated. Upload PDF for complete verification.',
    },
    'fully-verified': {
      color: 'text-accent',
      bgColor: 'bg-accent/20',
      borderColor: 'border-accent/30',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: 'Fully Verified',
      description: 'This certificate is authentic and all details have been validated',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`glass-card p-6 ${config.borderColor} border-2 animate-scale-in`}>
      <div className="flex items-start gap-4">
        <div className={`${config.bgColor} p-3 rounded-full ${config.color}`}>{config.icon}</div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold mb-1 ${config.color}`}>{config.title}</h3>
          <p className="text-gray-300 text-sm mb-3">{config.description}</p>

          {/* Progress Bar */}
          {pdfValid && totalFields > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Verification Progress</span>
                <span>
                  {Math.round(((fieldsVerified + (pdfValid ? 1 : 0)) / (totalFields + 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-dark-lighter rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    status === 'fully-verified'
                      ? 'bg-accent'
                      : status === 'partially-verified'
                        ? 'bg-blue-400'
                        : 'bg-yellow-400'
                  }`}
                  style={{
                    width: `${((fieldsVerified + (pdfValid ? 1 : 0)) / (totalFields + 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* NFT ID */}
          {nftId && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400">
                NFT ID: <span className="font-mono text-gray-300">{nftId}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
