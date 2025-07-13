import CryptoJS from 'crypto-js'
import { MerkleTree } from 'merkletreejs'

export async function hashPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = event => {
      if (event.target?.result) {
        const wordArray = CryptoJS.lib.WordArray.create(event.target.result as ArrayBuffer)
        const hash = CryptoJS.SHA256(wordArray).toString()
        resolve(hash) // Return without 0x prefix to match metadata format
      }
    }

    reader.onerror = error => {
      reject(error)
    }

    reader.readAsArrayBuffer(file)
  })
}

export function createMerkleTree(leaves: string[]): MerkleTree {
  const hashedLeaves = leaves.map(leaf => CryptoJS.SHA256(leaf).toString())
  return new MerkleTree(hashedLeaves, CryptoJS.SHA256, { hashLeaves: false })
}

export interface ProofItem {
  hash: string
  position: 'left' | 'right'
}

function hashLeaf(data: string, salt?: string): string {
  // Add salt if provided
  let leafData = data
  if (salt) {
    leafData = `${salt}:${data}`
  }

  // Double SHA256 to match Python implementation
  const firstHash = CryptoJS.SHA256(leafData)
  return CryptoJS.SHA256(firstHash).toString()
}

function hashPair(left: string, right: string): string {
  // Sort to ensure consistent ordering (matching Python)
  let sortedLeft = left
  let sortedRight = right

  if (left > right) {
    sortedLeft = right
    sortedRight = left
  }

  // Concatenate as strings and hash
  const combined = sortedLeft + sortedRight
  return CryptoJS.SHA256(combined).toString()
}

export function verifyMerkleProof(
  leaf: string,
  proof: ProofItem[],
  rootHash: string,
  salt?: string
): boolean {
  // Calculate leaf hash using double SHA256 with optional salt
  let currentHash = hashLeaf(leaf, salt)

  console.log('Merkle verification steps:', {
    leaf,
    securityCode: salt,
    leafHash: currentHash,
    proof,
  })

  // Apply proof
  for (let i = 0; i < proof.length; i++) {
    const proofElement = proof[i]
    const siblingHash = proofElement.hash
    const position = proofElement.position

    if (position === 'right') {
      currentHash = hashPair(currentHash, siblingHash)
    } else {
      currentHash = hashPair(siblingHash, currentHash)
    }

    console.log(`Step ${i + 1}:`, {
      siblingHash,
      position,
      resultHash: currentHash,
    })
  }

  console.log('Final comparison:', {
    calculated: currentHash,
    expected: rootHash,
    match: currentHash === rootHash,
  })

  // Compare with root hash
  return currentHash === rootHash
}
