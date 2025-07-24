'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { hashPDF, verifyMerkleProof } from '@/lib/crypto-utils'
import { NFTMetadata } from '@/lib/klever-api'
import CertificateStatus from './CertificateStatus'

interface CertificateVerifierProps {
  metadata: NFTMetadata
  salt?: string
  onSaltChange?: (salt: string) => void
}

interface FieldVerification {
  [key: string]: {
    value: string
    isValid: boolean | null
    isVerifying: boolean
  }
}

export default function CertificateVerifier({
  metadata,
  salt: initialSalt = '',
  onSaltChange,
}: CertificateVerifierProps) {
  const [file, setFile] = useState<File | null>(null)
  const [pdfVerificationResult, setPdfVerificationResult] = useState<{
    isValid: boolean | null
    message: string
  }>({ isValid: null, message: '' })
  const [isDragging, setIsDragging] = useState(false)
  const [isVerifyingAll, setIsVerifyingAll] = useState(false)
  const [salt, setSalt] = useState(initialSalt)
  const [displaySalt, setDisplaySalt] = useState(
    initialSalt ? formatSaltForDisplay(initialSalt) : ''
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Format salt for display with dashes every 4 characters
  function formatSaltForDisplay(value: string) {
    const cleaned = value.replace(/-/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join('-')
  }

  // Dynamically get available fields from metadata.proofs
  const availableFields = metadata.proofs
    ? Object.keys(metadata.proofs)
        .filter(key => key.endsWith('Proof'))
        .map(key => key.replace('Proof', ''))
    : []


  const [fieldVerifications, setFieldVerifications] = useState<FieldVerification>(
    availableFields.reduce(
      (acc, field) => ({
        ...acc,
        [field]: { value: '', isValid: null, isVerifying: false },
      }),
      {}
    )
  )

  // Auto-focus on first empty field on mount
  useEffect(() => {
    const firstEmptyField = availableFields.find(
      field => !fieldVerifications[field]?.value
    )
    if (firstEmptyField) {
      const input = document.getElementById(`field-${firstEmptyField}`)
      input?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Helper function to extract and apply PDF metadata
  const extractAndApplyMetadata = async (pdfFile: File) => {
    try {
      const { extractPDFMetadata } = await import('@/lib/pdf-metadata')
      const pdfMetadata = await extractPDFMetadata(pdfFile)
      if (Object.keys(pdfMetadata).length > 0) {
        setFieldVerifications(prev => {
          const updated = { ...prev }
          for (const field of availableFields) {
            if (pdfMetadata[field] && !prev[field].value) {
              updated[field] = {
                ...prev[field],
                value: pdfMetadata[field],
                isValid: null,
              }
            }
          }
          return updated
        })
        
        // Extract salt from PDF
        if (pdfMetadata.salt) {
          const cleanedSalt = pdfMetadata.salt.replace(/-/g, '')
          setSalt(cleanedSalt)
          setDisplaySalt(formatSaltForDisplay(cleanedSalt))
          onSaltChange?.(cleanedSalt)
        }
      }
      return pdfMetadata
    } catch {
      // Error extracting PDF metadata
      return {}
    }
  }

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile)
    const pdfMetadata = await extractAndApplyMetadata(uploadedFile)
    
    // Auto-verify PDF
    try {
      const pdfHash = await hashPDF(uploadedFile)
      const expectedHash = metadata.hash
      const isPdfValid = pdfHash === expectedHash

      if (isPdfValid) {
        setPdfVerificationResult({
          isValid: true,
          message: 'PDF verified',
        })
      } else if (pdfMetadata.nft_id === metadata.nft_id) {
        setPdfVerificationResult({
          isValid: true,
          message: 'PDF metadata valid',
        })
      } else {
        setPdfVerificationResult({
          isValid: false,
          message: 'PDF verification failed',
        })
      }
    } catch {
      // PDF verification error
      setPdfVerificationResult({
        isValid: false,
        message: 'Verification error',
      })
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.type === 'application/pdf') {
        handleFileUpload(droppedFile)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metadata.hash]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileUpload(selectedFile)
    }
  }

  // Verify a single field
  const verifyField = async (fieldName: string): Promise<boolean> => {
    const fieldData = fieldVerifications[fieldName]
    if (!fieldData || !fieldData.value) {
      return false
    }

    setFieldVerifications(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], isVerifying: true },
    }))

    try {
      const leaf = `${fieldName}:${fieldData.value}`
      const proofKey = `${fieldName}Proof`
      const proof = metadata.proofs?.[proofKey] || []

      if (proof.length > 0) {
        const isValid = verifyMerkleProof(leaf, proof, metadata.rootHash, salt)

        setFieldVerifications(prev => ({
          ...prev,
          [fieldName]: { ...prev[fieldName], isValid, isVerifying: false },
        }))
        
        return isValid
      } else {
        setFieldVerifications(prev => ({
          ...prev,
          [fieldName]: { ...prev[fieldName], isValid: false, isVerifying: false },
        }))
        return false
      }
    } catch {
      // Field verification error
      setFieldVerifications(prev => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], isValid: false, isVerifying: false },
      }))
      return false
    }
  }

  // Verify all fields
  const verifyAllFields = async () => {

    setIsVerifyingAll(true)
    // Variable to track if all fields are valid (removed with console.log statements)
    const verificationResults: Record<string, boolean> = {}
    
    for (const field of availableFields) {

      if (fieldVerifications[field]?.value) {
        const isFieldValid = await verifyField(field)
        verificationResults[field] = isFieldValid
        
        if (!isFieldValid) {
          // allValid = false
        } else {
        }
      } else {
        // allValid = false
        verificationResults[field] = false
      }
    }
    
    setIsVerifyingAll(false)
    

    // All fields verified successfully
  }

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  const verifiedFieldsCount = Object.values(fieldVerifications).filter(
    f => f.isValid === true
  ).length
  const totalFieldsCount = availableFields.length

  const allFieldsFilled = availableFields.every(
    field => fieldVerifications[field]?.value
  )


  return (
    <div className="max-w-4xl mx-auto">
      {/* Compact Status */}
      <div className="mb-6">
        <CertificateStatus
          pdfValid={pdfVerificationResult.isValid}
          fieldsVerified={verifiedFieldsCount}
          totalFields={totalFieldsCount}
          nftId={metadata.nft_id}
        />
      </div>

      {/* Main Card */}
      <div className="glass-card p-6 sm:p-8">
        <div className="space-y-6">
            {/* PDF Upload - Compact */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : file
                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary'
              }`}
              onDrop={handleDrop}
              onDragOver={e => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {file ? (
                    <>
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </span>
                      {pdfVerificationResult.isValid && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ({pdfVerificationResult.message})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Upload PDF (optional)
                      </span>
                    </>
                  )}
                </div>
                {file && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setPdfVerificationResult({ isValid: null, message: '' })
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Security Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Security Code {salt ? '(auto-filled from PDF)' : '(if provided)'}
              </label>
              <input
                type="text"
                value={displaySalt}
                onChange={e => {
                  const inputValue = e.target.value
                  if (!/^[a-zA-Z0-9-]*$/.test(inputValue)) return
                  const cleanedValue = inputValue.replace(/-/g, '')
                  setSalt(cleanedValue)
                  setDisplaySalt(formatSaltForDisplay(cleanedValue))
                  onSaltChange?.(cleanedValue)
                }}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full px-4 py-2 bg-white dark:bg-dark border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary/50 transition-all font-mono"
              />
            </div>

            {/* All Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              {availableFields.map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {formatFieldName(field)}
                  </label>
                  <div className="relative">
                    <input
                      id={`field-${field}`}
                      type="text"
                      value={fieldVerifications[field]?.value || ''}
                      onChange={e => {
                        const newValue = e.target.value
                        setFieldVerifications(prev => ({
                          ...prev,
                          [field]: { ...prev[field], value: newValue, isValid: null },
                        }))
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && fieldVerifications[field]?.value) {
                          verifyField(field)
                        }
                      }}
                      className={`w-full px-4 py-2 pr-20 bg-white dark:bg-dark border rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        fieldVerifications[field]?.isValid === true
                          ? 'border-green-500 dark:border-green-400 ring-green-500/20'
                          : fieldVerifications[field]?.isValid === false
                            ? 'border-red-500 dark:border-red-400 ring-red-500/20'
                            : 'border-gray-300 dark:border-white/10 focus:ring-primary-500/20'
                      }`}
                      placeholder={`Enter ${formatFieldName(field).toLowerCase()}`}
                    />
                    {/* Verify button or status icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {fieldVerifications[field]?.isVerifying ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : fieldVerifications[field]?.isValid === true ? (
                        <div className="text-green-500">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : fieldVerifications[field]?.isValid === false ? (
                        <button
                          onClick={() => verifyField(field)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                          title="Retry verification"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      ) : fieldVerifications[field]?.value ? (
                        <button
                          onClick={() => verifyField(field)}
                          className="text-primary hover:text-primary-600 transition-colors"
                          title="Verify field"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyAllFields}
              disabled={isVerifyingAll || !allFieldsFilled}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifyingAll ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify Certificate'
              )}
            </button>
        </div>
      </div>
    </div>
  )
}
