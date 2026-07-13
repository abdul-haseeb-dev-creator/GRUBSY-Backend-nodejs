import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse header line
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });

  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

async function importUsers() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Users (1).csv');
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} users...`);

  for (const row of rows) {
    await prisma.users.upsert({
      where: { Grubsy_User_ID: row['Grubsy_User_ID'] },
      update: {
        Users_Full_Name: row['Users_Full_Name'],
        Users_Email: row['Users_Email'],
        Users_Password: row['Users_Password'],
        Is_New_User: row['Is_New_User?'],
        Users_Registered_Address: row['Users_Registered_Address'],
        Users_Registered_PostCode: row['Users_Registered_PostCode'],
        Users_Phone_Number: row['Users_Phone_Number'],
        Date_Of_Birth: row['Date_Of_Birth'],
        Status: row['Status'],
        Acc_Created_At: row['Acc_Created_At'],
        Last_Login: row['Last_Login'],
      },
      create: {
        Users_Full_Name: row['Users_Full_Name'],
        Users_Email: row['Users_Email'],
        Users_Password: row['Users_Password'],
        Grubsy_User_ID: row['Grubsy_User_ID'],
        Is_New_User: row['Is_New_User?'],
        Users_Registered_Address: row['Users_Registered_Address'],
        Users_Registered_PostCode: row['Users_Registered_PostCode'],
        Users_Phone_Number: row['Users_Phone_Number'],
        Date_Of_Birth: row['Date_Of_Birth'],
        Status: row['Status'],
        Acc_Created_At: row['Acc_Created_At'],
        Last_Login: row['Last_Login'],
      },
    });
  }
  console.log('✅ Users imported');
}

async function importMerchants() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Merchants.csv');
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} merchants...`);

  for (const row of rows) {
    await prisma.merchants.upsert({
      where: { Grubsy_Partner_ID: row['Grubsy_Partner_ID'] },
      update: {
        Merchants_Name: row['Merchants_Name'],
        Description: row['Description'],
        Cuisine: row['Cuisine'],
        Address: row['Address'],
        Area: row['Area'],
        PostCode: row['PostCode'],
        Hygiene_Rating: row['Hygiene_Rating'],
        Opening_Times: row['Opening_Times'],
        Halal_Friendly: row['حلال Halal Friendly?'],
        Photo: row['Photo'],
        Booking_Available: row['Booking_Available'],
        Relation: row['Relation'],
        Active: row['Active'],
        Owner_Email: row['Owner_Email'],
        Created_at: row['Created_at'],
        Owners_Name: row['Owners_Name'],
        Owners_Number: row['Owners_Number'],
        Merchant_Enrolement_Status: row['Merchant_Enrolement_Status'],
        Merchant_Fee_Per_Order: row['Merchant_Fee_Per_Order'],
      },
      create: {
        Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
        Merchants_Name: row['Merchants_Name'],
        Description: row['Description'],
        Cuisine: row['Cuisine'],
        Address: row['Address'],
        Area: row['Area'],
        PostCode: row['PostCode'],
        Hygiene_Rating: row['Hygiene_Rating'],
        Opening_Times: row['Opening_Times'],
        Halal_Friendly: row['حلال Halal Friendly?'],
        Photo: row['Photo'],
        Booking_Available: row['Booking_Available'],
        Relation: row['Relation'],
        Active: row['Active'],
        Owner_Email: row['Owner_Email'],
        Created_at: row['Created_at'],
        Owners_Name: row['Owners_Name'],
        Owners_Number: row['Owners_Number'],
        Merchant_Enrolement_Status: row['Merchant_Enrolement_Status'],
        Merchant_Fee_Per_Order: row['Merchant_Fee_Per_Order'],
      },
    });
  }
  console.log('✅ Merchants imported');
}

