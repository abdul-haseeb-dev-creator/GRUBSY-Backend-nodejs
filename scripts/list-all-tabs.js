// Script to list ALL available tabs in the Google Sheet
import 'dotenv/config';
import fetch from 'node-fetch';

const SHEETBEST_URL = process.env.SHEETBEST_URL;
const SHEETBEST_API_KEY = process.env.SHEETBEST_API_KEY;

function getSheetbestHeaders() {
  return { 
    'Content-Type': 'application/json', 
    'X-Api-Key': SHEETBEST_API_KEY,
  };
}

async function listAllTabs() {
  try {
    console.log('🔍 Fetching all available tabs from SheetBest API...\n');
    
    // Try to get the sheet info/tabs list
    const response = await fetch(`${SHEETBEST_URL}`, {
      method: 'GET',
      headers: getSheetbestHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Raw API response:', JSON.stringify(data, null, 2));
    
    // Also try the tabs endpoint
    console.log('\n🔍 Trying tabs endpoint...');
    const tabsResponse = await fetch(`${SHEETBEST_URL}/tabs`, {
      method: 'GET',
      headers: getSheetbestHeaders(),
    });

    if (tabsResponse.ok) {
      const tabsData = await tabsResponse.json();
      console.log('📋 Tabs endpoint response:', JSON.stringify(tabsData, null, 2));
    } else {
      console.log('❌ Tabs endpoint not available');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAllTabs();