# Token Buy/Sell Functionality

This document describes the implementation of token buying and selling functionality with pool initiation and creator fund transfers using your custom bonding curve program.

## Overview

The system implements a complete token trading flow where:
1. Users can buy/sell creator tokens through your custom bonding curve program
2. Pool is automatically initiated on first trade using your program's `initialize` instruction
3. Creator receives a percentage of trading fees
4. All transactions are processed on Solana devnet using your program ID: `EJGrTzirrsJ2ukMdomaXrR31GcHpFckqqir6dqyZEx5S`

## Architecture

### Backend Components

#### 1. Solana Service (`apps/backend/services/solana/solanaService.ts`)
- `createBuyTokenTransaction()` - Creates buy transaction for user wallet signing using your program
- `createSellTokenTransaction()` - Creates sell transaction for user wallet signing using your program
- `createPoolInitTransaction()` - Creates pool initialization transaction using your program's initialize instruction
- `transferSolToCreator()` - Transfers SOL to creator after successful trades

#### 2. Backend Wallet Service (`apps/backend/services/solana/backendWallet.ts`)
- Manages backend wallet for creator payments
- Handles SOL transfers to creators
- Provides wallet balance checking

#### 3. Token Controller (`apps/backend/controller/tokenController.ts`)
- `prepareBuyTokenTransaction()` - API endpoint for buy transaction preparation
- `prepareSellTokenTransaction()` - API endpoint for sell transaction preparation
- `submitBuySellTransaction()` - API endpoint for transaction submission

#### 4. Routes (`apps/backend/routes/tokenRoute.ts`)
- `POST /token/buy/prepare` - Prepare buy transaction
- `POST /token/sell/prepare` - Prepare sell transaction
- `POST /token/trade/submit` - Submit signed transaction

### Frontend Components

#### 1. Trading Modal (`apps/web/app/components/TradingModal.tsx`)
- Interactive UI for buying/selling tokens
- Real-time price calculations
- Wallet integration
- Transaction status feedback

#### 2. Creator Page (`apps/web/app/creator/[userId]/page.tsx`)
- Updated with trading functionality
- Wallet connection
- Trading modal integration

## API Endpoints

### Prepare Buy Transaction
```http
POST /token/buy/prepare
Content-Type: application/json

{
  "tokenMint": "string",
  "amountOutToken": number,
  "userPublicKey": "string",
  "creatorPublicKey": "string"
}
```

### Prepare Sell Transaction
```http
POST /token/sell/prepare
Content-Type: application/json

{
  "tokenMint": "string",
  "amountInToken": number,
  "userPublicKey": "string",
  "creatorPublicKey": "string"
}
```

### Submit Transaction
```http
POST /token/trade/submit
Content-Type: application/json

{
  "signedTransaction": "string",
  "tokenMint": "string",
  "creatorPublicKey": "string",
  "transactionType": "buy" | "sell",
  "amount": number
}
```

## Trading Flow

### Buy Flow
1. User clicks "Trade Tokens" button
2. Trading modal opens with buy tab selected
3. User enters amount of tokens to buy
4. System calculates estimated SOL cost
5. User confirms transaction
6. Backend prepares buy transaction
7. User signs transaction with wallet
8. Transaction is submitted to Solana
9. Creator receives 5% of transaction value
10. Token price is updated

### Sell Flow
1. User clicks "Trade Tokens" button
2. Trading modal opens with sell tab selected
3. User enters amount of tokens to sell
4. System calculates estimated SOL return
5. User confirms transaction
6. Backend prepares sell transaction
7. User signs transaction with wallet
8. Transaction is submitted to Solana
9. Creator receives 5% of transaction value
10. Token price is updated

## Bonding Curve Implementation

The system uses your custom bonding curve program with:
- Program ID: `EJGrTzirrsJ2ukMdomaXrR31GcHpFckqqir6dqyZEx5S`
- Constant product market maker (CPMM): `k = reserve_x * reserve_y`
- Pool state structure: `reserve_x` (SOL), `reserve_y` (tokens), `token_x_mint`, `token_y_mint`, `constant_k`
- PDA seeds: `["pool", token_x_mint, token_y_mint]`
- Instructions: `initialize`, `buy`, `sell`
- Price increases as tokens are bought, decreases as tokens are sold
- Creator receives trading fees

## Creator Fund Transfer

- 5% of each transaction value is transferred to the creator
- Transfers are handled by backend wallet
- Backend wallet must be funded with SOL
- Transfer failures don't affect the main transaction

## Environment Setup

### Backend Wallet
Set the backend wallet private key in environment variables:
```bash
BACKEND_WALLET_PRIVATE_KEY=your_base58_private_key_here
```

### Solana Configuration
```bash
PROGRAM_ID=EJGrTzirrsJ2ukMdomaXrR31GcHpFckqqir6dqyZEx5S
RPC_URL=https://api.devnet.solana.com
```

## Testing

Run the test script to verify functionality:
```bash
cd apps/backend
bun run test-buy-sell.ts
```

## Security Considerations

1. **Wallet Security**: Backend wallet private key must be securely stored
2. **Transaction Validation**: All transactions are validated before submission
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Error Handling**: Comprehensive error handling prevents fund loss

## Future Enhancements

1. **Real Wallet Integration**: Integrate with Phantom, Solflare wallets
2. **Advanced Pricing**: Implement more sophisticated pricing models
3. **Liquidity Management**: Add liquidity provision incentives
4. **Analytics**: Add trading analytics and reporting
5. **Multi-token Support**: Support for multiple token types

## Troubleshooting

### Common Issues

1. **Insufficient Backend Wallet Balance**
   - Fund the backend wallet with devnet SOL
   - Check balance with `getBackendWalletBalance()`

2. **Transaction Failures**
   - Verify user has sufficient SOL balance
   - Check token account exists
   - Ensure pool is properly initialized

3. **Price Update Issues**
   - Verify pool exists on-chain
   - Check RPC connection
   - Validate token mint address

### Debug Commands

```bash
# Check backend wallet balance
curl http://localhost:5000/wallet/balance

# Get token price
curl http://localhost:5000/token/{tokenId}/price

# Check pool status
curl http://localhost:5000/pool/{poolAddress}/status
```
