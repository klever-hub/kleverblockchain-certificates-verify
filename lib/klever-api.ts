const KLEVER_API_BASE_URL =
  process.env.NEXT_PUBLIC_KLEVER_API_URL || 'https://api.testnet.klever.org'

export interface MerkleProofItem {
  hash: string
  position: 'left' | 'right'
}

import { IssuerRegistry, IssuerVerificationResult } from './issuer-registry'

export interface NFTMetadata {
  hash: string
  rootHash: string
  nft_id?: string
  verify_url?: string
  proofs?: {
    [key: string]: MerkleProofItem[]
  }
  issuerAddress?: string
  issuerVerification?: IssuerVerificationResult
  holderAddress?: string
  [key: string]:
    | string
    | MerkleProofItem[]
    | { [key: string]: MerkleProofItem[] }
    | IssuerVerificationResult
    | undefined
}

export interface NFTResponse {
  data: {
    asset: {
      metadata: string // JSON string containing the NFT metadata
      issuer?: string // NFT issuer/creator address
      creator?: string // NFT creator address
      ownerAddress?: string // Current owner address
      [key: string]: string | number | boolean | null | undefined
    }
  }
  error: string
  code: string
}

export interface NFTHolderResponse {
  data: {
    account: {
      address: string
      assetId: string
      collection: string
      nftNonce: number
      assetName: string
      assetType: number
      balance: number
      metadata: string
      [key: string]: string | number | boolean | null | undefined | Record<string, unknown>
    }
  }
  error: string
  code: string
}

// Mock data for development
const mockMetadata: NFTMetadata = {
  hash: 'afc23a8d4e155a2f2ce77131169b9b0ff36059a505aabff245ab1557d6d6ac00',
  rootHash: '5acee99dc59452459ade8f64ffcededf81708fe597c7045ec98008edf551c4d0',
  nft_id: 'KCERT-TEST/1',
  verify_url: 'https://verify.kleverhub.io/KCERT-TEST/1',
  proofs: {
    nameProof: [
      {
        hash: 'eddc99db39f5ab2b6fad7b2d2c1386bf60ea3a0f05f50f0471afb168aef1b0c1',
        position: 'right',
      },
      {
        hash: 'b1c4a13d414e09adbaab5116939fae07ea3b89c71e21e09b9db63cb56368095c',
        position: 'right',
      },
      {
        hash: '9ed6cacf54e27d03e2266bf162526c225a0d7f19dcd2cd14372c20ae9057032e',
        position: 'right',
      },
    ],
    courseProof: [
      {
        hash: 'd9f14d2e371465bac156e1f43827fd1a5e11d6c4e0aaf5895b274c02b9ffccdd',
        position: 'left',
      },
      {
        hash: 'b1c4a13d414e09adbaab5116939fae07ea3b89c71e21e09b9db63cb56368095c',
        position: 'right',
      },
      {
        hash: '9ed6cacf54e27d03e2266bf162526c225a0d7f19dcd2cd14372c20ae9057032e',
        position: 'right',
      },
    ],
    locationProof: [
      {
        hash: 'b07e2ba8c6a953a9571d9fb852c54ba932aeea6eb93868f1433a3a6f003318e2',
        position: 'right',
      },
      {
        hash: 'ee0fef68255400d357fc3002e48766245d5a1682b25f79f97e246ee68672879f',
        position: 'left',
      },
      {
        hash: '9ed6cacf54e27d03e2266bf162526c225a0d7f19dcd2cd14372c20ae9057032e',
        position: 'right',
      },
    ],
    dateProof: [
      {
        hash: '3da2e6f79ce0ad72d3b5efa661656937f6e27ea7c652022c749d8413cef4b2ad',
        position: 'left',
      },
      {
        hash: 'ee0fef68255400d357fc3002e48766245d5a1682b25f79f97e246ee68672879f',
        position: 'left',
      },
      {
        hash: '9ed6cacf54e27d03e2266bf162526c225a0d7f19dcd2cd14372c20ae9057032e',
        position: 'right',
      },
    ],
    instructorProof: [
      {
        hash: 'a3234d7d6f7a057fc8f034d9f8e467a98bfe189efbf8849366d04d3b652a116d',
        position: 'right',
      },
      {
        hash: '0e7bcd2f1457fd966e29cc339aee9e39aaeae9a693f1a72d06f4d05b8c54aa7f',
        position: 'right',
      },
      {
        hash: 'd32ceb08b232d8595bd47aa3b5f02fda7e1e4c87b04c3cb25720a57282df1fa7',
        position: 'left',
      },
    ],
  },
}

