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
    if (pdfValid === null && fieldsVerified === 0) return 'pending'
    if (pdfValid === false) return 'invalid'
    if (fieldsVerified === totalFields && totalFields > 0) {
      if (pdfValid === true) return 'fully-verified'
      return 'fields-verified'
    }
    if (fieldsVerified > 0) return 'partially-verified'
    if (pdfValid === true) return 'pdf-only'
    return 'pending'
  }

  const status = getOverallStatus()

  const statusConfig = {
    pending: {
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/50',
      borderColor: 'border-gray-200 dark:border-gray-800',
      icon: '○',
      title: 'Ready to Verify',
      progress: 0,
    },
    invalid: {
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-900',
      icon: '✕',
      title: 'Verification Failed',
      progress: 0,
    },
    'pdf-only': {
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-900',
      icon: '◐',
      title: 'PDF Verified',
      progress: 33,
    },
    'partially-verified': {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-900',
      icon: '◑',
      title: 'Partially Verified',
      progress: 50 + (fieldsVerified / totalFields) * 30,
    },
    'fields-verified': {
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-900',
      icon: '◕',
      title: 'Fields Verified',
      progress: 80,
    },
    'fully-verified': {
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-900',
      icon: '●',
      title: 'Fully Verified',
      progress: 100,
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`rounded-xl p-4 ${config.bgColor} border ${config.borderColor} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${config.color}`}>{config.icon}</span>
          <div>
            <h3 className={`font-semibold ${config.color}`}>{config.title}</h3>
            {nftId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">NFT: {nftId}</p>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {fieldsVerified}/{totalFields} fields
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            status === 'invalid'
              ? 'bg-red-500'
              : status === 'fully-verified'
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-blue-500 to-emerald-500'
          }`}
          style={{ width: `${config.progress}%` }}
        />
      </div>
    </div>
  )
}
