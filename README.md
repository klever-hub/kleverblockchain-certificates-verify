# Klever Blockchain Certificate Verification

A web application for verifying certificates issued on the Klever Blockchain using NFTs.

## Features

- NFT-based certificate verification
- PDF hash validation against blockchain records
- Merkle tree validation for certificate fields
- Zero-knowledge proof support for privacy-preserving verification

## How it works

1. Each certificate is minted as an NFT on the Klever Blockchain
2. The NFT metadata contains:
   - Hash of the certificate PDF
   - Root hash for Merkle tree validation
   - Merkle proofs for individual fields
   - Certificate image URL

3. Users can verify certificates by:
   - Entering the NFT ID (format: `TICKER/NONCE`)
   - Uploading the certificate PDF
   - Optionally entering certificate details for field-level verification

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_KLEVER_API_URL=https://api.testnet.klever.org
```

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- CryptoJS for hashing
- MerkleTreeJS for Merkle proof validation
