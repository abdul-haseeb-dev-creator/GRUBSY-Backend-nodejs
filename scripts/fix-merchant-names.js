// Fix merchant names by re-importing from Google Sheets
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SHEETBEST_URL = process.env.SHEETBEST_URL;
const SHEETBEST_API_KEY = process.env.SHEETBEST_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  'X-Api-Key': SHEETBEST_API_KEY,
};

async function fixMerchantNames() {
  try {
    console.log('🔧 Fetching correct merchant data from Google Sheets...');
    console.log('📍 URL:', `${SHEETBEST_URL}/Establishments`);
    console.log('📍 Headers:', headers);
    
    // Fetch establishments from Google Sheets
    const response = await fetch(`${SHEETBEST_URL}/tabs/Establishments`, { headers });
    console.log('📍 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('📍 Error response body:', errorText);
      throw new Error(`Failed to fetch establishments: ${response.statusText}`);
    }
    
    const establishments = await response.json();
    console.log(`📊 Found ${establishments.length} establishments in Google Sheets`);
    
    // Find the correct data for G-0001
    const correctEstablishment = establishments.find(est => 
      est['Establishment ID'] === 'G-0001' || 
      est['ID'] === 'G-0001' ||
      est['Code'] === 'G-0001'
    );
    
    if (!correctEstablishment) {
      console.log('❌ Could not find G-0001 in Google Sheets');
      console.log('Available establishments:', establishments.map(e => ({
        id: e['Establishment ID'] || e['ID'] || e['Code'],
        name: e['Name'] || e['Establishment Name'] || e['Restaurant Name']
      })));
      return;
    }
    
    console.log('✅ Found correct establishment data:', correctEstablishment);
    
    // Update the merchant in database
    const correctName = correctEstablishment['Name'] || 
                       correctEstablishment['Establishment Name'] || 
                       correctEstablishment['Restaurant Name'];
    
    const correctAddress = correctEstablishment['Address'] || 
                          correctEstablishment['Location'] || 
                          correctEstablishment['Full Address'];
    
    if (!correctName) {
      console.log('❌ No name found in establishment data');
      return;
    }
    
    console.log(`🔄 Updating merchant G-0001 to: "${correctName}"`);
    
    const updatedMerchant = await prisma.merchant.update({
      where: { id: 'cmerhj5fm0004sbgf0tjq1n6q' },
      data: {
        name: correctName,
        address: correctAddress || 'Address not provided',
        description: correctEstablishment['Description'] || 'Authentic cuisine'
      }
    });
    
    console.log('✅ Successfully updated merchant:');
    console.log(`   Name: ${updatedMerchant.name}`);
    console.log(`   Address: ${updatedMerchant.address}`);
    
  } catch (error) {
    console.error('❌ Error fixing merchant names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMerchantNames();