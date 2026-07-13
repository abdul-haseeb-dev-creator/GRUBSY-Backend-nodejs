// Script to create a merchant in the database
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createMerchant() {
  try {
    // Get credentials from environment variables or use defaults
    const email = process.env.EMAIL || 'test-merchant+store@example.com';
    const password = process.env.PASSWORD || 'GrubsyTest123!';
    const partnerId = process.env.PARTNER_ID || 'Grb-4444';

    console.log('🚀 Creating merchant...');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 Partner ID: ${partnerId}`);

    // Check if merchant already exists
    const existingMerchant = await prisma.merchants.findFirst({
      where: {
        OR: [
          { Grubsy_Partner_ID: partnerId },
          { Merchants_Email: email }
        ]
      }
    });

    if (existingMerchant) {
      console.log('⚠️  Merchant already exists with this Partner ID or Email');
      console.log(`   Partner ID: ${existingMerchant.Grubsy_Partner_ID}`);
      console.log(`   Email: ${existingMerchant.Merchants_Email}`);
      console.log('   Updating password instead...');

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('✅ Password hashed successfully');

      // Update existing merchant
      const updatedMerchant = await prisma.merchants.update({
        where: { id: existingMerchant.id },
        data: {
          Merchants_Password: hashedPassword,
          Merchants_Email: email,
          Active: 'Yes'
        }
      });

      console.log('✅ Merchant password updated successfully');
      console.log(`   Merchant ID: ${updatedMerchant.id}`);
      console.log(`   Partner ID: ${updatedMerchant.Grubsy_Partner_ID}`);
      console.log(`   Email: ${updatedMerchant.Merchants_Email}`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Create new merchant
    const merchant = await prisma.merchants.create({
      data: {
        Grubsy_Partner_ID: partnerId,
        Merchants_Email: email,
        Merchants_Password: hashedPassword,
        Merchants_Name: `Test Merchant ${partnerId}`,
        Active: 'Yes',
        Created_at: new Date().toISOString(),
        Merchant_Enrolement_Status: 'Active'
      }
    });

    console.log('✅ Merchant created successfully!');
    console.log(`   Merchant ID: ${merchant.id}`);
    console.log(`   Partner ID: ${merchant.Grubsy_Partner_ID}`);
    console.log(`   Email: ${merchant.Merchants_Email}`);
    console.log(`   Name: ${merchant.Merchants_Name}`);

  } catch (error) {
    console.error('❌ Error creating merchant:', error);
    if (error.code === 'P2002') {
      console.error('   Duplicate entry: A merchant with this Partner ID or Email already exists');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createMerchant().catch(console.error);