async function importOrders() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Orders.csv');
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} orders...`);

  for (const row of rows) {
    await prisma.orders.upsert({
      where: { orderId: row['Order_ID'] },
      update: {
        orderedItems: row['Ordered_Items'],
        userId: row['Grubsy_User_ID'],
        partnerId: row['Grubsy_Partner_ID'],
        orderDate: row['Order_Date'],
        status: row['Status'],
        basketSubtotal: row['Basket_SubTotal'],
        serviceFee: row['Service_Fee'],
        grubsyProfit: row['Grubsy_Profit'],
        deliveryFee: row['Delivery_Fee'],
        orderGrandTotal: row['Order_Grand_Total'],
        tips: row['Tips'],
        deliveryAddress: row['Delivery_Address'],
        deliveryInstructions: row['Delivery_Instructions'],
        userEmail: row['Users_Email'],
        driverId: row['Driver_ID'],
        sku: row['SKU'],
        createdAt: row['Created_At'],
        deliveredAt: row['Delivered_At'],
        paymentLink: row['Payment_Link'],
        paymentStatus: row['Payment_Status'],
        stripeSessionId: row['Stripe_Session_ID'],
        userPhoneNumber: row['Users_Phone_number'],
        coordinates: row['Cordinates'],
        merchantAcceptedAt: row['Merchant_Accepted_At:'],
        driverPickupAt: row['Driver_PickUp_At:'],
        merchantOrderImages: row['Merchants_Order_Images'],
        driverOrderImages: row['Drivers_Order_Images'],
        userCodeGiven: row['USer_Code_Given'],
      },
      create: {
        orderId: row['Order_ID'],
        orderedItems: row['Ordered_Items'],
        userId: row['Grubsy_User_ID'],
        partnerId: row['Grubsy_Partner_ID'],
        orderDate: row['Order_Date'],
        status: row['Status'],
        basketSubtotal: row['Basket_SubTotal'],
        serviceFee: row['Service_Fee'],
        grubsyProfit: row['Grubsy_Profit'],
        deliveryFee: row['Delivery_Fee'],
        orderGrandTotal: row['Order_Grand_Total'],
        tips: row['Tips'],
        deliveryAddress: row['Delivery_Address'],
        deliveryInstructions: row['Delivery_Instructions'],
        userEmail: row['Users_Email'],
        driverId: row['Driver_ID'],
        sku: row['SKU'],
        createdAt: row['Created_At'],
        deliveredAt: row['Delivered_At'],
        paymentLink: row['Payment_Link'],
        paymentStatus: row['Payment_Status'],
        stripeSessionId: row['Stripe_Session_ID'],
        userPhoneNumber: row['Users_Phone_number'],
        coordinates: row['Cordinates'],
        merchantAcceptedAt: row['Merchant_Accepted_At:'],
        driverPickupAt: row['Driver_PickUp_At:'],
        merchantOrderImages: row['Merchants_Order_Images'],
        driverOrderImages: row['Drivers_Order_Images'],
        userCodeGiven: row['USer_Code_Given'],
      },
    });
  }
  console.log('✅ Orders imported');
}

async function importDrivers() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Drivers.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Drivers.csv not found, skipping...');
    return;
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} drivers...`);

  for (const row of rows) {
    await prisma.drivers.upsert({
      where: { Driver_ID: row['Driver_ID'] },
      update: {
        Name: row['Name'],
        Email: row['Email'],
        Phone: row['Phone'],
        Vehicle: row['Vehicle'],
        Vehicle_Reg: row['Vehicle_Reg'],
        Driving_Licence: row['Driving_Licence'],
        Date_Joined: row['Date_Joined'],
        Status: row['Status'],
        Completed_Orders: row['Completed_Orders '],
        Created_At: row['Created_At'],
        Last_Login: row['Last_Login'],
        Profile_Photo: row['Profile_Photo'],
        Availability: row['Availability'],
        Current_location: row['Current_location '],
        Cancelations: row['Cancelations'],
      },
      create: {
        Driver_ID: row['Driver_ID'],
        Name: row['Name'],
        Email: row['Email'],
        Phone: row['Phone'],
        Vehicle: row['Vehicle'],
        Vehicle_Reg: row['Vehicle_Reg'],
        Driving_Licence: row['Driving_Licence'],
        Date_Joined: row['Date_Joined'],
        Status: row['Status'],
        Completed_Orders: row['Completed_Orders '],
        Created_At: row['Created_At'],
        Last_Login: row['Last_Login'],
        Profile_Photo: row['Profile_Photo'],
        Availability: row['Availability'],
        Current_location: row['Current_location '],
        Cancelations: row['Cancelations'],
      },
    });
  }
  console.log('✅ Drivers imported');
}

