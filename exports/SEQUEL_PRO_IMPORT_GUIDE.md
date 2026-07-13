# Manual Data Import Guide for Sequel Pro

## 🔐 MySQL Connection Details

**Use these exact credentials in Sequel Pro:**

- **Host**: `127.0.0.1`
- **Username**: `grubsy`
- **Password**: `grubsy_pass`
- **Database**: `grubsy`
- **Port**: `3306`

*Alternative: Use `root` with your computer password if the above doesn't work*

## 📋 Step-by-Step Import Process

### Step 1: Connect to Database
1. Open Sequel Pro
2. Create new connection with the credentials above
3. Select the `grubsy` database

### Step 2: Import the SQL File
1. In Sequel Pro, go to **File** → **Import**
2. Select the file: `Grubsy-Backend/exports/establishments-for-sequel-pro.sql`
3. Click **Import**

This will:
- Clear existing Orders and Establishments data
- Insert 4 establishments with proper addresses
- Insert 4 test orders (3 PENDING, 1 ACCEPTED)

### Step 3: Verify Data Import
After import, check these tables have data:

**Establishments Table:**
- G-0001: La Damas (277a High Street, Slough, Berkshire, SL1 1BN)
- G-0002: Big Boys Kitchen (73 Grays Rd, Slough SL1 3QG)
- G-0003: Dodgers Dubai Droids (242 Clewer Hill Rd, Windsor, SL4 4BW)
- g-0004: Edens Eggs (54 elm road , SL$ 3ND)

**Orders Table:**
- 3 orders with Status = 'PENDING' and Driver_ID = NULL
- 1 order with Status = 'ACCEPTED' and Driver_ID = 'GD-001'

### Step 4: Test the Driver App
After importing:
1. Restart your backend server
2. Test the driver app
3. Available orders should show proper restaurant names and addresses
4. Order acceptance should work properly

## 🚨 Troubleshooting

**If connection fails:**
- Try using `localhost` instead of `127.0.0.1`
- Try using `root` user with your computer password
- Make sure MySQL is running: `brew services start mysql`

**If import fails:**
- Make sure you're connected to the `grubsy` database
- Check that all tables exist (run Prisma migration if needed)
- Try importing one INSERT statement at a time

## 🔄 Alternative: Manual Row Entry

If SQL import doesn't work, you can manually add rows:

**Establishments Table - Add these rows:**
```
id: est1, Grubsy Partner ID: G-0001, Establishment Name: La Damas, Address: 277a High Street, Slough, Berkshire, SL1 1BN
id: est2, Grubsy Partner ID: G-0002, Establishment Name: Big Boys Kitchen, Address: 73 Grays Rd, Slough SL1 3QG  
id: est3, Grubsy Partner ID: G-0003, Establishment Name: Dodgers Dubai Droids, Address: 242 Clewer Hill Rd, Windsor, SL4 4BW
id: est4, Grubsy Partner ID: g-0004, Establishment Name: Edens Eggs, Address: 54 elm road , SL$ 3ND
```

**Orders Table - Add these rows:**
```
Order ID: cmes0nd620007sb3zkggk1h1t, Status: PENDING, Grubsy Partner ID: G-0001, Driver ID: NULL
Order ID: cmes0nd620008sb3zkggk1h2t, Status: PENDING, Grubsy Partner ID: G-0002, Driver ID: NULL
Order ID: cmes0nd620009sb3zkggk1h3t, Status: PENDING, Grubsy Partner ID: G-0003, Driver ID: NULL
Order ID: cmes0nd620010sb3zkggk1h4t, Status: ACCEPTED, Grubsy Partner ID: g-0004, Driver ID: GD-001
```

This should resolve the order service issues completely!