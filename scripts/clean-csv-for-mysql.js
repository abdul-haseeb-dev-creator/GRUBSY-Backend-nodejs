// Clean CSV files for MySQL import
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV folder paths
const csvFolder = path.join(__dirname, '../../CSV data base for Prisma');
const cleanedFolder = path.join(__dirname, '../../CSV data base for Prisma/cleaned');

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

// Process each CSV file
const csvFiles = [
  'Grubsy Data Sheets - Merchants.csv',
  'Grubsy Data Sheets - Users.csv',
  'Grubsy Data Sheets - Drivers.csv',
  'Grubsy Data Sheets - Menu Items.csv',
  'Grubsy Data Sheets - Orders.csv',
  'Grubsy Data Sheets - Combos.csv',
  'Grubsy Data Sheets - Combo Options.csv',
  'Grubsy Data Sheets - Delivery Zones.csv',
  'Grubsy Data Sheets - User_ FAQ\'s.csv',
  'Grubsy Data Sheets - Driver_ FAQ\'s.csv',
  'Grubsy Data Sheets - Merchant _ FAQ\'s .csv'
];

csvFiles.forEach(fileName => {
  const inputPath = path.join(csvFolder, fileName);
  const outputPath = path.join(cleanedFolder, fileName);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️ ${fileName} not found, skipping...`);
    return;
  }

  console.log(`🧹 Cleaning ${fileName}...`);

  const csvContent = fs.readFileSync(inputPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  const cleanedLines = lines.map((line, index) => {
    const fields = parseCSVLine(line);

    // Process each field based on the file type and field position
    const cleanedFields = fields.map((field, fieldIndex) => {
      let cleanedField = field.trim();

      // Apply cleaning based on file type and field position
      if (fileName.includes('Users') && fieldIndex === 7) {
        // Users Phone Number
        cleanedField = cleanPhone(cleanedField);
      } else if (fileName.includes('Users') && fieldIndex === 8) {
        // Date Of Birth
        cleanedField = convertDate(cleanedField);
      } else if (fileName.includes('Users') && (fieldIndex === 10 || fieldIndex === 11)) {
        // Created At, Last Login
        cleanedField = convertDate(cleanedField);
      } else if (fileName.includes('Drivers') && fieldIndex === 3) {
        // Driver Phone
        cleanedField = cleanPhone(cleanedField);
      } else if (fileName.includes('Drivers') && fieldIndex === 6) {
        // Date Joined
        cleanedField = convertDate(cleanedField);
      } else if (fileName.includes('Drivers') && fieldIndex === 9) {
        // Created At
        cleanedField = convertDate(cleanedField);
      } else if (fileName.includes('Drivers') && fieldIndex === 10) {
        // Last Login
        cleanedField = convertDate(cleanedField);
      } else if (fileName.includes('Merchants') && fieldIndex === 15) {
        // Created_at
        cleanedField = convertDate(cleanedField);
      } else if (fileName.includes('Menu Items') && (fieldIndex === 13 || fieldIndex === 14)) {
        // Created_At, Updated_At
        cleanedField = convertDate(cleanedField);
      } else if (fileName.includes('Orders') && fieldIndex === 4) {
        // Order_Date
        cleanedField = convertDate(cleanedField);
      } else if (fileName.includes('Orders') && (fieldIndex === 15 || fieldIndex === 16)) {
        // Created_At, Updated_At
        cleanedField = convertDate(cleanedField);
      } else if (fileName.includes('Combos') && fieldIndex === 7) {
        // Created_at_
        cleanedField = convertDate(cleanedField);
      }

      // Wrap fields containing commas or quotes in double quotes
      if (cleanedField.includes(',') || cleanedField.includes('"') || cleanedField.includes('\n')) {
        return `"${cleanedField.replace(/"/g, '""')}"`;
      }

      return cleanedField;
    });

    return cleanedFields.join(',');
  });

  // Write cleaned CSV
  fs.writeFileSync(outputPath, cleanedLines.join('\n'), 'utf8');
  console.log(`✅ Cleaned ${fileName} saved to: ${outputPath}`);
});

console.log('\n🎉 All CSV files cleaned and ready for MySQL import!');
console.log(`📁 Cleaned files are in: ${cleanedFolder}`);
console.log('\n📋 Changes made:');
console.log('- Converted dates from DD/MM/YYYY to YYYY-MM-DD format');
console.log('- Cleaned phone numbers to remove non-numeric characters');
console.log('- Properly quoted fields containing commas or special characters');
console.log('- Maintained UTF-8 encoding');