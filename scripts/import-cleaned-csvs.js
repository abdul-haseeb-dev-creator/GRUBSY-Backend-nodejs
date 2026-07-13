// Import all cleaned CSV files directly into database
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// CSV folder paths
const cleanedFolder = path.join(__dirname, '../../CSV data base for Prisma/cleaned-accurate');

// Helper function to parse CSV line with quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current); // Add the last field
  return result;
}

// Import users
async function importUsers() {
  console.log('👥 Importing users...');

  const csvPath = path.join(cleanedFolder, 'Grubsy Data Sheets - Users.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Users CSV not found, skipping...');
    return 0;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').slice(1).filter(line => line.trim());

  let importedCount = 0;

  for (const line of lines) {
    try {
      const fields = parseCSVLine(line);

      if (fields.length < 12) continue;

      const userData = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Grubsy_User_ID: fields[1].trim(),
        Users_Full_Name: fields[0].trim() || null,
        Users_Email: fields[1].trim(),
        Users_Password: fields[2].trim() || null,
        Is_New_User_: fields[3].trim() || null,
        Users_Registered_Address: fields[4].trim() || null,
        Users_Registered_PostCode: fields[5].trim() || null,
        Users_Phone_Number: fields[6].trim() || null,
        Date_Of_Birth: fields[7].trim() || null,
        Status: fields[8].trim() || null,
        Created_At: fields[9].trim() || null,
        Last_Login: fields[10].trim() || null,
      };

      // Remove null/undefined values
      Object.keys(userData).forEach(key => {
        if (userData[key] === null || userData[key] === undefined) {
          delete userData[key];
        }
      });

      await prisma.Users.create({
        data: userData,
      });

      importedCount++;
      console.log(`✅ Imported user: ${userData.Users_Email}`);

    } catch (error) {
      console.error('❌ Error importing user:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} users`);
  return importedCount;
}

// Import drivers
async function importDrivers() {
  console.log('🚗 Importing drivers...');

  const csvPath = path.join(cleanedFolder, 'Grubsy Data Sheets - Drivers.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Drivers CSV not found, skipping...');
    return 0;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').slice(1).filter(line => line.trim());

  let importedCount = 0;

  for (const line of lines) {
    try {
      const fields = parseCSVLine(line);

      if (fields.length < 14) continue;

      const driverData = {
        id: `driver-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Driver_ID: fields[0].trim(),
        Name: fields[1].trim(),
        Email: fields[2].trim() || null,
        Phone: fields[3].trim() || null,
        Vehicle: fields[4].trim() || null,
        Driving_Licence: fields[5].trim() || null,
        Date_Joined: fields[6].trim() || null,
        Status: fields[7].trim() || null,
        Assigned_Orders__Comma_Separated_: fields[8].trim() || null,
        Created_At: fields[9].trim() || null,
        Last_Login: fields[10].trim() || null,
        Profile_Photo: fields[11].trim() || null,
        Availability: fields[12].trim() || null,
        Current_location: fields[13].trim() || null,
      };

      // Remove null/undefined values
      Object.keys(driverData).forEach(key => {
        if (driverData[key] === null || driverData[key] === undefined) {
          delete driverData[key];
        }
      });

      await prisma.Drivers.create({
        data: driverData,
      });

      importedCount++;
      console.log(`✅ Imported driver: ${driverData.Name}`);

    } catch (error) {
      console.error('❌ Error importing driver:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} drivers`);
  return importedCount;
}

// Import merchants
async function importMerchants() {
  console.log('📥 Importing merchants...');

  const csvPath = path.join(cleanedFolder, 'Grubsy Data Sheets - Merchants.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Merchants CSV not found, skipping...');
    return 0;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').slice(1).filter(line => line.trim());

  let importedCount = 0;

  for (const line of lines) {
    try {
      const fields = parseCSVLine(line);

      if (fields.length < 20) continue;

      const merchantData = {
        id: `merchant-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Grubsy_Partner_ID: fields[0].trim(),
        merchants_name: fields[1].trim(),
        Description: fields[2].trim() || null,
        Cuisine: fields[3].trim() || null,
        Address: fields[4].trim() || null,
        Area: fields[5].trim() || null,
        PostCode: fields[6].trim() || null,
        Hygiene_Rating: fields[7].trim() || null,
        Opening_Times: fields[8].trim() || null,
        Halal_Friendly: fields[9].trim() || null,
        Photo: fields[10].trim() || null,
        Booking_Available: fields[11].trim() || null,
        Relation: fields[12].trim() || null,
        Active: fields[13].trim() || null,
        Owner_Email: fields[14].trim() || null,
        Created_at: fields[15].trim() || null,
        Owners_Name: fields[16].trim() || null,
        Owners_number: fields[17].trim() || null,
        Establishments_Enrolement_Status: fields[18].trim() || null,
        Establishment_Fee_Per_Order: fields[19].trim() || null,
      };

      // Remove null/undefined values
      Object.keys(merchantData).forEach(key => {
        if (merchantData[key] === null || merchantData[key] === undefined) {
          delete merchantData[key];
        }
      });

      await prisma.merchants.create({
        data: merchantData,
      });

      importedCount++;
      console.log(`✅ Imported merchant: ${merchantData.merchants_name}`);

    } catch (error) {
      console.error('❌ Error importing merchant:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} merchants`);
  return importedCount;
}

// Import menu items
async function importMenuItems() {
  console.log('🍽️ Importing menu items...');

  const csvPath = path.join(cleanedFolder, 'Grubsy Data Sheets - Menu Items.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Menu Items CSV not found, skipping...');
    return 0;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').slice(1).filter(line => line.trim());

  let importedCount = 0;

  for (const line of lines) {
    try {
      const fields = parseCSVLine(line);

      if (fields.length < 17) continue;

      const menuItemData = {
        id: `menuitem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Menu_Item_ID: fields[0].trim(),
        Establishments: fields[1].trim(),
        Grubsy_Partner_ID: fields[2].trim(),
        Food_Category: fields[3].trim() || null,
        Item: fields[4].trim(),
        Regular: fields[5].trim() || null,
        Medium: fields[6].trim() || null,
        Large: fields[7].trim() || null,
        Platter: fields[8].trim() || null,
        Image: fields[9].trim() || null,
        Description: fields[10].trim() || null,
        Notes: fields[11].trim() || null,
        SKU: fields[12].trim() || null,
        Created_At: fields[13].trim() || null,
        Updated_At: fields[14].trim() || null,
        Available: fields[15].trim() === 'Yes' ? 'Yes' : 'No',
        LastToggledAt: fields[16].trim() || null,
      };

      // Remove null/undefined values
      Object.keys(menuItemData).forEach(key => {
        if (menuItemData[key] === null || menuItemData[key] === undefined) {
          delete menuItemData[key];
        }
      });

      await prisma.Menu_Items.create({
        data: menuItemData,
      });

      importedCount++;
      console.log(`✅ Imported menu item: ${menuItemData.Item}`);

    } catch (error) {
      console.error('❌ Error importing menu item:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} menu items`);
  return importedCount;
}

// Import combos
async function importCombos() {
  console.log('🍔 Importing combos...');

  const csvPath = path.join(cleanedFolder, 'Grubsy Data Sheets - Combos.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Combos CSV not found, skipping...');
    return 0;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').slice(1).filter(line => line.trim());

  let importedCount = 0;

  for (const line of lines) {
    try {
      const fields = parseCSVLine(line);

      if (fields.length < 10) continue;

      const comboData = {
        id: `combo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Combo_ID: fields[0].trim(),
        Establishment: fields[1].trim() || null,
        Combo_Name: fields[2].trim() || null,
        Price: fields[3].trim() || null,
        Description: fields[4].trim() || null,
        Available_Times: fields[5].trim() || null,
        Status: fields[6].trim() || null,
        Created_at_: fields[7].trim() || null,
        Grubsy_Partner_ID: fields[8].trim() || null,
        Image: fields[9].trim() || null,
      };

      // Remove null/undefined values
      Object.keys(comboData).forEach(key => {
        if (comboData[key] === null || comboData[key] === undefined) {
          delete comboData[key];
        }
      });

      await prisma.Combos.create({
        data: comboData,
      });

      importedCount++;
      console.log(`✅ Imported combo: ${comboData.Combo_Name}`);

    } catch (error) {
      console.error('❌ Error importing combo:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} combos`);
  return importedCount;
}

// Import FAQs
async function importFAQs() {
  console.log('❓ Importing FAQs...');

  // Import User FAQs
  const userFaqPath = path.join(cleanedFolder, 'Grubsy Data Sheets - User_ FAQ\'s.csv');
  if (fs.existsSync(userFaqPath)) {
    const userFaqContent = fs.readFileSync(userFaqPath, 'utf8');
    const userFaqLines = userFaqContent.split('\n').slice(1).filter(line => line.trim());

    for (const line of userFaqLines) {
      try {
        const fields = parseCSVLine(line);
        if (fields.length < 3) continue;

        const faqData = {
          id: `userfaq-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          Question: fields[0].trim(),
          Answer: fields[1].trim(),
        };

        await prisma.User___FAQ_s.create({ data: faqData });
        console.log(`✅ Imported user FAQ: ${faqData.Question}`);
      } catch (error) {
        console.error('❌ Error importing user FAQ:', error.message);
      }
    }
  }

  // Import Driver FAQs
  const driverFaqPath = path.join(cleanedFolder, 'Grubsy Data Sheets - Driver_ FAQ\'s.csv');
  if (fs.existsSync(driverFaqPath)) {
    const driverFaqContent = fs.readFileSync(driverFaqPath, 'utf8');
    const driverFaqLines = driverFaqContent.split('\n').slice(1).filter(line => line.trim());

    for (const line of driverFaqLines) {
      try {
        const fields = parseCSVLine(line);
        if (fields.length < 3) continue;

        const faqData = {
          id: `driverfaq-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          Question: fields[0].trim(),
          Answer: fields[1].trim(),
        };

        await prisma.Driver___FAQ_s.create({ data: faqData });
        console.log(`✅ Imported driver FAQ: ${faqData.Question}`);
      } catch (error) {
        console.error('❌ Error importing driver FAQ:', error.message);
      }
    }
  }

  console.log('🎉 FAQs imported');
}

// Main import function
async function importAllCleanedData() {
  try {
    console.log('🚀 Starting import of all cleaned CSV data...');

    // Import in order of dependencies
    await importUsers();
    await importDrivers();
    await importMerchants();
    await importMenuItems();
    await importCombos();
    await importFAQs();

    console.log('🎉 All cleaned data imported successfully!');

    // Show summary
    const summary = await Promise.all([
      prisma.merchants.count(),
      prisma.Menu_Items.count(),
      prisma.Users.count(),
      prisma.Drivers.count(),
      prisma.Combos.count(),
      prisma.User___FAQ_s.count(),
      prisma.Driver___FAQ_s.count(),
    ]);

    console.log('\n📊 Final Database Summary:');
    console.log(`   Merchants: ${summary[0]}`);
    console.log(`   Menu Items: ${summary[1]}`);
    console.log(`   Users: ${summary[2]}`);
    console.log(`   Drivers: ${summary[3]}`);
    console.log(`   Combos: ${summary[4]}`);
    console.log(`   User FAQs: ${summary[5]}`);
    console.log(`   Driver FAQs: ${summary[6]}`);

  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAllCleanedData();