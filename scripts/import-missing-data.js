 // Import missing data from CSV files into database
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to convert UK date format (DD/MM/YYYY) to MySQL format (YYYY-MM-DD)
function convertDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return '';

  // Handle various date formats
  const date = dateStr.trim();

  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Convert DD/MM/YYYY to YYYY-MM-DD
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
    const [day, month, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Handle other formats like "Today", "3/7/2025 - 12:50"
  if (date.toLowerCase().includes('today') || date.includes('-')) {
    return new Date().toISOString().split('T')[0]; // Return today's date
  }

  return date; // Return original if can't parse
}

// Clean phone number to be a string
function cleanPhone(phoneStr) {
  if (!phoneStr || phoneStr.trim() === '') return '';

  // Remove any non-numeric characters except spaces and +
  return phoneStr.replace(/[^\d\s+]/g, '').trim();
}

// Parse CSV content with proper quote handling
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].trim() : '';
    });
    return obj;
  });

  return rows;
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  values.push(current);

  return values;
}

// Read CSV file
function readCSVFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return parseCSV(content);
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return [];
  }
}

// Import orders
async function importOrders() {
  console.log('📦 Importing orders...');

  const csvPath = path.join(__dirname, '../../CSV data base for Prisma/Grubsy Data Sheets - Orders.csv');
  const orders = readCSVFile(csvPath);
  let importedCount = 0;

  for (const order of orders) {
    try {
      // Skip if no Order ID
      if (!order['Order ID']) continue;

      // Map user email to Grubsy_User_ID (use email as the ID)
      let userId = order['Users Email'] || '';

      // Map partner ID to correct format
      let partnerId = order['Grubsy Partner ID'] || '';
      if (partnerId.startsWith('Grb-')) {
        // Convert Grb-0001 to Gbr-0001
        partnerId = partnerId.replace('Grb-', 'Gbr-');
      }

      const orderData = {
        id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Order_ID: order['Order ID'] || '',
        Ordered_Items: order['Ordered Items'] || '',
        Grubsy_User_ID: userId,
        Grubsy_Partner_ID: partnerId,
        Order_Date: convertDate(order['Order Date'] || ''),
        Status: order['Status'] || 'Pending',
        Basket_SubTotal: order['Basket SubTotal'] ? order['Basket SubTotal'].replace(/[£$,]/g, '') : '0',
        Service_Fee: order['Service Fee'] ? order['Service Fee'].replace(/[£$,]/g, '') : '0',
        Delivery_Fee: order['Delivery Fee'] ? order['Delivery Fee'].replace(/[£$,]/g, '') : '0',
        Order_Grand_total: order['Order Grand total'] ? order['Order Grand total'].replace(/[£$,]/g, '') : '0',
        Tips: order['Tips'] ? order['Tips'].replace(/[£$,]/g, '') : '0',
        Delivery_Address: order['Delivery Address'] || '',
        Users_Email: order['Users Email'] || '',
        Driver_ID: order['Driver ID'] || null, // Set to null if empty to avoid foreign key constraint
        SKU: order['SKU'] || '',
        Created_At: order['Created At'] || new Date().toISOString(),
        Updated_At: new Date().toISOString(),
        Payment_Link: order['Payment Link'] || '', // Don't truncate - let database handle it
        Payment_Status: order['Payment Status'] || '',
        Stripe_Session_ID: order['Stripe Session ID'] || '',
        Users_Phone_number: cleanPhone(order['Users Phone number'] || ''),
        Cordinates: order['Cordinates'] || '',
        Restaurant_Accepted_At: order['Restaurant Accepted At'] || '',
      };

      // Debug logging
      console.log('🔍 Order data for import:', {
        Order_ID: orderData.Order_ID,
        Grubsy_User_ID: orderData.Grubsy_User_ID,
        Grubsy_Partner_ID: orderData.Grubsy_Partner_ID,
        Driver_ID: orderData.Driver_ID,
        Users_Email: orderData.Users_Email
      });

      // Remove null/undefined values
      Object.keys(orderData).forEach(key => {
        if (orderData[key] === null || orderData[key] === undefined || orderData[key] === '') {
          delete orderData[key];
        }
      });

      // Check if order already exists
      const existingOrder = await prisma.Orders.findUnique({
        where: { Order_ID: orderData.Order_ID }
      });

      if (existingOrder) {
        console.log(`⏭️  Order ${orderData.Order_ID} already exists, skipping`);
        continue;
      }

      await prisma.Orders.create({
        data: orderData,
      });

      importedCount++;
      console.log(`✅ Imported order: ${orderData.Order_ID}`);

    } catch (error) {
      console.error('❌ Error importing order:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} orders`);
  return importedCount;
}

// Import combo options
async function importComboOptions() {
  console.log('🍔 Importing combo options...');

  const csvPath = path.join(__dirname, '../../CSV data base for Prisma/Grubsy Data Sheets - Combo Options.csv');
  const comboOptions = readCSVFile(csvPath);
  let importedCount = 0;

  for (const option of comboOptions) {
    try {
      // Skip if no data
      if (!option['Combo Name']) continue;

      // Map merchant names to Grubsy_Partner_ID
      let partnerId = option['Grubsy Partner ID'] || '';
      if (option['Merchant Name']) {
        const merchantMappings = {
          'Le Damas': 'Gbr-0001',
          'Big Boys Kitchen': 'Gbr-0002',
          'Dodgers Dubai Droids': 'Gbr-0003',
          'Edens Eggs': 'Gbr-0004'
        };
        partnerId = merchantMappings[option['Merchant Name']] || partnerId;
      }

      const optionData = {
        id: `combooption-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Establishment: option['Merchant Name'] || '',
        Grubsy_Partner_ID: partnerId,
        Combo_Name: option['Combo Name'] || '',
        Option_Name: option['Option Name'] || '',
        Option_Order: option['Option Order'] || '1',
        Option_Items__comma_separated_: option['Option Items (comma separated)'] || '',
        Combo_Option_ID: `CO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Combo_ID: 'c-1001', // Use the existing combo ID
        Image: option['Image'] || '',
      };

      // Remove null/undefined values
      Object.keys(optionData).forEach(key => {
        if (optionData[key] === null || optionData[key] === undefined || optionData[key] === '') {
          delete optionData[key];
        }
      });

      await prisma.Combo_Options.create({
        data: optionData,
      });

      importedCount++;
      console.log(`✅ Imported combo option: ${optionData.Option_Name} for ${optionData.Combo_Name}`);

    } catch (error) {
      console.error('❌ Error importing combo option:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} combo options`);
  return importedCount;
}

// Import bookings
async function importBookings() {
  console.log('📅 Importing bookings...');

  const csvPath = path.join(__dirname, '../../CSV data base for Prisma/Grubsy Data Sheets - Bookings.csv');
  const bookings = readCSVFile(csvPath);
  let importedCount = 0;

  for (const booking of bookings) {
    try {
      // Skip if no data
      if (!booking['Restaurant Name']) continue;

      const bookingData = {
        id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Restaurant_Name: booking['Restaurant Name'] || '',
        User_Email: booking['User Email'] || '',
        Date: convertDate(booking['Date'] || ''),
        Time: booking['Time'] || '',
        Guests: booking['Guests'] ? parseInt(booking['Guests']) : 1,
        Name: booking['Name'] || '',
        Phone: cleanPhone(booking['Phone'] || ''),
        Special_Requests: booking['Special Requests'] || '',
      };

      // Remove null/undefined values
      Object.keys(bookingData).forEach(key => {
        if (bookingData[key] === null || bookingData[key] === undefined || bookingData[key] === '') {
          delete bookingData[key];
        }
      });

      await prisma.Bookings.create({
        data: bookingData,
      });

      importedCount++;
      console.log(`✅ Imported booking: ${bookingData.Name} at ${bookingData.Restaurant_Name}`);

    } catch (error) {
      console.error('❌ Error importing booking:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} bookings`);
  return importedCount;
}

// Import order lines
async function importOrderLines() {
  console.log('📋 Importing order lines...');

  const csvPath = path.join(__dirname, '../../CSV data base for Prisma/Grubsy Data Sheets - Order Lines.csv');
  const orderLines = readCSVFile(csvPath);
  let importedCount = 0;

  for (const line of orderLines) {
    try {
      // Skip if no data
      if (!line['Order Line ID']) continue;

      const lineData = {
        id: `orderline-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Order_Line_ID: line['Order Line ID'] || '',
        Order_ID: line['Order ID'] || '',
        Menu_Item_ID: line['Menu Item ID'] || '',
        Quantity: line['Quantity'] ? parseInt(line['Quantity']) : 1,
        Price: line['Price'] ? line['Price'].replace(/[£$,]/g, '') : '0',
        Subtotal: line['Subtotal'] ? line['Subtotal'].replace(/[£$,]/g, '') : '0',
      };

      // Remove null/undefined values
      Object.keys(lineData).forEach(key => {
        if (lineData[key] === null || lineData[key] === undefined || lineData[key] === '') {
          delete lineData[key];
        }
      });

      await prisma.Order_Lines.create({
        data: lineData,
      });

      importedCount++;
      console.log(`✅ Imported order line: ${lineData.Order_Line_ID}`);

    } catch (error) {
      console.error('❌ Error importing order line:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} order lines`);
  return importedCount;
}

// Import order messages
async function importOrderMessages() {
  console.log('💬 Importing order messages...');

  const csvPath = path.join(__dirname, '../../CSV data base for Prisma/Grubsy Data Sheets - Order Messages.csv');
  const messages = readCSVFile(csvPath);
  let importedCount = 0;

  for (const message of messages) {
    try {
      // Skip if no data
      if (!message['Order ID']) continue;

      const messageData = {
        id: `ordermessage-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Order_ID: message['Order ID'] || '',
        Message: message['Message'] || '',
        Sender: message['Sender'] || '',
        Timestamp: message['Timestamp'] ? new Date(message['Timestamp']) : new Date(),
      };

      // Remove null/undefined values
      Object.keys(messageData).forEach(key => {
        if (messageData[key] === null || messageData[key] === undefined || messageData[key] === '') {
          delete messageData[key];
        }
      });

      await prisma.Order_Messages.create({
        data: messageData,
      });

      importedCount++;
      console.log(`✅ Imported order message for order: ${messageData.Order_ID}`);

    } catch (error) {
      console.error('❌ Error importing order message:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} order messages`);
  return importedCount;
}

// Import user sessions
async function importUserSessions() {
  console.log('🔐 Importing user sessions...');

  const csvPath = path.join(__dirname, '../../CSV data base for Prisma/Grubsy Data Sheets - User Session.csv');
  const sessions = readCSVFile(csvPath);
  let importedCount = 0;

  for (const session of sessions) {
    try {
      // Skip if no data
      if (!session['Session ID']) continue;

      const sessionData = {
        id: `usersession-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Session_ID: session['Session ID'] || '',
        User_Grubsy_ID: session['User Grubsy ID'] || '',
        Manual_Location: session['Manual Location'] || '',
        Search_Location: session['Search Location'] || '',
        Basket_Subtotal: session['Basket Subtotal'] ? session['Basket Subtotal'].replace(/[£$,]/g, '') : '0',
        Fee: session['Fee'] ? session['Fee'].replace(/[£$,]/g, '') : '0',
        Order_Grand_Total: session['Order Grand Total'] ? session['Order Grand Total'].replace(/[£$,]/g, '') : '0',
        Cuisines_of_Grubsy: session['Cuisines of Grubsy'] || '',
        Created_At: session['Created At'] ? new Date(session['Created At']) : new Date(),
      };

      // Remove null/undefined values
      Object.keys(sessionData).forEach(key => {
        if (sessionData[key] === null || sessionData[key] === undefined || sessionData[key] === '') {
          delete sessionData[key];
        }
      });

      await prisma.User_Session.create({
        data: sessionData,
      });

      importedCount++;
      console.log(`✅ Imported user session: ${sessionData.Session_ID}`);

    } catch (error) {
      console.error('❌ Error importing user session:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} user sessions`);
  return importedCount;
}

// Import delivery zones
async function importDeliveryZones() {
  console.log('🚚 Importing delivery zones...');

  const csvPath = path.join(__dirname, '../../CSV data base for Prisma/Grubsy Data Sheets - Delivery Zones.csv');
  const zones = readCSVFile(csvPath);
  let importedCount = 0;

  for (const zone of zones) {
    try {
      // Skip if no data
      if (!zone['Zone Name']) continue;

      const zoneData = {
        id: `deliveryzone-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Zone_ID: zone['Zone ID'] || `Z-${Date.now()}`,
        Zone_Name: zone['Zone Name'] || '',
        Post_Codes__Comma_Separated_: zone['Post Codes (Comma Separated)'] || '',
        Status: zone['Status'] || 'Active',
        Driver_Fee___Normal_hrs: zone['Driver Fee : Normal hrs'] ? zone['Driver Fee : Normal hrs'].replace(/[£$,]/g, '') : '0',
        Driver_Fee__Peak_Hours: zone['Driver Fee: Peak Hours'] ? zone['Driver Fee: Peak Hours'].replace(/[£$,]/g, '') : '0',
        Peak_Hours__4pm_7pm__Active_: zone['Peak Hours (4pm-7pm) Active:'] || 'FALSE',
        Delivery_charge: zone['Delivery charge'] ? zone['Delivery charge'].replace(/[£$,]/g, '') : '0',
      };

      // Remove null/undefined values
      Object.keys(zoneData).forEach(key => {
        if (zoneData[key] === null || zoneData[key] === undefined || zoneData[key] === '') {
          delete zoneData[key];
        }
      });

      await prisma.Delivery_Zones.create({
        data: zoneData,
      });

      importedCount++;
      console.log(`✅ Imported delivery zone: ${zoneData.Zone_Name}`);

    } catch (error) {
      console.error('❌ Error importing delivery zone:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} delivery zones`);
  return importedCount;
}

// Import documents
async function importDocuments() {
  console.log('📄 Importing documents...');

  const csvPath = path.join(__dirname, '../../CSV data base for Prisma/Grubsy Data Sheets - Documents.csv');
  const documents = readCSVFile(csvPath);
  let importedCount = 0;

  for (const doc of documents) {
    try {
      // Skip if no data
      if (!doc['Document ID']) continue;

      const docData = {
        id: `document-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Document_ID: doc['Document ID'] || '',
        Code: doc['Code'] || '',
        Description: doc['Description'] || '',
        Document_Name: doc['Document Name'] || '',
        File_URL: doc['File URL'] || '',
        SKU: doc['SKU'] || '',
        Image_URL: doc['Image URL'] || '',
        Comments: doc['Comments'] || '',
      };

      // Remove null/undefined values
      Object.keys(docData).forEach(key => {
        if (docData[key] === null || docData[key] === undefined || docData[key] === '') {
          delete docData[key];
        }
      });

      await prisma.Documents.create({
        data: docData,
      });

      importedCount++;
      console.log(`✅ Imported document: ${docData.File_Name}`);

    } catch (error) {
      console.error('❌ Error importing document:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} documents`);
  return importedCount;
}

// Import CRM back office data
async function importCRMBackOffice() {
  console.log('🏢 Importing CRM back office data...');

  const csvPath = path.join(__dirname, '../../CSV data base for Prisma/Grubsy Data Sheets - CRM_Back Office.csv');
  const crmData = readCSVFile(csvPath);
  let importedCount = 0;

  for (const record of crmData) {
    try {
      // Skip if no data
      if (!record['Record ID']) continue;

      const crmRecord = {
        id: `crm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        Record_ID: record['Record ID'] || '',
        Customer_Email: record['Customer Email'] || '',
        Issue_Type: record['Issue Type'] || '',
        Description: record['Description'] || '',
        Status: record['Status'] || '',
        Assigned_To: record['Assigned To'] || '',
        Created_At: record['Created At'] ? new Date(record['Created At']) : new Date(),
        Resolved_At: record['Resolved At'] ? new Date(record['Resolved At']) : null,
      };

      // Remove null/undefined values
      Object.keys(crmRecord).forEach(key => {
        if (crmRecord[key] === null || crmRecord[key] === undefined || crmRecord[key] === '') {
          delete crmRecord[key];
        }
      });

      await prisma.CRM_Back_Office.create({
        data: crmRecord,
      });

      importedCount++;
      console.log(`✅ Imported CRM record: ${crmRecord.Record_ID}`);

    } catch (error) {
      console.error('❌ Error importing CRM record:', error.message);
    }
  }

  console.log(`🎉 Imported ${importedCount} CRM records`);
  return importedCount;
}

// Main import function
async function importAllMissingData() {
  try {
    console.log('🚀 Starting import of all missing data from CSV files...\n');

    // Import in order of dependencies
    await importOrders();
    await importComboOptions();
    await importBookings();
    await importOrderLines();
    await importOrderMessages();
    await importUserSessions();
    await importDeliveryZones();
    await importDocuments();
    await importCRMBackOffice();

    console.log('\n🎉 All missing data imported successfully!');

    // Show summary
    const summary = await Promise.all([
      prisma.merchants.count(),
      prisma.Menu_Items.count(),
      prisma.Users.count(),
      prisma.Drivers.count(),
      prisma.Combos.count(),
      prisma.User___FAQ_s.count(),
      prisma.Driver___FAQ_s.count(),
      prisma.Orders.count(),
      prisma.Combo_Options.count(),
      prisma.Bookings.count(),
      prisma.Order_Lines.count(),
      prisma.Order_Messages.count(),
      prisma.User_Session.count(),
      prisma.Delivery_Zones.count(),
      prisma.Documents.count(),
      prisma.CRM_Back_Office.count(),
    ]);

    console.log('\n📊 Complete Database Summary:');
    console.log(`   Merchants: ${summary[0]}`);
    console.log(`   Menu Items: ${summary[1]}`);
    console.log(`   Users: ${summary[2]}`);
    console.log(`   Drivers: ${summary[3]}`);
    console.log(`   Combos: ${summary[4]}`);
    console.log(`   User FAQs: ${summary[5]}`);
    console.log(`   Driver FAQs: ${summary[6]}`);
    console.log(`   Orders: ${summary[7]}`);
    console.log(`   Combo Options: ${summary[8]}`);
    console.log(`   Bookings: ${summary[9]}`);
    console.log(`   Order Lines: ${summary[10]}`);
    console.log(`   Order Messages: ${summary[11]}`);
    console.log(`   User Sessions: ${summary[12]}`);
    console.log(`   Delivery Zones: ${summary[13]}`);
    console.log(`   Documents: ${summary[14]}`);
    console.log(`   CRM Records: ${summary[15]}`);

  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAllMissingData();