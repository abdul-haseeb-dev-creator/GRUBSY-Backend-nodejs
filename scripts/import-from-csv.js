
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] ? values[i].trim() : '';
    });
    return obj;
  });
  return { headers, rows };
}

async function importTable(tableName, csvPath) {
  console.log(`\n📊 Importing ${tableName}...`);

  try {
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const { headers, rows } = parseCSV(csvText);

    console.log(`Found ${rows.length} rows for ${tableName}`);

    let importedCount = 0;

    for (const row of rows) {
      try {
        // Map CSV fields to Prisma fields based on table
        let data = {};

        switch (tableName) {
          case 'Users':
            data = {
              Users_Full_Name: row['Users_Full_Name'] || row['Users Full Name'],
              Users_Email: row['Users_Email'] || row['Users Email'],
              Users_Password: row['Users_Password'] || row['Users Password'],
              Grubsy_User_ID: row['Grubsy_User_ID'] || row['Grubsy User ID'],
              Is_New_User_: row['Is_New_User?'] || row['Is New User?'],
              Users_Registered_Address: row['Users_Registered_Address'] || row['Users Registered Address'],
              Users_Registered_PostCode: row['Users_Registered_PostCode'] || row['Users Registered PostCode'],
              Users_Phone_Number: row['Users_Phone_Number'] || row['Users Phone Number'],
              Date_Of_Birth: row['Date_Of_Birth'] || row['Date Of Birth'],
              Status: row['Status'],
              Acc_Created_At: row['Acc_Created_At'] || row['Acc Created At'],
              Last_Login: row['Last_Login'] || row['Last Login'],
            };
            await prisma.users.upsert({
              where: { Grubsy_User_ID: data.Grubsy_User_ID },
              update: data,
              create: data,
            });
            break;

          case 'merchants':
            data = {
              Grubsy_Partner_ID: row['Grubsy_Partner_ID'] || row['Grubsy Partner ID'],
              Merchants_Name: row['Merchants_Name'] || row['Merchants Name'],
              Description: row['Description'],
              Cuisine: row['Cuisine'],
              Address: row['Address'],
              Area: row['Area'],
              PostCode: row['PostCode'],
              Hygiene_Rating: row['Hygiene_Rating'] || row['Hygiene Rating'],
              Opening_Times: row['Opening_Times'] || row['Opening Times'],
              Halal_Friendly: row['Halal Friendly?'] || row['Halal_Friendly'],
              Photo: row['Photo'],
              Booking_Available: row['Booking_Available'] || row['Booking Available'],
              Relation: row['Relation'],
              Active: row['Active'],
              Owner_Email: row['Owner_Email'] || row['Owner Email'],
              Created_at: row['Created_at'] || row['Created at'],
              Owners_Name: row['Owners_Name'] || row['Owners Name'],
              Owners_Number: row['Owners_Number'] || row['Owners Number'],
              Merchant_Enrolement_Status: row['Merchant_Enrolement_Status'] || row['Merchant Enrolement Status'],
              Merchant_Fee_Per_Order: row['Merchant_Fee_Per_Order'] || row['Merchant Fee Per Order'],
            };
            await prisma.merchants.upsert({
              where: { Grubsy_Partner_ID: data.Grubsy_Partner_ID },
              update: data,
              create: data,
            });
            break;

          case 'Orders':
            data = {
              Order_ID: row['Order_ID'] || row['Order ID'],
              Ordered_Items: row['Ordered_Items'] || row['Ordered Items'],
              Grubsy_User_ID: row['Grubsy_User_ID'] || row['Grubsy User ID'],
              Grubsy_Partner_ID: row['Grubsy_Partner_ID'] || row['Grubsy Partner ID'],
              Order_Date: row['Order_Date'] || row['Order Date'],
              Status: row['Status'],
              Basket_SubTotal: row['Basket_SubTotal'] || row['Basket SubTotal'],
              Service_Fee: row['Service_Fee'] || row['Service Fee'],
              Grubsy_Profit: row['Grubsy_Profit'] || row['Grubsy Profit'],
              Delivery_Fee: row['Delivery_Fee'] || row['Delivery Fee'],
              Order_Grand_Total: row['Order_Grand_Total'] || row['Order Grand Total'],
              Tips: row['Tips'],
              Delivery_Address: row['Delivery_Address'] || row['Delivery Address'],
              Delivery_Instructions: row['Delivery_Instructions'] || row['Delivery Instructions'],
              Users_Email: row['Users_Email'] || row['Users Email'],
              Driver_ID: row['Driver_ID'] || row['Driver ID'],
              SKU: row['SKU'],
              Created_At: row['Created_At'] || row['Created At'],
              Delivered_At: row['Delivered_At'] || row['Delivered At'],
              Payment_Link: row['Payment_Link'] || row['Payment Link'],
              Payment_Status: row['Payment_Status'] || row['Payment Status'],
              Stripe_Session_ID: row['Stripe_Session_ID'] || row['Stripe Session ID'],
              Users_Phone_number: row['Users_Phone_number'] || row['Users Phone number'],
              Cordinates: row['Cordinates'] || row['Cordinates'],
              Merchant_Accepted_At: row['Merchant_Accepted_At:'] || row['Merchant Accepted At:'],
              Driver_PickUp_At: row['Driver_PickUp_At:'] || row['Driver PickUp At:'],
              Merchants_Order_Images: row['Merchants_Order_Images'] || row['Merchants Order Images'],
              Drivers_Order_Images: row['Drivers_Order_Images'] || row['Drivers Order Images'],
              USer_Code_Given: row['USer_Code_Given'] || row['USer Code Given'],
            };
            await prisma.orders.upsert({
              where: { Order_ID: data.Order_ID },
              update: data,
              create: data,
            });
            break;

          // Add more cases for other tables as needed

          default:
            console.log(`Skipping ${tableName}, not implemented yet`);
            return;
        }

        importedCount++;
      } catch (error) {
        console.error(`Error importing row for ${tableName}:`, error.message);
      }
    }

    console.log(`✅ Imported ${importedCount} ${tableName} records`);
  } catch (error) {
    console.error(`❌ Error importing ${tableName}:`, error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting CSV to Prisma import...');

    const csvDir = path.join(process.cwd(), '../Grubsy CSV Data');

    // Import all tables
    await importTable('Users', path.join(csvDir, 'Grubsy Data Sheets - Users (1).csv'));
    await importTable('merchants', path.join(csvDir, 'Grubsy Data Sheets - Merchants.csv'));
    await importTable('Orders', path.join(csvDir, 'Grubsy Data Sheets - Orders.csv'));
    // Add more tables as needed

    console.log('\n✅ Import completed successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();