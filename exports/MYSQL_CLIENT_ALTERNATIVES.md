# MySQL Client Alternatives for macOS

## 🔍 **Recommended MySQL Clients from App Store**

### **1. TablePlus** (Recommended)
- **App Store**: Search "TablePlus"
- **Price**: Free with limitations, paid version available
- **Compatibility**: Excellent with modern MySQL versions
- **Connection**: Use the same credentials as below

### **2. MySQL Workbench** (Free)
- **Download**: https://dev.mysql.com/downloads/workbench/
- **Price**: Free
- **Compatibility**: Official MySQL client, fully compatible

### **3. Navicat for MySQL**
- **App Store**: Search "Navicat for MySQL"
- **Price**: Paid, but has free trial
- **Compatibility**: Excellent

### **4. DBngin** (Free)
- **App Store**: Search "DBngin"
- **Price**: Free
- **Features**: Database management with GUI

## 🔐 **Connection Details for Any Client**

Use these exact credentials:
- **Host**: `127.0.0.1` or `localhost`
- **Port**: `3306`
- **Username**: `grubsy`
- **Password**: `grubsy_pass`
- **Database**: `grubsy`

## 📁 **Files Ready for Import**

I've prepared these files for you:
1. **SQL File**: `Grubsy-Backend/exports/establishments-for-sequel-pro.sql`
2. **Step-by-step Guide**: `Grubsy-Backend/exports/SEQUEL_PRO_IMPORT_GUIDE.md`

## 🚀 **Quick Import Steps (Any Client)**

1. **Connect** using credentials above
2. **Select** the `grubsy` database
3. **Import/Execute** the SQL file: `establishments-for-sequel-pro.sql`
4. **Verify** data was imported correctly
5. **Restart** your backend server
6. **Test** the driver app

## ⚡ **Alternative: Command Line Import**

If GUI clients don't work, you can always use terminal:
```bash
cd Grubsy-Backend
mysql -u grubsy -pgrubsy_pass grubsy < exports/establishments-for-sequel-pro.sql
```

This will import all the data directly without needing a GUI client.

## 🎯 **What Gets Imported**

- **4 Establishments** with proper addresses
- **4 Test Orders** (3 PENDING, 1 ACCEPTED)
- **Proper relationships** between users, establishments, and orders

After import, your driver app should show:
- ✅ Correct restaurant names (no more "Restaurant Unknown")
- ✅ All addresses populated for navigation
- ✅ Order acceptance working properly