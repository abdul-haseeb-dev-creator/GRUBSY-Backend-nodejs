import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseCSV(csvText, delimiter = ',') {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse headers
  const headers = parseCSVLine(lines[0], delimiter).map(h => h.trim());

  // Parse data rows
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line, delimiter);
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });

  return { headers, rows };
}

function parseCSVLine(line, delimiter = ',') {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
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

function detectDelimiter(filePath) {
  const sample = fs.readFileSync(filePath, 'utf8').slice(0, 1000);
  const tabCount = (sample.match(/\t/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

async function importTable(tableName, csvPath) {
  console.log(`\n📊 Importing ${tableName}...`);

  try {
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️  File not found: ${csvPath}`);
      return;
    }

    const delimiter = detectDelimiter(csvPath);
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const { headers, rows } = parseCSV(csvText, delimiter);

    console.log(`Found ${rows.length} rows for ${tableName}`);

    let importedCount = 0;

    for (const row of rows) {
      try {
        // Map CSV fields to Prisma fields based on table
        let data = {};

        switch (tableName) {
          case 'Basket_Table':
            data = {
              Basket_ID: row['Basket ID'] || row['Basket_ID'],
              User_Grubsy_ID: row['User Grubsy ID'] || row['User_Grubsy_ID'],
              Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
              Menu_Item_ID: row['Menu Item ID'] || row['Menu_Item_ID'],
              Quantity: row['Quantity'],
              Price: row['Price'],
              Added_At: row['Added At'] || row['Added_At'],
              Status: row['Status'],
            };
            await prisma.Basket_Table.upsert({
              where: { Basket_ID: data.Basket_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Bookings':
            data = {
              Merchant_Name: row['Merchant_Name'],
              User_Email: row['User_Email'],
              Date: row['Date'],
              Time: row['Time'],
              Guests: row['Guests'],
              Name: row['Name'],
              Phone: row['Phone'],
              Special_Requests: row['Special_Requests'],
              Grubsy_User_Id: row['Grubsy_User_Id'],
              Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
            };
            await prisma.Bookings.upsert({
              where: { id: Math.random().toString(36).substr(2, 9) }, // No unique field, use random ID
              update: {},
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Combo_Options':
            data = {
              Merchant_Name: row['Merchant_Name'],
              Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
              Combo_Name: row['Combo_Name'],
              Option_Name: row['Option_Name'],
              Option_Order: row['Option_Order'],
              Option_Items_comma_separated: row['Option Items (comma separated)'] || row['Option_Items (comma separated)'],
              Combo_Option_ID: row['Combo Option ID'] || row['Combo_Option_ID'],
              Combo_ID: row['Combo_ID'],
              Image: row['Image'],
            };
            await prisma.Combo_Options.upsert({
              where: { Combo_Option_ID: data.Combo_Option_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Combos':
            data = {
              Combo_ID: row['Combo ID'] || row['Combo_ID'],
              Combo_Name: row['Combo Name'] || row['Combo_Name'],
              Price: row['Price'],
              Description: row['Description'],
              Available_Times: row['Available Times'] || row['Available_Times'],
              Status: row['Status'],
              Created_at: row['Created at:'] || row['Created_at'],
              Grubsy_Partner_ID: row['Grubsy Partner ID'] || row['Grubsy_Partner_ID'],
              Image: row['Image'],
            };
            await prisma.combos.upsert({
              where: { Combo_ID: data.Combo_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'CRM_Back_Office':
            data = {
              CRM_ID: row['CRM_ID'],
              User_Grubsy_ID: row['User_Grubsy_ID'],
              Order_Number: row['Order_Number'],
              Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
              Status: row['Status'],
              Last_Synced: row['Last_Synced'],
              Notes: row['Notes'],
            };
            await prisma.CRM_Back_Office.upsert({
              where: { CRM_ID: data.CRM_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Delivery_Zones':
            data = {
              Zone_ID: row['Zone_ID'],
              Zone_Name: row['Zone_Name'],
              Post_Codes_Comma_Separated: row['Post Codes (Comma Separated)'] || row['Post_Codes (Comma Separated)'],
              Status: row['Status'],
              Driver_Fee_Normal_hrs: row['Driver Fee : Normal hrs'] || row['Driver_Fee:Normal_hrs'],
              Driver_Fee_Peak_Hours: row['Driver Fee: Peak Hours'] || row['Driver_Fee:Peak_Hours'],
              Peak_Hours_4pm_7pm_Active: row['Peak Hours (4pm-7pm) Active:'] || row['Peak Hours (4pm-7pm) Active'],
              Delivery_Charge: row['Delivery Charge'] || row['Delivery_Charge'],
            };
            await prisma.Delivery_Zones.upsert({
              where: { Zone_ID: data.Zone_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Documents':
            data = {
              DocumentID: row['DocumentID'],
              Code: row['Code'],
              Description: row['Description'],
              Document_Name: row['Document_Name'],
              File_URL: row['File_URL'],
              SKU: row['SKU'],
              Image_URL: row['Image_URL'],
              Comments: row['Comments'],
            };
            await prisma.documents.upsert({
              where: { DocumentID: data.DocumentID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Drivers':
            data = {
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
              Grubsy_Partner_ID: row['Grubsy Partner ID'] || row['Grubsy_Partner_ID'],
            };
            await prisma.drivers.upsert({
              where: { Driver_ID: data.Driver_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Menu_Items':
            data = {
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
            };
            await prisma.Menu_Items.upsert({
              where: { Menu_Item_ID: data.Menu_Item_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Merchants':
            data = {
              Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
              Merchants_Name: row['Merchants_Name'],
              Description: row['Description'],
              Cuisine: row['Cuisine'],
              Address: row['Address'],
              Area: row['Area'],
              PostCode: row['PostCode'],
              Hygiene_Rating: row['Hygiene_Rating'],
              Opening_Times: row['Opening_Times'],
              Halal_Friendly: row['حلال Halal Friendly?'] || row['Halal Friendly?'],
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
            };
            await prisma.Merchants.upsert({
              where: { Grubsy_Partner_ID: data.Grubsy_Partner_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Orders':
            data = {
              Order_ID: row['Order_ID'],
              Ordered_Items: row['Ordered_Items'],
              Grubsy_User_ID: row['Grubsy_User_ID'],
              Grubsy_Partner_ID: row['Grubsy_Partner_ID'],
              Order_Date: row['Order_Date'],
              Status: row['Status'],
              Basket_SubTotal: row['Basket_SubTotal'],
              Service_Fee: row['Service_Fee'],
              Delivery_Fee: row['Delivery_Fee'],
              Order_Grand_Total: row['Order_Grand_Total'],
              Tips: row['Tips'],
              Delivery_Address: row['Delivery_Address'],
              Delivery_Instructions: row['Delivery_Instructions'],
              Users_Email: row['Users_Email'],
              Driver_ID: row['Driver_ID'],
              SKU: row['SKU'],
              Created_At: row['Created_At'],
              Delivered_At: row['Delivered_At'],
              Payment_Link: row['Payment_Link'],
              Payment_Status: row['Payment_Status'],
              Stripe_Session_ID: row['Stripe_Session_ID'],
              Users_Phone_number: row['Users_Phone_number'],
              Cordinates: row['Cordinates'],
              Merchant_Accepted_At: row['Merchant_Accepted_At:'],
              Driver_PickUp_At: row['Driver_PickUp_At:'],
              Merchants_Order_Images: row['Merchants_Order_Images'],
              Drivers_Order_Images: row['Drivers_Order_Images'],
              USer_Code_Given: row['USer_Code_Given'],
            };
            await prisma.orders.upsert({
              where: { Order_ID: data.Order_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Users':
            data = {
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
            };
            await prisma.users.upsert({
              where: { Grubsy_User_ID: data.Grubsy_User_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Order_Lines':
            data = {
              Order_Line_ID: row['Order_Line_ID'],
              Order_ID: row['Order_ID'],
              Menu_Item_ID: row['Menu_Item_ID'],
              Quantity: row['Quantity'],
              Price: row['Price'],
              Subtotal: row['Subtotal'],
            };
            await prisma.Order_Lines.upsert({
              where: { Order_Line_ID: data.Order_Line_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Order_Messages':
            data = {
              Message_ID: row['Message_ID'],
              Order_Number: row['Order_Number'],
              User_Email: row['User_Email'],
              Message: row['Message'],
              Time_Stamp: row['Time_Stamp'],
              Status: row['Status'],
              User_ID: row['User_ID'],
            };
            await prisma.Order_Messages.upsert({
              where: { Message_ID: data.Message_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'Merchant_FAQ_s':
            data = {
              Question: row['Question'],
              Answer: row['Answer'],
            };
            await prisma.Merchant_FAQ_s.upsert({
              where: { Question: data.Question },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'User_FAQ_s':
            data = {
              Question: row['Question'],
              SKU: row['SKU'],
              Answer: row['Answer'],
            };
            await prisma.User_FAQ_s.upsert({
              where: { Question: data.Question },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

          case 'User_Session':
            data = {
              Session_ID: row['Session_ID'],
              Grubsy_User_ID: row['Grubsy_User_ID'],
              Manual_Location: row['Manual_Location'],
              Search_Location: row['Search_Location'],
              Basket_Subtotal: row['Basket_Subtotal'],
              Fee: row['Fee'],
              Order_Grand_Total: row['Order_Grand_Total'],
              Cuisines_of_Grubsy: row['Cuisines_of_Grubsy'],
              Created_At: row['Created_At'],
            };
            await prisma.User_Session.upsert({
              where: { Session_ID: data.Session_ID },
              update: data,
              create: { ...data, id: Math.random().toString(36).substr(2, 9) },
            });
            break;

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
    console.log('🚀 Starting comprehensive CSV to Prisma import...');

    const csvDir = path.join(process.cwd(), '../Grubsy CSV Data');

    // Import all tables in dependency order
    await importTable('Users', path.join(csvDir, 'Grubsy Data Sheets - Users (1).csv'));
    await importTable('Merchants', path.join(csvDir, 'Grubsy Data Sheets - Merchants.csv'));
    await importTable('Drivers', path.join(csvDir, 'Grubsy Data Sheets - Drivers.csv'));
    await importTable('Menu_Items', path.join(csvDir, 'Grubsy Data Sheets - Menu Items.csv'));
    await importTable('Orders', path.join(csvDir, 'Grubsy Data Sheets - Orders.csv'));
    await importTable('Basket_Table', path.join(csvDir, 'Grubsy Data Sheets - Basket_Table.csv'));
    await importTable('Bookings', path.join(csvDir, 'Grubsy Data Sheets - Bookings.csv'));
    await importTable('Combo_Options', path.join(csvDir, 'Grubsy Data Sheets - Combo Options.csv'));
    await importTable('Combos', path.join(csvDir, 'Grubsy Data Sheets - Combos.csv'));
    await importTable('CRM_Back_Office', path.join(csvDir, 'Grubsy Data Sheets - CRM_Back Office.tsv'));
    await importTable('Delivery_Zones', path.join(csvDir, 'Grubsy Data Sheets - Delivery Zones.csv'));
    await importTable('Documents', path.join(csvDir, 'Grubsy Data Sheets - Documents.csv'));
    await importTable('Order_Lines', path.join(csvDir, 'Grubsy Data Sheets - Order_Lines.csv'));
    await importTable('Order_Messages', path.join(csvDir, 'Grubsy Data Sheets - Order_Messages.tsv'));
    await importTable('User_Session', path.join(csvDir, 'Grubsy Data Sheets - User_Session.csv'));

    console.log('\n✅ All CSV data imported successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();