async function importComboOptions() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Combo_Options.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Combo_Options.csv not found, skipping...');
    return;
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} combo options...`);

  for (const row of rows) {
    await prisma.combo_Options.upsert({
      where: { Combo_Option_ID: row['Combo_Option_ID'] },
      update: {
        Merchant_Name: row['Merchant_Name'],
        Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
        Combo_Name: row['Combo_Name'],
        Option_Name: row['Option_Name'],
        Option_Order: row['Option_Order'],
        Option_Items_comma_separated: row['Option_Items (comma separated)'],
        Combo_ID: row['Combo_ID'],
        Image: row['Image'],
      },
      create: {
        Combo_Option_ID: row['Combo_Option_ID'],
        Merchant_Name: row['Merchant_Name'],
        Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
        Combo_Name: row['Combo_Name'],
        Option_Name: row['Option_Name'],
        Option_Order: row['Option_Order'],
        Option_Items_comma_separated: row['Option_Items (comma separated)'],
        Combo_ID: row['Combo_ID'],
        Image: row['Image'],
      },
    });
  }
  console.log('✅ Combo options imported');
}

async function importCombos() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Combos.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Combos.csv not found, skipping...');
    return;
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} combos...`);

  for (const row of rows) {
    await prisma.combos.upsert({
      where: { Combo_ID: row['Combo_ID'] },
      update: {
        Merchant_Name: row['Merchant_Name'],
        Combo_Name: row['Combo_Name'],
        Price: row['Price'],
        Description: row['Description'],
        Available_Times: row['Available_Times'],
        Status: row['Status'],
        Created_at: row['Created_at:'],
        Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
        Image: row['Image'],
      },
      create: {
        Combo_ID: row['Combo_ID'],
        Merchant_Name: row['Merchant_Name'],
        Combo_Name: row['Combo_Name'],
        Price: row['Price'],
        Description: row['Description'],
        Available_Times: row['Available_Times'],
        Status: row['Status'],
        Created_at: row['Created_at:'],
        Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
        Image: row['Image'],
      },
    });
  }
  console.log('✅ Combos imported');
}

async function importDriverFAQs() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Driver_FAQ\'s.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Driver_FAQ\'s.csv not found, skipping...');
    return;
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} driver FAQs...`);

  for (const row of rows) {
    await prisma.driver_FAQ_s.upsert({
      where: { Question: row['Question'] },
      update: {
        Answer: row['Answer'],
      },
      create: {
        Question: row['Question'],
        Answer: row['Answer'],
      },
    });
  }
  console.log('✅ Driver FAQs imported');
}

async function importDeliveryZones() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Delivery_Zones.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Delivery_Zones.csv not found, skipping...');
    return;
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} delivery zones...`);

  for (const row of rows) {
    if (!row['Zone_ID']) continue; // Skip empty rows

    await prisma.delivery_Zones.upsert({
      where: { Zone_ID: row['Zone_ID'] },
      update: {
        Zone_Name: row['Zone_Name'],
        Post_Codes_Comma_Separated: row['Post_Codes (Comma Separated)'],
        Status: row['Status'],
        Driver_Fee_Normal_hrs: row['Driver_Fee:Normal_hrs'],
        Driver_Fee_Peak_Hours: row['Driver_Fee:Peak_Hours'],
        Peak_Hours_4pm_7pm_Active: row['Peak Hours (4pm-7pm) Active:'],
        Delivery_Charge: row['Delivery_Charge'],
      },
      create: {
        Zone_ID: row['Zone_ID'],
        Zone_Name: row['Zone_Name'],
        Post_Codes_Comma_Separated: row['Post_Codes (Comma Separated)'],
        Status: row['Status'],
        Driver_Fee_Normal_hrs: row['Driver_Fee:Normal_hrs'],
        Driver_Fee_Peak_Hours: row['Driver_Fee:Peak_Hours'],
        Peak_Hours_4pm_7pm_Active: row['Peak Hours (4pm-7pm) Active:'],
        Delivery_Charge: row['Delivery_Charge'],
      },
    });
  }
  console.log('✅ Delivery zones imported');
}

