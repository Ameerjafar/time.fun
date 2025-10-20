#!/usr/bin/env node

/**
 * Test script for buy/sell token functionality
 * This script tests the complete flow of token trading
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test data
const testData = {
  tokenMint: 'test-mint-address-123',
  userPublicKey: 'test-user-public-key-456',
  creatorPublicKey: 'test-creator-public-key-789',
  amountOutToken: 1000,
  amountInToken: 500
};

async function testBuyTokenTransaction() {
  console.log('🧪 Testing buy token transaction preparation...');
  
  try {
    const response = await axios.post(`${BASE_URL}/token/buy/prepare`, {
      tokenMint: testData.tokenMint,
      amountOutToken: testData.amountOutToken,
      userPublicKey: testData.userPublicKey,
      creatorPublicKey: testData.creatorPublicKey
    });

    console.log('✅ Buy transaction prepared successfully');
    console.log('Transaction data:', {
      hasTransaction: !!response.data.transactionData.transaction,
      instructionCount: response.data.transactionData.instructions.length,
      estimatedAmount: response.data.transactionData.estimatedTokenAmount
    });

    return response.data.transactionData;
  } catch (error: any) {
    console.error('❌ Buy transaction preparation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testSellTokenTransaction() {
  console.log('🧪 Testing sell token transaction preparation...');
  
  try {
    const response = await axios.post(`${BASE_URL}/token/sell/prepare`, {
      tokenMint: testData.tokenMint,
      amountInToken: testData.amountInToken,
      userPublicKey: testData.userPublicKey,
      creatorPublicKey: testData.creatorPublicKey
    });

    console.log('✅ Sell transaction prepared successfully');
    console.log('Transaction data:', {
      hasTransaction: !!response.data.transactionData.transaction,
      instructionCount: response.data.transactionData.instructions.length,
      estimatedAmount: response.data.transactionData.estimatedTokenAmount
    });

    return response.data.transactionData;
  } catch (error: any) {
    console.error('❌ Sell transaction preparation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testSubmitTransaction(transactionData: any, transactionType: 'buy' | 'sell') {
  console.log(`🧪 Testing ${transactionType} transaction submission...`);
  
  try {
    const response = await axios.post(`${BASE_URL}/token/trade/submit`, {
      signedTransaction: transactionData.transaction,
      tokenMint: testData.tokenMint,
      creatorPublicKey: testData.creatorPublicKey,
      transactionType,
      amount: transactionType === 'buy' ? testData.amountOutToken * 0.001 : testData.amountInToken * 0.001 // Mock SOL amount
    });

    console.log(`✅ ${transactionType} transaction submitted successfully`);
    console.log('Response:', {
      signature: response.data.signature,
      transactionType: response.data.transactionType,
      creatorTransfer: response.data.creatorTransfer
    });

    return response.data;
  } catch (error: any) {
    console.error(`❌ ${transactionType} transaction submission failed:`, error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting buy/sell token functionality tests...\n');

  try {
    // Test buy transaction
    const buyTransactionData = await testBuyTokenTransaction();
    console.log('');
    
    // Test sell transaction
    const sellTransactionData = await testSellTokenTransaction();
    console.log('');
    
    // Test buy submission
    await testSubmitTransaction(buyTransactionData, 'buy');
    console.log('');
    
    // Test sell submission
    await testSubmitTransaction(sellTransactionData, 'sell');
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- ✅ Buy transaction preparation');
    console.log('- ✅ Sell transaction preparation');
    console.log('- ✅ Buy transaction submission');
    console.log('- ✅ Sell transaction submission');
    console.log('- ✅ Creator fund transfer simulation');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testBuyTokenTransaction, testSellTokenTransaction, testSubmitTransaction };
