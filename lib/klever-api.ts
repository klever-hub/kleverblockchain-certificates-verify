const KLEVER_API_BASE_URL = process.env.NEXT_PUBLIC_KLEVER_API_URL || 'https://api.testnet.klever.org'

export interface MerkleProofItem {
  hash: string
  position: 'left' | 'right'
}

export interface NFTMetadata {
  hash: string
  rootHash: string
  nft_id?: string
  verify_url?: string
  proofs?: {
    [key: string]: MerkleProofItem[]
  }
  [key: string]: any
}

export interface NFTResponse {
  data: {
    asset: {
      metadata: string  // JSON string containing the NFT metadata
      [key: string]: any
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
      { hash: 'eddc99db39f5ab2b6fad7b2d2c1386bf60ea3a0f05f50f0471afb168aef1b0c1', position: 'right' },
      { hash: 'b1c4a13d414e09adbaab5116939fae07ea3b89c71e21e09b9db63cb56368095c', position: 'right' },
      { hash: '9ed6cacf54e27d03e2266bf162526c225a0d7f19dcd2cd14372c20ae9057032e', position: 'right' }
    ],
    courseProof: [
      { hash: 'd9f14d2e371465bac156e1f43827fd1a5e11d6c4e0aaf5895b274c02b9ffccdd', position: 'left' },
      { hash: 'b1c4a13d414e09adbaab5116939fae07ea3b89c71e21e09b9db63cb56368095c', position: 'right' },
      { hash: '9ed6cacf54e27d03e2266bf162526c225a0d7f19dcd2cd14372c20ae9057032e', position: 'right' }
    ],
    locationProof: [
      { hash: 'b07e2ba8c6a953a9571d9fb852c54ba932aeea6eb93868f1433a3a6f003318e2', position: 'right' },
      { hash: 'ee0fef68255400d357fc3002e48766245d5a1682b25f79f97e246ee68672879f', position: 'left' },
      { hash: '9ed6cacf54e27d03e2266bf162526c225a0d7f19dcd2cd14372c20ae9057032e', position: 'right' }
    ],
    dateProof: [
      { hash: '3da2e6f79ce0ad72d3b5efa661656937f6e27ea7c652022c749d8413cef4b2ad', position: 'left' },
      { hash: 'ee0fef68255400d357fc3002e48766245d5a1682b25f79f97e246ee68672879f', position: 'left' },
      { hash: '9ed6cacf54e27d03e2266bf162526c225a0d7f19dcd2cd14372c20ae9057032e', position: 'right' }
    ],
    instructorProof: [
      { hash: 'a3234d7d6f7a057fc8f034d9f8e467a98bfe189efbf8849366d04d3b652a116d', position: 'right' },
      { hash: '0e7bcd2f1457fd966e29cc339aee9e39aaeae9a693f1a72d06f4d05b8c54aa7f', position: 'right' },
      { hash: 'd32ceb08b232d8595bd47aa3b5f02fda7e1e4c87b04c3cb25720a57282df1fa7', position: 'left' }
    ]
  }
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
    
    return metadata
  } catch (error) {
    console.error('Failed to fetch NFT metadata:', error)
    throw error
  }
}

// Function to get mock data for testing
export function getMockMetadata(): NFTMetadata {
  return mockMetadata
}