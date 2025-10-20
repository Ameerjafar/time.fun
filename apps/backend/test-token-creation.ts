/**
 * Test script for token creation
 * Run with: bun run test-token-creation.ts
 */

import { createTokenWithPool } from './services/solana/solanaService';

async function testTokenCreation() {
  console.log('🚀 Testing token creation...\n');

  try {
    const result = await createTokenWithPool(
      {
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 9,
        totalSupply: 1000000,
        imageUrl: 'https://via.placeholder.com/200',
        description: 'A test token for Time.fun',
        creatorPublicKey: 'test-creator-id'
      },
      1, // 1 SOL initial liquidity
      1000000 // 1M tokens initial supply
    );

    console.log('\n✅ Token creation successful!');
    console.log('📝 Results:');
    console.log('  - Mint Address:', result.mintAddress);
    console.log('  - Pool Address:', result.poolAddress);
    console.log('  - Token Price:', result.tokenPrice, 'SOL');
    console.log('  - Signatures:', result.signatures);
    console.log('\n🔗 View on Explorer:');
    console.log(`  https://explorer.solana.com/address/${result.mintAddress}?cluster=devnet`);

  } catch (error: any) {
    console.error('\n❌ Token creation failed:');
    console.error('  Error:', error.message);
    console.error('  Stack:', error.stack);
  }
}

// Run the test
testTokenCreation();
