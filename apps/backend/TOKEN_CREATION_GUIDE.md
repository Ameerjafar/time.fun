# Token Creation Guide

## Overview
This guide explains how the token creation system works in Time.fun, including blockchain integration with Solana devnet.

## Architecture

### 1. Backend Services
- **`services/solanaService.ts`** - Handles all Solana blockchain interactions
- **`controller/tokenController.ts`** - API endpoints for token management
- **`routes/tokenRoute.ts`** - Route definitions

### 2. Token Creation Flow

```
User fills form → Frontend calls API → Backend creates token on Solana → 
Derives pool address → Stores in database → Returns token info
```

## Current Implementation Status

### ✅ Working
1. **Token Creation on Solana Devnet**
   - Creates SPL token with custom name, symbol, and supply
   - Mints initial supply to creator
   - Returns mint address and transaction signature

2. **Pool Address Derivation**
   - Derives deterministic pool PDA (Program Derived Address)
   - Calculates initial token price
   - Stores pool address in database

3. **Database Storage**
   - Stores token metadata
   - Links token to creator
   - Updates user role to CREATOR

4. **API Endpoints**
   - `POST /token/create` - Create new token
   - `GET /token/:id` - Get token by ID
   - `GET /token/user/:userId` - Get token by user ID
   - `GET /token` - Get all tokens
   - `PUT /token/:id/price` - Refresh token price

### ⚠️ Pending (Requires Frontend Wallet Integration)
1. **Actual Pool Initialization**
   - Currently only derives the pool address
   - Actual on-chain pool initialization needs to be done via frontend wallet
   - User's wallet must sign the transaction

2. **Buy/Sell Functionality**
   - Requires wallet integration
   - Needs to call bonding curve contract methods

## How to Test

### 1. Test Token Creation (Backend Only)
```bash
cd apps/backend
bun run test-token-creation.ts
```

This will:
- Create a test token on Solana devnet
- Derive the pool address
- Display mint address and pool address
- Show Solana Explorer link

### 2. Test via API
```bash
# Start backend
cd apps/backend
bun run dev

# In another terminal, make API call
curl -X POST http://localhost:5000/token/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Token",
    "symbol": "MTK",
    "description": "My awesome token",
    "imageUrl": "https://example.com/image.png",
    "totalSupply": 1000000,
    "decimals": 9,
    "userId": "your-user-id",
    "initialSol": 1,
    "pricingModel": "market",
    "features": {
      "chat": true,
      "groupChat": true,
      "videoCall": false
    }
  }'
```

### 3. Test via Frontend
1. Start backend: `cd apps/backend && bun run dev`
2. Start frontend: `cd apps/web && npm run dev`
3. Login and go to profile page
4. Click "Create Token" button
5. Fill in the form and submit

## Environment Variables

Add to `apps/backend/.env`:
```env
PROGRAM_ID=EJGrTzirrsJ2ukMdomaXrR31GcHpFckqqir6dqyZEx5S
```

## Database Schema

```prisma
model Token {
  id           String   @id @default(uuid())
  name         String
  symbol       String
  totalSupply  Int
  description  String?
  imageUrl     String
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  mintAddress  String?  @unique
  poolAddress  String?  @unique
  currentPrice Decimal? @default(0)
  initialPrice Decimal? @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## Next Steps

### To Enable Full Bonding Curve Functionality:

1. **Frontend Wallet Integration**
   ```typescript
   // In frontend, after token is created
   const initializePool = async (mintAddress: string) => {
     const program = new Program(IDL, PROGRAM_ID, provider);
     
     await program.methods
       .initialize(initialSol, initialTokens)
       .accounts({
         // ... accounts
       })
       .rpc();
   };
   ```

2. **Buy Tokens**
   ```typescript
   const buyTokens = async (amount: number) => {
     await program.methods
       .buy(amount)
       .accounts({
         // ... accounts
       })
       .rpc();
   };
   ```

3. **Sell Tokens**
   ```typescript
   const sellTokens = async (amount: number) => {
     await program.methods
       .sell(amount)
       .accounts({
         // ... accounts
       })
       .rpc();
   };
   ```

## Troubleshooting

### Error: "Failed to create token on Solana"
- Check Solana devnet is accessible
- Verify you have SOL for transaction fees (airdrop in code)
- Check network connection

### Error: "Failed to derive pool address"
- Verify PROGRAM_ID is correct
- Check token mint address is valid

### Error: "User already has a token"
- Each user can only create one token
- Use a different user account

## Contract Reference

Your bonding curve contract (`EJGrTzirrsJ2ukMdomaXrR31GcHpFckqqir6dqyZEx5S`) has these methods:

1. **`initialize(initial_sol, initial_token)`**
   - Creates a new liquidity pool
   - Sets initial reserves
   - Calculates constant K for bonding curve

2. **`buy(amount_out_token)`**
   - Buy tokens from the pool
   - Pays SOL, receives tokens
   - Price increases based on bonding curve

3. **`sell(amount_in_token)`**
   - Sell tokens to the pool
   - Pays tokens, receives SOL
   - Price decreases based on bonding curve

## Support

For issues or questions:
1. Check backend logs: `apps/backend` console
2. Check Solana Explorer: https://explorer.solana.com/?cluster=devnet
3. Verify database entries in Prisma Studio: `npx prisma studio`
