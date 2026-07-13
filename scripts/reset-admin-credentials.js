#!/usr/bin/env node
/**
 * Script to reset admin user credentials
 * Run this script from the GRUBSY-BACKEND-AWS-PRODUCTION directory
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminCredentials() {
  try {
    console.log('Resetting admin user credentials...');

    // New admin credentials
    const adminEmail = 'Grubsy.delivery@gmail.com';
    const adminPassword = 'QuickFix123456!'; // Strong password
    const adminName = 'Grubsy Admin';

    // Check if admin user exists
    const existingUser = await prisma.users.findUnique({
      where: { Users_Email: adminEmail },
    });

    if (existingUser) {
      // Update existing admin user
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      const updatedUser = await prisma.users.update({
        where: { Users_Email: adminEmail },
        data: {
          Users_Password: passwordHash,
          Users_Full_Name: adminName,
          Status: 'Active',
          role: 'super_admin',
        },
      });

      console.log('✅ Admin user credentials updated successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    } else {
      // Create new admin user if not exists
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      const newUser = await prisma.users.create({
        data: {
          Users_Full_Name: adminName,
          Users_Email: adminEmail,
          Users_Password: passwordHash,
          Grubsy_User_ID: `GU-${Date.now()}-ADMIN`,
          Is_New_User: 'No',
          Status: 'Active',
          Acc_Created_At: new Date().toISOString(),
          Last_Login: new Date().toISOString(),
          role: 'super_admin',
        },
      });

      console.log('✅ Admin user created successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('Grubsy User ID:', newUser.Grubsy_User_ID);
    }

  } catch (error) {
    console.error('❌ Error resetting admin user credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetAdminCredentials();
