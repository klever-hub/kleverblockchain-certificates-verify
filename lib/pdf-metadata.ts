// Dynamic import to avoid SSR issues
// Use loose typing for pdfjs-dist due to complex type requirements
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null

// Initialize PDF.js only on client side
async function initPdfJs() {
  if (!pdfjsLib && typeof window !== 'undefined') {
    pdfjsLib = await import('pdfjs-dist')
    // Use local worker to avoid CORS issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker/pdf.worker.min.js'
  }
  return pdfjsLib
}

export interface PDFMetadata {
  name?: string
  course?: string
  course_load?: string
  location?: string
  date?: string
  instructor?: string
  instructor_title?: string
  issuer?: string
  salt?: string
  [key: string]: string | undefined
}

export async function extractPDFMetadata(file: File): Promise<PDFMetadata> {
  try {
    // Initialize PDF.js if not already done
    const pdfjs = await initPdfJs()
    if (!pdfjs) {
      console.warn('PDF.js not available (server-side rendering)')
      return {}
    }
    
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    
    const metadata = await pdf.getMetadata()
    
    // Extract custom metadata
    const customMetadata: PDFMetadata = {}
    
    if (metadata.info && typeof metadata.info === 'object') {
      // Check for custom fields in the info object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const info = metadata.info as any
      
      // Map PDF metadata keys to our field names
      // We only need mapping when PDF uses different key names than our standard fields
      const fieldMapping: { [key: string]: string } = {
        'course_name': 'course',
        'instructor_name': 'instructor',
        'issue_date': 'date',
        'certificate_date': 'date',
        'verification_salt': 'salt',
        'hash_salt': 'salt'
      }
      
      // Extract fields from info object - check all properties
      for (const key in info) {
        const value = info[key]
        if (value && typeof value === 'string') {
          // Special handling for Title field to extract name
          if (key === 'Title' && value.includes(' - ')) {
            const parts = value.split(' - ')
            if (parts.length === 2 && parts[0].includes('CERTIFICADO')) {
              customMetadata.name = parts[1].trim()
            }
          }
          
          // Special handling for Subject field as course
          if (key === 'Subject') {
            customMetadata.course = value
          }
          
          // Special handling for Keywords field - might contain salt
          if (key === 'Keywords' && value.includes('salt:')) {
            const saltMatch = value.match(/salt:\s*([a-fA-F0-9]+)/)
            if (saltMatch) {
              customMetadata.salt = saltMatch[1]
            }
          }
          
          // Check if this key matches our field mapping
          const normalizedKey = key.toLowerCase().replace(/[- ]/g, '_')
          
          // Check if it's a mapped field
          if (fieldMapping[normalizedKey]) {
            customMetadata[fieldMapping[normalizedKey]] = value
          } else if (fieldMapping[key]) {
            customMetadata[fieldMapping[key]] = value
          } 
          // Check if it's a standard field name that we want to extract
          else if (['name', 'course', 'instructor', 'instructor_title', 'date', 'location', 'salt', 'issuer', 'course_load'].includes(normalizedKey)) {
            customMetadata[normalizedKey] = value
          }
          // Store other metadata that might be relevant
          else if (['name', 'course', 'instructor', 'date', 'salt'].some(field => normalizedKey.includes(field))) {
            customMetadata[normalizedKey] = value
          }
          
          // Also check if the key itself is exactly 'salt' (case-insensitive)
          if (key.toLowerCase() === 'salt') {
            customMetadata.salt = value
          }
        }
      }
      
      // Check for custom properties
      if (info.Custom) {
        const custom = info.Custom
        
        // Parse CertificateData if present
        if (custom.CertificateData) {
          const certData = String(custom.CertificateData)
          // Parse pipe-delimited format: "key|value||key|value||..."
          const pairs = certData.split('||')
          for (const pair of pairs) {
            const [key, value] = pair.split('|')
            if (key && value) {
              const normalizedKey = key.trim().toLowerCase().replace(/[- ]/g, '_')
              customMetadata[normalizedKey] = value.trim()
            }
          }
        }
        
        // Also process other custom fields
        for (const [key, value] of Object.entries(custom)) {
          if (key !== 'CertificateData' && value) {
            const normalizedKey = key.toLowerCase().replace(/[- ]/g, '_')
            if (!customMetadata[normalizedKey]) {
              customMetadata[normalizedKey] = String(value)
            }
            
            // Special check for salt field
            if (key.toLowerCase() === 'salt' || normalizedKey === 'salt') {
              customMetadata.salt = String(value)
            }
          }
        }
      }
    }
    
    // Check metadata object for additional fields
    if (metadata.metadata) {
      try {
        // The metadata might be in different formats depending on the PDF
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metadataObj = metadata.metadata as any
        
        // Try to access metadata in various ways
        if (metadataObj._metadata && typeof metadataObj._metadata.entries === 'function') {
          for (const [key, value] of metadataObj._metadata.entries()) {
            const normalizedKey = key.toLowerCase().replace(/[- ]/g, '_').replace(/^pdf:/, '')
            if (!customMetadata[normalizedKey] && value) {
              customMetadata[normalizedKey] = String(value)
            }
            // Special check for salt
            if ((key.toLowerCase() === 'salt' || normalizedKey === 'salt') && value) {
              customMetadata.salt = String(value)
            }
          }
        } else if (metadataObj.getAll) {
          // Try the getAll method if available
          const allMetadata = metadataObj.getAll()
          if (allMetadata) {
            for (const key in allMetadata) {
              const normalizedKey = key.toLowerCase().replace(/[- ]/g, '_').replace(/^pdf:/, '')
              if (!customMetadata[normalizedKey] && allMetadata[key]) {
                customMetadata[normalizedKey] = String(allMetadata[key])
              }
              // Special check for salt
              if ((key.toLowerCase() === 'salt' || normalizedKey === 'salt') && allMetadata[key]) {
                customMetadata.salt = String(allMetadata[key])
              }
            }
          }
        }
      } catch (e) {
        console.log('Could not extract additional metadata:', e)
      }
    }
    
    // Debug logging
    console.log('PDF Metadata Extraction Debug:', {
      infoKeys: metadata.info ? Object.keys(metadata.info) : [],
      customKeys: metadata.info && (metadata.info as any).Custom ? Object.keys((metadata.info as any).Custom) : [],
      extractedMetadata: customMetadata,
      hasSalt: !!customMetadata.salt
    })
    
    return customMetadata
  } catch (error) {
    console.error('Error extracting PDF metadata:', error)
    return {}
  }
}