import { User, Wallet } from '@prisma/client';
import { NextApiRequest } from 'next';

// Auth types
export interface AuthenticatedRequest extends NextApiRequest {
  user?: User & { wallets?: Wallet[] };
  wallet?: Wallet;
}

export interface JwtPayload {
  userId: string;
  walletId?: string;
  iat: number;
  exp: number;
}

// Wallet types
export interface WalletConnectRequest {
  address: string;
  chain: string;
  signature: string;
  message: string;
  publicKey?: string;
}

// TMA types
export interface TMASignRequest {
  version: string;
  signature: string;
  messageHash: string;
  walletAddress: string;
}

// NFT types
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  is_og?: boolean;
  source?: 'conversion' | 'public';
  mint_timestamp?: number;
}

// Claim types
export interface ClaimRequest {
  type: 'conversion' | 'public';
  walletAddress: string;
  merkleProof?: string[];
  riseTokenIds?: string[];
}

// Sellback types
export interface SellbackQuoteRequest {
  tokenId: string;
  priceUsd: number;
}

export interface SellbackQuoteResponse {
  tokenId: string;
  priceUsd: number;
  coreumAmount: string;
  oraclePrice: string;
  unlockDate: string;
  estimatedUnlockTime: number;
}

export interface SellbackInitiateRequest {
  tokenId: string;
  priceUsd: number;
  acceptTerms: boolean;
}

// Oracle types
export interface PriceOracleData {
  symbol: string;
  price: string;
  timestamp: number;
  sources: string[];
  signature?: string;
}

// Rewards types
export interface EpochData {
  number: number;
  startTs: Date;
  endTs: Date;
  poolAmount: string;
  totalNFTs: number;
  perNftAmount: string;
}

export interface RewardClaimData {
  epochNumber: number;
  walletAddress: string;
  nftCount: number;
  claimableAmount: string;
  claimed: boolean;
}

// Airdrop types
export interface AirdropScheduleData {
  name: string;
  type: 'token' | 'nft' | 'coreum';
  merkleRoot: string;
  startTs: Date;
  endTs: Date;
  metadata?: any;
}

export interface AirdropClaimData {
  scheduleId: string;
  walletAddress: string;
  amount?: string;
  tokenId?: string;
  merkleProof: string[];
}

// Blockchain types
export interface BlockchainEventData {
  chain: string;
  blockHeight: string;
  txHash: string;
  eventType: string;
  contractAddress: string;
  eventData: any;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Floor price types
export interface FloorPriceData {
  frontendSalePrice: number;
  backendBookValue: number;
  floorModel: string;
  netBurned: number;
  currentSupply: number;
  maxSupply: number;
  incrementPerBurn: number;
}

