ing is u// Corrected import script using actual Prisma schema model names
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();


function getSheetbestHeaders() {
  return { 
    'Content-Type': 'application/json', 
    'X-Api-Key': SHEETBEST_API_KEY,
  };
}

async function fetchFromSheets(tabName) {
  try {
    const response = await fetch(`${SHEETBEST_URL}/tabs/${encodeURIComponent(tabName)}`, {
      method: 'GET',
      headers: getSheetbestHeaders(),
    });

    if (!response.ok) {
      console.log(`⚠️ Tab "${tabName}" not accessible (${response.status})`);
      return [];
    }

    const