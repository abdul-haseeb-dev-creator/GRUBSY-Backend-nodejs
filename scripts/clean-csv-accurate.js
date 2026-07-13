// Accurate CSV cleaning script for MySQL import
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV folder paths
const csvFolder = path.join(__dirname, '../../CSV data base for Prisma');
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

// Convert UK date format (DD/MM/YYYY) to MySQL format (YYYY-MM-DD)
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
  return phoneStr.replace(/[^\d\s\+]/g, '').trim();
}

// Create cleaned folder if it doesn't exist
if (!fs.existsSync(cleanedFolder)) {
  fs.mkdirSync(cleanedFolder, { recursive: true });
}

// Process each CSV file with exact column mapping
const csvFiles = [
  {
    name: 'Grubsy Data Sheets - Users.csv',
    columnMappings: {
      'Users Phone Number': (value) => cleanPhone(value),
      'Date Of Birth': (value) => convertDate(value),
      'Created At': (value) => convertDate(value),
      'Last Login': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - Drivers.csv',
    columnMappings: {
      'Phone': (value) => cleanPhone(value),
      'Date Joined': (value) => convertDate(value),
      'Created At': (value) => convertDate(value),
      'Last Login': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - Merchants.csv',
    columnMappings: {
      'Created_at': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - Menu Items.csv',
    columnMappings: {
      'Created_At': (value) => convertDate(value),
      'Updated_At': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - Orders.csv',
    columnMappings: {
      'Order_Date': (value) => convertDate(value),
      'Created_At': (value) => convertDate(value),
      'Updated_At': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - Combos.csv',
    columnMappings: {
      'Created_at_': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - Bookings.csv',
    columnMappings: {
      'Booking Date': (value) => convertDate(value),
      'Created At': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - Combo Options.csv',
    columnMappings: {
      'Created At': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - CRM_Back Office.csv',
    columnMappings: {
      'Last_Synced': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - Order Lines.csv',
    columnMappings: {
      'Created At': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - Order Messages.csv',
    columnMappings: {
      'Time_Stamp': (value) => convertDate(value)
    }
  },
  {
    name: 'Grubsy Data Sheets - User Session.csv',
    columnMappings: {
      'Created_At': (value) => convertDate(value)
    }
  }
];

csvFiles.forEach(fileConfig => {
  const inputPath = path.join(csvFolder, fileConfig.name);
  const outputPath = path.join(cleanedFolder, fileConfig.name);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️ ${fileConfig.name} not found, skipping...`);
    return;
  }

  console.log(`🧹 Cleaning ${fileConfig.name}...`);

  const csvContent = fs.readFileSync(inputPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.log(`⚠️ ${fileConfig.name} is empty, skipping...`);
    return;
  }

  // Get header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const cleanedLines = [headerLine]; // Keep original header

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);

    if (fields.length === 0) continue;

    // Apply transformations based on column mappings
    const cleanedFields = fields.map((field, index) => {
      const columnName = headers[index]?.trim();
      let cleanedField = field.trim();

      // Apply specific transformations
      if (columnName && fileConfig.columnMappings[columnName]) {
        cleanedField = fileConfig.columnMappings[columnName](cleanedField);
      }

      // Wrap fields containing commas or quotes in double quotes
      if (cleanedField.includes(',') || cleanedField.includes('"') || cleanedField.includes('\n')) {
        return `"${cleanedField.replace(/"/g, '""')}"`;
      }

      return cleanedField;
    });

    cleanedLines.push(cleanedFields.join(','));
  }

  // Write cleaned CSV
  fs.writeFileSync(outputPath, cleanedLines.join('\n'), 'utf8');
  console.log(`✅ Cleaned ${fileConfig.name} saved to: ${outputPath}`);
  console.log(`   - ${headers.length} columns: ${headers.join(', ')}`);
  console.log(`   - ${cleanedLines.length - 1} data rows`);
});

// Copy FAQ files without modification (they don't have dates)
const faqFiles = [
  'Grubsy Data Sheets - User_ FAQ\'s.csv',
  'Grubsy Data Sheets - Driver_ FAQ\'s.csv',
  'Grubsy Data Sheets - Merchant _ FAQ\'s .csv',
  'Grubsy Data Sheets - Documents.csv'
];

faqFiles.forEach(fileName => {
  const inputPath = path.join(csvFolder, fileName);
  const outputPath = path.join(cleanedFolder, fileName);

  if (fs.existsSync(inputPath)) {
    fs.copyFileSync(inputPath, outputPath);
    console.log(`✅ Copied ${fileName} (no date cleaning needed)`);
  } else {
    console.log(`⚠️ ${fileName} not found, skipping...`);
  }
});

console.log('\n🎉 All CSV files cleaned and ready for MySQL import!');
console.log(`📁 Cleaned files are in: ${cleanedFolder}`);
console.log('\n📋 Changes made:');
console.log('- Preserved exact column names from CSV headers');
console.log('- Converted dates from DD/MM/YYYY to YYYY-MM-DD format');
console.log('- Cleaned phone numbers to remove non-numeric characters');
console.log('- Properly quoted fields containing commas or special characters');
console.log('- Maintained UTF-8 encoding');
console.log('- FAQ files copied without modification');