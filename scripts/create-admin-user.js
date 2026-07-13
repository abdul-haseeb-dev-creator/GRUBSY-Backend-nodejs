#!/usr/bin/env node
/**
 * Script to create an admin user in the database
 * Run this script from the GRUBSY-BACKEND-AWS-PRODUCTION directory
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Admin user details
    const adminEmail = 'admin@grubsy.com';
    const adminPassword = 'Admin123!'; // Strong password
    const adminName = 'Grubsy Admin';

    // Check if admin user already exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log('Admin user already exists. Skipping creation.');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUser = await prisma.adminUser.create({
      data: {
        id: `admin-${Date.now()}`,
        email: adminEmail,
        password_hash: passwordHash,
        full_name: adminName,
        role: 'super_admin',
        is_active: true,
        requires_otp: false,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Admin ID:', adminUser.id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