async function importUserFAQs() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - User_FAQ\'s.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ User_FAQ\'s.csv not found, skipping...');
    return;
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} user FAQs...`);

  for (const row of rows) {
    await prisma.user_FAQ_s.upsert({
      where: { Question: row['Question'] },
      update: {
        SKU: row['SKU'],
        Answer: row['Answer'],
      },
      create: {
        Question: row['Question'],
        SKU: row['SKU'],
        Answer: row['Answer'],
      },
    });
  }
  console.log('✅ User FAQs imported');
}

async function importDocuments() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Documents.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Documents.csv not found, skipping...');
    return;
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} documents...`);

  for (const row of rows) {
    await prisma.documents.upsert({
      where: { DocumentID: row['DocumentID'] },
      update: {
        Code: row['Code'],
        Description: row['Description'],
        Document_Name: row['Document_Name'],
        File_URL: row['File_URL'],
        SKU: row['SKU'],
        Image_URL: row['Image_URL'],
        Comments: row['Comments'],
      },
      create: {
        DocumentID: row['DocumentID'],
        Code: row['Code'],
        Description: row['Description'],
        Document_Name: row['Document_Name'],
        File_URL: row['File_URL'],
        SKU: row['SKU'],
        Image_URL: row['Image_URL'],
        Comments: row['Comments'],
      },
    });
  }
  console.log('✅ Documents imported');
}

async function importMenuItems() {
  const csvPath = path.join(process.cwd(), '../Grubsy CSV Data/Grubsy Data Sheets - Menu_Items.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ Menu_Items.csv not found, skipping...');
    return;
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(csvText);

  console.log(`Importing ${rows.length} menu items...`);

  for (const row of rows) {
    await prisma.menu_Items.upsert({
      where: { Menu_Item_ID: row['Menu_Item_ID'] },
      update: {
        merchant_name: row['merchant_name'],
        Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
        Food_Category: row['Food_Category'],
        Item: row['Item'],
        Regular: row['Regular'],
        Medium: row['Medium'],
        Large: row['Large'],
        Platter: row['Platter'],
        Image: row['Image'],
        Description: row['Description'],
        Notes: row['Notes'],
        SKU: row['SKU'],
        Created_At: row['Created_At'],
        Updated_At: row['Updated_At'],
        Available: row['Available'],
        LastToggledAt: row['LastToggledAt'],
      },
      create: {
        Menu_Item_ID: row['Menu_Item_ID'],
        merchant_name: row['merchant_name'],
        Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
        Food_Category: row['Food_Category'],
        Item: row['Item'],
        Regular: row['Regular'],
        Medium: row['Medium'],
        Large: row['Large'],
        Platter: row['Platter'],
        Image: row['Image'],
        Description: row['Description'],
        Notes: row['Notes'],
        SKU: row['SKU'],
        Created_At: row['Created_At'],
        Updated_At: row['Updated_At'],
        Available: row['Available'],
        LastToggledAt: row['LastToggledAt'],
      },
    });
  }
  console.log('✅ Menu items imported');
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive CSV import...');

    await importUsers();
    await importMerchants();
    await importOrders();
    await importDrivers();
    await importMenuItems();
    await importComboOptions();
    await importCombos();
    await importDocuments();
    await importDeliveryZones();
    await importDriverFAQs();
    await importUserFAQs();

    console.log('\n✅ CSV import completed successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();