export async function fetchNFTMetadata(ticker: string, nonce: string): Promise<NFTMetadata> {
  try {
    const response = await fetch(`${KLEVER_API_BASE_URL}/v1.0/assets/${ticker}/${nonce}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch NFT metadata: ${response.status} ${response.statusText}`)
    }

    const data: NFTResponse = await response.json()

    if (data.code !== 'successful' || !data.data?.asset?.metadata) {
      throw new Error(data.error || 'Invalid NFT metadata response')
    }

    // Parse the metadata JSON string
    const metadata = JSON.parse(data.data.asset.metadata) as NFTMetadata

    // Extract issuer address from the response
    // The issuer field might be named differently in the actual API
    const issuerAddress =
      data.data.asset.issuer || data.data.asset.creator || data.data.asset.ownerAddress

    // Add issuer information to metadata
    metadata.issuerAddress = issuerAddress

    // Verify issuer if address is available
    if (issuerAddress) {
      metadata.issuerVerification = IssuerRegistry.verifyIssuer(issuerAddress)
    } else {
      // No issuer address available
      metadata.issuerVerification = {
        isVerified: false,
        verificationLevel: 'unverified',
        message: 'Issuer address not available in NFT data',
      }
    }

    // Fetch holder information
    const holderAddress = await fetchNFTHolder(ticker, nonce)
    if (holderAddress) {
      metadata.holderAddress = holderAddress
    }

    return metadata
  } catch (error) {
    console.error('Failed to fetch NFT metadata:', error)
    throw error
  }
}

// Function to fetch NFT holder information
export async function fetchNFTHolder(ticker: string, nonce: string): Promise<string | null> {
  try {
    const response = await fetch(`${KLEVER_API_BASE_URL}/assets/nft/holder/${ticker}/${nonce}`)
    
    if (!response.ok) {
      console.error(`Failed to fetch NFT holder: ${response.status} ${response.statusText}`)
      return null
    }
    
    const data: NFTHolderResponse = await response.json()
    
    if (data.code !== 'successful' || !data.data?.account?.address) {
      console.error('Invalid NFT holder response:', data.error)
      return null
    }
    
    return data.data.account.address
  } catch (error) {
    console.error('Failed to fetch NFT holder:', error)
    return null
  }
}

// Function to get mock data for testing
export function getMockMetadata(): NFTMetadata {
  const mockWithIssuer = {
    ...mockMetadata,
    issuerAddress: 'klv1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpgm89z',
  }
  mockWithIssuer.issuerVerification = IssuerRegistry.verifyIssuer(mockWithIssuer.issuerAddress)
  return mockWithIssuer
}

// Helper method to get verification status summary
export function getVerificationSummary(metadata: NFTMetadata): {
  status: 'verified' | 'warning' | 'unverified'
  title: string
  description: string
  icon: string
} {
  if (!metadata.issuerVerification) {
    return {
      status: 'unverified',
      title: 'Issuer Unknown',
      description: 'Unable to verify certificate issuer',
      icon: '❓',
    }
  }

  const { verificationLevel, issuerInfo, message } = metadata.issuerVerification

  switch (verificationLevel) {
    case 'gold':
      return {
        status: 'verified',
        title: `Issued by ${issuerInfo?.name || 'Verified Institution'}`,
        description: message,
        icon: '🏆',
      }
    case 'silver':
      return {
        status: 'verified',
        title: `Issued by ${issuerInfo?.name || 'Verified Organization'}`,
        description: message,
        icon: '🥈',
      }
    case 'bronze':
      return {
        status: 'warning',
        title: `Issued by ${issuerInfo?.name || 'Registered Issuer'}`,
        description: `${message} - Verification pending`,
        icon: '🥉',
      }
    default:
      return {
        status: 'unverified',
        title: 'Unverified Issuer',
        description: 'Certificate issued by unknown entity',
        icon: '⚠️',
      }
  }
}

// Check if certificate should be trusted
export function isTrustedCertificate(metadata: NFTMetadata): boolean {
  if (!metadata.issuerVerification) return false

  const { verificationLevel } = metadata.issuerVerification
  return verificationLevel === 'gold' || verificationLevel === 'silver'
}
