// Issuer Registry for Certificate Verification
// This module manages the list of authorized certificate issuers

export type IssuerType = 'university' | 'institution' | 'company' | 'foundation' | 'individual'
export type VerificationLevel = 'gold' | 'silver' | 'bronze' | 'unverified'

export interface IssuerInfo {
  address: string
  name: string
  type: IssuerType
  verificationLevel: VerificationLevel
  website?: string
  logo?: string
  validFrom: string
  validUntil?: string
  description?: string
  // Additional metadata
  country?: string
  accreditation?: string[]
}

export interface IssuerVerificationResult {
  isVerified: boolean
  issuerInfo?: IssuerInfo
  verificationLevel: VerificationLevel
  message: string
}

// Hardcoded registry for now - can be moved to IPFS/API later
const ISSUER_REGISTRY: IssuerInfo[] = [
  // Gold tier - Fully verified educational institutions
  {
    address: 'klv1graf3wqa8eefzmp3g95wrnmayzacsje2a6c6y7z6zmu9m8z8gz5qlrctat',
    name: 'Klever Academy - Testing Issuer',
    type: 'foundation',
    verificationLevel: 'gold',
    website: 'https://klever.org',
    validFrom: '2025-01-01',
    description: 'Official TEST Klever Foundation Academy',
    country: 'Global',
    accreditation: ['Education Authority'],
  },
  {
    address: 'klv1a9wfngw5chea5myr6wmdf9hs50v5hpzmk5fzg4h6pjvk4l9gg5yszuecfs',
    name: 'Klever Academy',
    type: 'foundation',
    verificationLevel: 'gold',
    website: 'https://klever.org',
    validFrom: '2025-01-01',
    description: 'Official Klever Foundation Academy',
    country: 'Global',
    accreditation: ['Education Authority'],
  },
]

// Registry management functions
export class IssuerRegistry {
  private static registry: Map<string, IssuerInfo> = new Map()
  private static initialized = false

  static initialize() {
    if (this.initialized) return

    // Load registry from hardcoded list
    ISSUER_REGISTRY.forEach(issuer => {
      this.registry.set(issuer.address.toLowerCase(), issuer)
    })

    this.initialized = true
  }

  static getIssuer(address: string): IssuerInfo | undefined {
    this.initialize()
    return this.registry.get(address.toLowerCase())
  }

  static verifyIssuer(address: string): IssuerVerificationResult {
    this.initialize()
    const issuer = this.getIssuer(address)

    if (!issuer) {
      return {
        isVerified: false,
        verificationLevel: 'unverified',
        message: 'Unknown issuer - Certificate issued by unverified entity',
      }
    }

    // Check if issuer is still valid
    const now = new Date()
    const validFrom = new Date(issuer.validFrom)
    const validUntil = issuer.validUntil ? new Date(issuer.validUntil) : null

    if (now < validFrom) {
      return {
        isVerified: false,
        issuerInfo: issuer,
        verificationLevel: 'unverified',
        message: 'Issuer verification not yet valid',
      }
    }

    if (validUntil && now > validUntil) {
      return {
        isVerified: false,
        issuerInfo: issuer,
        verificationLevel: 'unverified',
        message: 'Issuer verification has expired',
      }
    }

    // Return verification based on level
    const levelMessages = {
      gold: 'Verified Educational Institution',
      silver: 'Verified Organization',
      bronze: 'Registered Issuer (Pending Full Verification)',
      unverified: 'Unverified Issuer',
    }

    return {
      isVerified: issuer.verificationLevel !== 'unverified',
      issuerInfo: issuer,
      verificationLevel: issuer.verificationLevel,
      message: levelMessages[issuer.verificationLevel],
    }
  }

  static getAllIssuers(): IssuerInfo[] {
    this.initialize()
    return Array.from(this.registry.values())
  }

  static getIssuersByLevel(level: VerificationLevel): IssuerInfo[] {
    this.initialize()
    return Array.from(this.registry.values()).filter(issuer => issuer.verificationLevel === level)
  }
}

// Helper function for UI display
export function getVerificationIcon(level: VerificationLevel): string {
  const icons = {
    gold: '🏆',
    silver: '🥈',
    bronze: '🥉',
    unverified: '❓',
  }
  return icons[level]
}

export function getVerificationColor(level: VerificationLevel): string {
  const colors = {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    unverified: '#808080',
  }
  return colors[level]
}
