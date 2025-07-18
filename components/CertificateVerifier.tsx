'use client'

import { useState, useEffect, useCallback } from 'react'
import { hashPDF, verifyMerkleProof } from '@/lib/crypto-utils'
import { NFTMetadata } from '@/lib/klever-api'
import CryptoJS from 'crypto-js'
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
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([])
  const [isVerifyingAll, setIsVerifyingAll] = useState(false)
  const [salt, setSalt] = useState(initialSalt)
  const [saltFromPdf, setSaltFromPdf] = useState<string | null>(null)
  const [verificationEnabled, setVerificationEnabled] = useState(!!initialSalt)
  const [displaySalt, setDisplaySalt] = useState(
    initialSalt ? formatSaltForDisplay(initialSalt) : ''
  )

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

  // Helper function to extract and apply PDF metadata
  const extractAndApplyMetadata = async (pdfFile: File) => {
    try {
      const { extractPDFMetadata } = await import('@/lib/pdf-metadata')
      const pdfMetadata = await extractPDFMetadata(pdfFile)
      if (Object.keys(pdfMetadata).length > 0) {
        const filled: string[] = []
        setFieldVerifications(prev => {
          const updated = { ...prev }
          for (const field of availableFields) {
            if (pdfMetadata[field] && !prev[field].value) {
              updated[field] = {
                ...prev[field],
                value: pdfMetadata[field],
                isValid: null,
              }
              filled.push(field)
            }
          }
          return updated
        })
        if (filled.length > 0) {
          setAutoFilledFields(filled)
          // Clear auto-filled indicator after 3 seconds
          setTimeout(() => setAutoFilledFields([]), 3000)
        } else {
          console.log(
            'No metadata fields found in PDF that match available fields:',
            availableFields
          )
          console.log('PDF metadata keys:', Object.keys(pdfMetadata))
          console.log('Available fields from proofs:', availableFields)
        }

        // Check for salt in PDF metadata
        if (pdfMetadata.salt) {
          // Clean the salt by removing dashes
          const cleanedSalt = pdfMetadata.salt.replace(/-/g, '')
          setSaltFromPdf(cleanedSalt)
          // Only auto-apply salt if no salt is currently set
          if (!salt) {
            setSalt(cleanedSalt)
            setDisplaySalt(formatSaltForDisplay(cleanedSalt))
            onSaltChange?.(cleanedSalt)
            setVerificationEnabled(true) // Enable verification when salt is loaded from PDF
          }
        }

        // Always log for debugging
        console.log('Auto-fill debug:', {
          availableFields,
          pdfMetadataKeys: Object.keys(pdfMetadata),
          filledCount: filled.length,
          securityCode: pdfMetadata.salt,
        })
      }
    } catch (error) {
      console.error('Error extracting PDF metadata:', error)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0]
      setFile(newFile)
      setPdfVerificationResult({ isValid: null, message: '' })

      // Extract metadata and auto-fill fields
      await extractAndApplyMetadata(newFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0 && files[0].type === 'application/pdf') {
      const newFile = files[0]
      setFile(newFile)
      setPdfVerificationResult({ isValid: null, message: '' })

      // Extract metadata and auto-fill fields
      await extractAndApplyMetadata(newFile)
    }
  }

  const verifyPDF = useCallback(async () => {
    if (!file) return

    try {
      const pdfHash = await hashPDF(file)

      // Use the blockchain hash for comparison
      const expectedHash = metadata.hash

      const isPdfValid = pdfHash === expectedHash

      console.log('PDF Verification Debug:', {
        calculatedHash: pdfHash,
        expectedHash: expectedHash,
        match: isPdfValid,
      })

      // For now, if hashes don't match, check if PDF has valid metadata structure
      let verificationMessage = ''
      if (isPdfValid) {
        verificationMessage =
          'PDF verification successful! The document matches the blockchain record.'
      } else {
        // Try to check if PDF has valid metadata as alternative validation
        try {
          const { extractPDFMetadata } = await import('@/lib/pdf-metadata')
          const pdfMetadata = await extractPDFMetadata(file)

          if (pdfMetadata.nft_id === `${metadata.ticker}/${metadata.nonce}`) {
            verificationMessage = `PDF hash mismatch detected, but the document contains valid metadata for NFT ${pdfMetadata.nft_id}. The hash calculation method may differ.`
            console.log('PDF has valid NFT metadata despite hash mismatch')
          } else {
            verificationMessage = `PDF verification failed. The calculated hash (${pdfHash.substring(0, 16)}...) does not match the expected hash (${expectedHash.substring(0, 16)}...).`
          }
        } catch (error) {
          console.error('Error extracting PDF metadata:', error)
          verificationMessage = `PDF verification failed. The calculated hash (${pdfHash.substring(0, 16)}...) does not match the expected hash (${expectedHash.substring(0, 16)}...).`
        }
      }

      setPdfVerificationResult({
        isValid: isPdfValid,
        message: verificationMessage,
      })
    } catch (error) {
      setPdfVerificationResult({
        isValid: false,
        message: `Error verifying PDF: ${error}`,
      })
    }
  }, [file, metadata.hash, metadata.ticker, metadata.nonce])

  // Auto-verify PDF on file upload
  useEffect(() => {
    if (file) {
      verifyPDF()
    }
  }, [file, verifyPDF])

  const handleFieldChange = (field: string, value: string) => {
    setFieldVerifications(prev => ({
      ...prev,
      [field]: { ...prev[field], value, isValid: null },
    }))
    // Remove from auto-filled list if manually edited
    setAutoFilledFields(prev => prev.filter(f => f !== field))
  }

  const verifyAllFields = async () => {
    setIsVerifyingAll(true)

    // Get all fields that have values and haven't been verified yet
    const fieldsToVerify = availableFields.filter(
      field => fieldVerifications[field].value && fieldVerifications[field].isValid !== true
    )

    // Verify each field sequentially
    for (const field of fieldsToVerify) {
      await verifyField(field)
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsVerifyingAll(false)
  }

  const verifyField = async (fieldName: string) => {
    const fieldData = fieldVerifications[fieldName]
    if (!fieldData.value || !metadata.rootHash || !metadata.proofs) return

    setFieldVerifications(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], isVerifying: true },
    }))

    try {
      const leaf = `${fieldName}:${fieldData.value}`
      const proof = metadata.proofs[`${fieldName}Proof`] || []

      console.log('Field Verification Debug:', {
        field: fieldName,
        value: fieldData.value,
        leaf: leaf,
        leafHash: CryptoJS.SHA256(leaf).toString(),
        proof: proof,
        rootHash: metadata.rootHash,
      })

      if (proof.length > 0) {
        const isValid = verifyMerkleProof(leaf, proof, metadata.rootHash, salt)

        setFieldVerifications(prev => ({
          ...prev,
          [fieldName]: { ...prev[fieldName], isValid, isVerifying: false },
        }))
      } else {
        setFieldVerifications(prev => ({
          ...prev,
          [fieldName]: { ...prev[fieldName], isValid: false, isVerifying: false },
        }))
      }
    } catch (error) {
      console.error('Field verification error:', error)
      setFieldVerifications(prev => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], isValid: false, isVerifying: false },
      }))
    }
  }

  const formatFieldName = (field: string) => {
    // Handle special cases
    const specialCases: { [key: string]: string } = {
      instructor_title: 'Instructor Title',
      nft_id: 'NFT ID',
      pdf_hash: 'PDF Hash',
    }

    if (specialCases[field]) {
      return specialCases[field]
    }

    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  // Calculate verification stats
  const verifiedFieldsCount = Object.values(fieldVerifications).filter(
    f => f.isValid === true
  ).length
  const totalFieldsCount = availableFields.length

  return (
    <div className="space-y-8">
      {/* Certificate Status Summary */}
      <CertificateStatus
        pdfValid={pdfVerificationResult.isValid}
        fieldsVerified={verifiedFieldsCount}
        totalFields={totalFieldsCount}
        nftId={metadata.nft_id}
      />

      {/* Step 1: Upload PDF (Optional) */}
      <div className="glass-card p-6 sm:p-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              pdfVerificationResult.isValid === true
                ? 'bg-accent'
                : pdfVerificationResult.isValid === false
                  ? 'bg-red-500'
                  : 'bg-gray-600'
            }`}
          >
            {pdfVerificationResult.isValid === true ? '✓' : <span className="text-sm">PDF</span>}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upload Certificate PDF
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Optional - Only needed for document verification
            </p>
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Have the digital PDF? Upload it to verify the document hash. You can still verify
          individual fields without uploading.
        </p>
        <div
          className="relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" className="block w-full cursor-pointer">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-primary bg-primary/10 scale-105'
                  : 'border-white/20 hover:border-primary/50'
              }`}
            >
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                {file ? file.name : 'Drop your PDF here or click to browse'}
              </p>
              <p className="text-sm text-gray-500">PDF files only • Max 10MB</p>
            </div>
          </label>
        </div>
      </div>

      {/* PDF Verification Status */}
      {pdfVerificationResult.message && (
        <div
          className={`glass-card p-6 animate-scale-in ${
            pdfVerificationResult.isValid
              ? 'border-accent/30 bg-accent/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}
        >
          <div className="flex items-start">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                pdfVerificationResult.isValid ? 'bg-accent/20' : 'bg-red-500/20'
              }`}
            >
              {pdfVerificationResult.isValid ? (
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <div className="ml-4 flex-1">
              <h4
                className={`text-lg font-semibold mb-2 ${
                  pdfVerificationResult.isValid ? 'text-accent' : 'text-red-400'
                }`}
              >
                PDF {pdfVerificationResult.isValid ? 'Verified' : 'Verification Failed'}
              </h4>
              <p className="text-gray-700 dark:text-gray-300">{pdfVerificationResult.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Salt Configuration */}
      {metadata.rootHash && (
        <div className="glass-card p-6 sm:p-8 animate-slide-up animation-delay-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-600 text-white font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Security Code</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Enter the security code provided with your certificate for enhanced verification.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={displaySalt}
              onChange={e => {
                const inputValue = e.target.value
                // Allow only alphanumeric and dashes
                if (!/^[a-zA-Z0-9-]*$/.test(inputValue)) return

                // Remove dashes and update both display and actual salt
                const cleanedValue = inputValue.replace(/-/g, '')
                setSalt(cleanedValue)
                setDisplaySalt(formatSaltForDisplay(cleanedValue))
                onSaltChange?.(cleanedValue)
                if (cleanedValue) {
                  setVerificationEnabled(true)
                }
              }}
              placeholder="Enter security code (optional)"
              className="w-full px-4 py-2 bg-white dark:bg-dark border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary/50 transition-all font-mono"
            />
            {saltFromPdf && salt !== saltFromPdf && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    PDF contains security code:{' '}
                    <code className="font-mono text-xs bg-blue-100 dark:bg-blue-500/20 px-1 py-0.5 rounded">
                      {formatSaltForDisplay(saltFromPdf)}
                    </code>
                  </p>
                </div>
                <button
                  onClick={() => {
                    // saltFromPdf is already cleaned
                    setSalt(saltFromPdf)
                    setDisplaySalt(formatSaltForDisplay(saltFromPdf))
                    onSaltChange?.(saltFromPdf)
                    setVerificationEnabled(true)
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Use PDF code
                </button>
              </div>
            )}
            {!salt && !verificationEnabled && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg border border-yellow-200 dark:border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                      No security code provided
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-3">
                      Verification without a security code may not match the expected results. Click
                      below if you want to proceed anyway.
                    </p>
                    <button
                      onClick={() => setVerificationEnabled(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Enable Verification Without Security Code
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Certificate Fields Verification */}
      {metadata.rootHash && availableFields.length > 0 && (
        <div className="glass-card p-6 sm:p-8 animate-slide-up animation-delay-200">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                verifiedFieldsCount === totalFieldsCount && totalFieldsCount > 0
                  ? 'bg-accent'
                  : verifiedFieldsCount > 0
                    ? 'bg-blue-500'
                    : 'bg-primary'
              }`}
            >
              {verifiedFieldsCount === totalFieldsCount && totalFieldsCount > 0 ? (
                '✓'
              ) : (
                <span className="text-sm">Fields</span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify Certificate Details
            </h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Enter the certificate details exactly as they appear on your document (printed or
            digital) to verify individual fields.
          </p>

          {/* Quick Actions */}
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary/10 rounded-xl border border-primary-200 dark:border-transparent">
            {!verificationEnabled && !salt ? (
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <strong>Verification locked:</strong> Please provide a security code or enable
                verification without code above
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong className="text-gray-900 dark:text-white">Tip:</strong> You can find these
                  details on your PDF certificate
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Fields marked with ✓ have been successfully verified
                </div>
                {autoFilledFields.length > 0 && (
                  <div className="mt-2 text-xs text-accent-600 dark:text-accent animate-pulse">
                    ✨ Auto-filled {autoFilledFields.length} field
                    {autoFilledFields.length > 1 ? 's' : ''} from PDF metadata
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            {availableFields.map(field => (
              <div
                key={field}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  fieldVerifications[field].isValid === true
                    ? 'bg-accent-50 dark:bg-accent/10 border border-accent-200 dark:border-accent/30'
                    : fieldVerifications[field].isValid === false
                      ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
                      : 'bg-gray-50 dark:bg-dark-lighter border border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {formatFieldName(field)}
                      {fieldVerifications[field].isValid === true && (
                        <span className="ml-2 text-accent-600 dark:text-accent">✓</span>
                      )}
                      {autoFilledFields.includes(field) && (
                        <span className="ml-2 text-xs text-primary-600 dark:text-primary animate-pulse">
                          (auto-filled)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={fieldVerifications[field].value}
                      onChange={e => handleFieldChange(field, e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-dark border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary/50 transition-all disabled:bg-gray-100 dark:disabled:bg-dark/50 disabled:cursor-not-allowed"
                      placeholder={`Enter ${formatFieldName(field).toLowerCase()}`}
                      disabled={fieldVerifications[field].isValid === true}
                    />
                  </div>
                  <button
                    onClick={() => verifyField(field)}
                    disabled={
                      !verificationEnabled ||
                      !fieldVerifications[field].value ||
                      fieldVerifications[field].isVerifying ||
                      fieldVerifications[field].isValid === true ||
                      isVerifyingAll
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      fieldVerifications[field].isValid === true
                        ? 'bg-accent-100 dark:bg-accent/20 text-accent-700 dark:text-accent cursor-default'
                        : 'bg-primary-100 dark:bg-primary/20 text-primary-700 dark:text-primary hover:bg-primary-200 dark:hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {fieldVerifications[field].isVerifying ? (
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : fieldVerifications[field].isValid === true ? (
                      'Verified'
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
                {fieldVerifications[field].isValid === false && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    This value doesn&apos;t match the certificate record. Please check and try
                    again.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Batch Actions */}
          {verifiedFieldsCount < totalFieldsCount && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {totalFieldsCount - verifiedFieldsCount} field
                  {totalFieldsCount - verifiedFieldsCount !== 1 ? 's' : ''} remaining
                </p>
                {availableFields.some(
                  field =>
                    fieldVerifications[field].value && fieldVerifications[field].isValid !== true
                ) && (
                  <button
                    onClick={verifyAllFields}
                    disabled={!verificationEnabled || isVerifyingAll}
                    className="px-6 py-2 bg-primary-100 dark:bg-primary/20 text-primary-700 dark:text-primary hover:bg-primary-200 dark:hover:bg-primary/30 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifyingAll ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Verify All Fields
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
