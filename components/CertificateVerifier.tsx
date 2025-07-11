'use client'

import { useState, useEffect } from 'react'
import { hashPDF, verifyMerkleProof } from '@/lib/crypto-utils'
import { NFTMetadata } from '@/lib/klever-api'
import CryptoJS from 'crypto-js'

interface CertificateVerifierProps {
  metadata: NFTMetadata
}

interface FieldVerification {
  [key: string]: {
    value: string
    isValid: boolean | null
    isVerifying: boolean
  }
}

export default function CertificateVerifier({ metadata }: CertificateVerifierProps) {
  const [file, setFile] = useState<File | null>(null)
  const [pdfVerificationResult, setPdfVerificationResult] = useState<{
    isValid: boolean | null
    message: string
  }>({ isValid: null, message: '' })
  const [isVerifyingPdf, setIsVerifyingPdf] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Dynamically get available fields from metadata.proofs
  const availableFields = metadata.proofs 
    ? Object.keys(metadata.proofs)
        .filter(key => key.endsWith('Proof'))
        .map(key => key.replace('Proof', ''))
    : []
  
  const [fieldVerifications, setFieldVerifications] = useState<FieldVerification>(
    availableFields.reduce((acc, field) => ({
      ...acc,
      [field]: { value: '', isValid: null, isVerifying: false }
    }), {})
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0]
      setFile(newFile)
      setPdfVerificationResult({ isValid: null, message: '' })
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0 && files[0].type === 'application/pdf') {
      setFile(files[0])
      setPdfVerificationResult({ isValid: null, message: '' })
    }
  }

  // Auto-verify PDF on file upload
  useEffect(() => {
    if (file) {
      verifyPDF()
    }
  }, [file])

  const verifyPDF = async () => {
    if (!file) return

    setIsVerifyingPdf(true)
    try {
      const pdfHash = await hashPDF(file)
      const isPdfValid = pdfHash === metadata.hash

      console.log('PDF Verification Debug:', {
        calculatedHash: pdfHash,
        expectedHash: metadata.hash,
        match: isPdfValid
      })

      setPdfVerificationResult({
        isValid: isPdfValid,
        message: isPdfValid 
          ? 'PDF verification successful! The document matches the blockchain record.' 
          : 'PDF verification failed. The document does not match the blockchain record.'
      })
    } catch (error) {
      setPdfVerificationResult({
        isValid: false,
        message: `Error verifying PDF: ${error}`
      })
    } finally {
      setIsVerifyingPdf(false)
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFieldVerifications(prev => ({
      ...prev,
      [field]: { ...prev[field], value, isValid: null }
    }))
  }

  const verifyField = async (fieldName: string) => {
    const fieldData = fieldVerifications[fieldName]
    if (!fieldData.value || !metadata.rootHash || !metadata.proofs) return

    setFieldVerifications(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], isVerifying: true }
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
        rootHash: metadata.rootHash
      })
      
      if (proof.length > 0) {
        const isValid = verifyMerkleProof(leaf, proof, metadata.rootHash)
        
        setFieldVerifications(prev => ({
          ...prev,
          [fieldName]: { ...prev[fieldName], isValid, isVerifying: false }
        }))
      } else {
        setFieldVerifications(prev => ({
          ...prev,
          [fieldName]: { ...prev[fieldName], isValid: false, isVerifying: false }
        }))
      }
    } catch (error) {
      console.error('Field verification error:', error)
      setFieldVerifications(prev => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], isValid: false, isVerifying: false }
      }))
    }
  }

  const formatFieldName = (field: string) => {
    // Handle special cases
    const specialCases: { [key: string]: string } = {
      'instructor_title': 'Instructor Title',
      'nft_id': 'NFT ID',
      'pdf_hash': 'PDF Hash'
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

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 sm:p-8 animate-slide-up">
        <h3 className="text-2xl font-bold mb-6 text-white">
          Upload Certificate PDF
        </h3>
        <p className="text-gray-300 mb-6">
          Upload your certificate PDF to verify its authenticity against the blockchain record.
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
          <label
            htmlFor="pdf-upload"
            className="block w-full cursor-pointer"
          >
            <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
              isDragging 
                ? 'border-primary bg-primary/10 scale-105' 
                : 'border-white/20 hover:border-primary/50'
            }`}>
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg text-gray-300 mb-2">
                {file ? file.name : 'Drop your PDF here or click to browse'}
              </p>
              <p className="text-sm text-gray-500">
                PDF files only • Max 10MB
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* PDF Verification Status */}
      {pdfVerificationResult.message && (
        <div className={`glass-card p-6 animate-scale-in ${
          pdfVerificationResult.isValid 
            ? 'border-accent/30 bg-accent/10' 
            : 'border-red-500/30 bg-red-500/10'
        }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              pdfVerificationResult.isValid ? 'bg-accent/20' : 'bg-red-500/20'
            }`}>
              {pdfVerificationResult.isValid ? (
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="ml-4 flex-1">
              <h4 className={`text-lg font-semibold mb-2 ${
                pdfVerificationResult.isValid ? 'text-accent' : 'text-red-400'
              }`}>
                PDF {pdfVerificationResult.isValid ? 'Verified' : 'Verification Failed'}
              </h4>
              <p className="text-gray-300">
                {pdfVerificationResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Fields Verification */}
      {metadata.rootHash && availableFields.length > 0 && (
        <div className="glass-card p-6 sm:p-8 animate-slide-up animation-delay-200">
          <h3 className="text-2xl font-bold mb-6 text-white">
            Verify Certificate Details
          </h3>
          <p className="text-gray-300 mb-6">
            Enter and verify individual certificate fields against the blockchain record.
          </p>
          <div className="space-y-6">
            {availableFields.map((field) => (
              <div key={field} className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  {formatFieldName(field)}
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={fieldVerifications[field].value}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    className="input-modern flex-1"
                    placeholder={`Enter ${formatFieldName(field).toLowerCase()}`}
                  />
                  <button
                    onClick={() => verifyField(field)}
                    disabled={!fieldVerifications[field].value || fieldVerifications[field].isVerifying}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl 
                             hover:shadow-lg hover:scale-105 transform transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {fieldVerifications[field].isVerifying ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
                {fieldVerifications[field].isValid !== null && (
                  <div className={`flex items-center text-sm ${
                    fieldVerifications[field].isValid ? 'text-accent' : 'text-red-400'
                  }`}>
                    <span className="mr-2">
                      {fieldVerifications[field].isValid ? '✓' : '✗'}
                    </span>
                    <span>
                      {fieldVerifications[field].isValid 
                        ? `${formatFieldName(field)} verified successfully`
                        : `${formatFieldName(field)} verification failed`
                      }
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}