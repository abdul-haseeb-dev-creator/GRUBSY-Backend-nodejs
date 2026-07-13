-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: grubsy-db.c90wkau0i7vk.eu-west-2.rds.amazonaws.com    Database: grubsy
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `Basket_Table`
--

DROP TABLE IF EXISTS `Basket_Table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Basket_Table` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Basket ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `User Grubsy ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Grubsy_Partner_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Menu_Item_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Quantity` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Price` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Added_At` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Basket_Table_Basket ID_key` (`Basket ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Basket_Table`
--

LOCK TABLES `Basket_Table` WRITE;
/*!40000 ALTER TABLE `Basket_Table` DISABLE KEYS */;
/*!40000 ALTER TABLE `Basket_Table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Bookings`
--

DROP TABLE IF EXISTS `Bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Bookings` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Merchant_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `User_Email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Date` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Time` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Guests` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Special_Requests` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_User_Id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_Partner_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Bookings`
--

LOCK TABLES `Bookings` WRITE;
/*!40000 ALTER TABLE `Bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `Bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CRM/Back Office`
--

DROP TABLE IF EXISTS `CRM/Back Office`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CRM/Back Office` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CRM_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `User_Grubsy_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Order_Number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_Partner_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Last_Synced` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Notes` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CRM/Back Office_CRM_ID_key` (`CRM_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CRM/Back Office`
--

LOCK TABLES `CRM/Back Office` WRITE;
/*!40000 ALTER TABLE `CRM/Back Office` DISABLE KEYS */;
/*!40000 ALTER TABLE `CRM/Back Office` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Combo_Options`
--

DROP TABLE IF EXISTS `Combo_Options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Combo_Options` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Merchant_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_Partner_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Combo_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Option_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Option_Order` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Option_Items (comma separated)` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Combo_Option_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Combo_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Image` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Combo_Options_Combo_Option_ID_key` (`Combo_Option_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Combo_Options`
--

LOCK TABLES `Combo_Options` WRITE;
/*!40000 ALTER TABLE `Combo_Options` DISABLE KEYS */;
INSERT INTO `Combo_Options` VALUES ('cmf8tn102002esbz1gxsrrvo2','Le Damas','Grb-0001','Lunchtime Special','Extra','4','Salad, Batata Harra, Mixed Pickles, Bread','','','');
/*!40000 ALTER TABLE `Combo_Options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Combos`
--

DROP TABLE IF EXISTS `Combos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Combos` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Combo_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Merchant_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Combo_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Price` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Available_Times` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Created_at:` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_Partner_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Image` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Free_Sauces` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Free_Sides` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Special_Instructions_Allowed` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Combos_Combo_ID_key` (`Combo_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Combos`
--

LOCK TABLES `Combos` WRITE;
/*!40000 ALTER TABLE `Combos` DISABLE KEYS */;
INSERT INTO `Combos` VALUES ('cmf8tn10d002isbz1qjdkr51q','c-1001','Le Damas','Lunchtime Special','5.99','Build your own lunch combo','11AM-3PM','','','Grb-0001','',NULL,NULL,1);
/*!40000 ALTER TABLE `Combos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Delivery Zones`
--

DROP TABLE IF EXISTS `Delivery Zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Delivery Zones` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Zone_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Zone_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Post_Codes (Comma Separated)` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Driver_Fee:Normal_hrs` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Driver_Fee:Peak_Hours` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Peak Hours (4pm-7pm) Active:` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Delivery_Charge` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Delivery Zones_Zone_ID_key` (`Zone_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Delivery Zones`
--

LOCK TABLES `Delivery Zones` WRITE;
/*!40000 ALTER TABLE `Delivery Zones` DISABLE KEYS */;
INSERT INTO `Delivery Zones` VALUES ('cmf8tn10p002ksbz1n5hfif21','Z-001','Zone 1','SL1, SL2','Active','£3:15','£3:50','FALSE','£3.15');
/*!40000 ALTER TABLE `Delivery Zones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DeviceToken`
--

DROP TABLE IF EXISTS `DeviceToken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DeviceToken` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `driverId` varchar(191) DEFAULT NULL,
  `token` varchar(191) NOT NULL,
  `platform` varchar(191) NOT NULL,
  `deviceId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `DeviceToken_token_key` (`token`),
  KEY `DeviceToken_userId_idx` (`userId`),
  KEY `DeviceToken_driverId_idx` (`driverId`),
  CONSTRAINT `devicetoken_chk_1` CHECK ((`platform` in (_utf8mb4'android',_utf8mb4'ios')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DeviceToken`
--

LOCK TABLES `DeviceToken` WRITE;
/*!40000 ALTER TABLE `DeviceToken` DISABLE KEYS */;
/*!40000 ALTER TABLE `DeviceToken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Documents`
--

DROP TABLE IF EXISTS `Documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Documents` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `DocumentID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Document_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `File_URL` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SKU` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Image_URL` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Comments` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Documents_DocumentID_key` (`DocumentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Documents`
--

LOCK TABLES `Documents` WRITE;
/*!40000 ALTER TABLE `Documents` DISABLE KEYS */;
INSERT INTO `Documents` VALUES ('cmf8tn10k002jsbz13azyleli','DOC-001','Doc001','Restaurant guidelines for receiving and preparing customer orders.','Order Processing Guide','http://example.com/files/restguide.pdf','FUS-01','https://...','A must-read for restaurant staff.');
/*!40000 ALTER TABLE `Documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Driver : FAQ's`
--

DROP TABLE IF EXISTS `Driver : FAQ's`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Driver : FAQ's` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Question` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Driver : FAQ's_Question_key` (`Question`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Driver : FAQ's`
--

LOCK TABLES `Driver : FAQ's` WRITE;
/*!40000 ALTER TABLE `Driver : FAQ's` DISABLE KEYS */;
INSERT INTO `Driver : FAQ's` VALUES ('cmf8tn10u002lsbz1cxa88ox1','How do I sign up to become a Grubsy driver?','Complete our online application at grubsy.com/drivers, pass background checks, and attend a virtual onboarding session. You\'ll need a valid UK driving licence and appropriate insurance.'),('cmf8tn10x002msbz1a25rdhbp','When will I receive orders?','Orders appear automatically when you\'re online in driver mode. Busiest times are weekdays 11am-2pm and 5pm-9pm, plus weekends.'),('cmf8tn10z002nsbz1pooifmx2','How are orders assigned to me?','Our AI system assigns orders based on your proximity to the restaurant, delivery destination, and current workload. Closest available driver gets priority.'),('cmf8tn110002osbz1q2dn0n3w','What if I can\'t accept an order?','Simply tap \"Reject Order\". Avoid frequent rejections as it may affect your driver rating. If unavailable, toggle offline mode.'),('cmf8tn112002psbz1ucb8bvec','How do I navigate to pickup/dropoff?','Use the in-app navigation (Google Maps integration). For alternative navigation apps, tap \"Open in...\" after starting delivery.'),('cmf8tn115002qsbz13n4lbq04','What should I do at the restaurant?','1. Confirm arrival via app 2. Show order ID to staff 3. Verify all items are packed 4. Check for drinks/special requests 5. Mark as collected'),('cmf8tn117002rsbz1tz4n7iao','Can I see the delivery details before accepting?','Yes! You\'ll see restaurant location, dropoff address, estimated distance, and earnings before accepting any order.'),('cmf8tn118002ssbz1ir5bkdth','How are my earnings calculated?','Base fee + distance pay + time pay + promotions. Minimum £3.50 per delivery. View breakdown in Earnings section after each trip.'),('cmf8tn11a002tsbz1o2sp6wb4','When do I get paid?','Weekly payments every Tuesday via bank transfer. Instant Cashout available (small fee applies) for balances over £15.'),('cmf8tn11c002usbz1bn72shi4','What if the customer isn\'t available?','1. Call through the app 2. Wait 5 minutes 3. Follow \"Can\'t Complete\" steps 4. Leave in secure location if permitted'),('cmf8tn11e002vsbz1i7nea11u','How do I handle damaged/missing items?','Never open sealed bags. If issue reported, support will contact you. Your responsibility ends after proper handoff.'),('cmf8tn11f002wsbz1vmo8urya','What are the vehicle requirements?','Any reliable vehicle (car, motorbike, bicycle, e-scooter). Cars must be insured for food delivery. No commercial plates required.'),('cmf8tn11h002xsbz1ch27fuj3','Can I schedule shifts in advance?','Yes! Use the \"Schedule\" tab to book preferred time slots 7 days in advance. Scheduled drivers receive priority orders.'),('cmf8tn11i002ysbz1h1sun37h','How do I report parking issues?','Use the \"Report Issue\" button during pickup/dropoff. We\'ll add waiting time pay if delayed over 5 minutes due to parking.'),('cmf8tn11k002zsbz11wh73nic','What safety features are available?','1. Emergency SOS button 2. Share trip status 3. Anonymous caller ID 4. 24/7 support 5. Incident reporting'),('cmf8tn11l0030sbz1iq1bsvtz','Why was my account deactivated?','Common reasons: low acceptance rate (<85%), multiple customer complaints, late deliveries, or policy violations. Check email for details.'),('cmf8tn11n0031sbz1ew2sza6q','How do I contact support?','In-app: Help Centre > Contact Support. Phone: 0808 169 4321 (24/7). For emergencies, use SOS button.'),('cmf8tn11o0032sbz1meqglkml','Can I change my vehicle details?','Yes! Profile > Vehicle Information > Update. Submit new insurance/docs if changing vehicle type.'),('cmf8tn11q0033sbz1vu2k0zll','How are tips handled?','100% of tips go to you! Added to weekly earnings. Customers can tip pre-delivery (app) or post-delivery (cash).'),('cmf8tn11r0034sbz1rzhsgwhw','What should I do with cancelled orders?','If cancelled after pickup: 1. Do NOT deliver 2. Return to restaurant if requested 3. You\'ll receive partial payment'),('cmf8tn11t0035sbz1cosybe69','How do I handle dietary-specific orders?','Never check order contents. Allergen orders have red \"⚠️\" icon - maintain separation from other deliveries.'),('cmf8tn11u0036sbz1v20yn2d9','What if the app crashes during delivery?','1. Restart app 2. If unresolved, call support 3. Continue delivery if you know address 4. Document with photos.'),('cmf8tn11w0037sbz12yxvslvb','How can I improve my driver rating?','1. Use thermal bags 2. Verify orders 3. Communicate delays 4. Follow delivery instructions 5. Maintain professional appearance');
/*!40000 ALTER TABLE `Driver : FAQ's` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FAQ's : Establishment`
--

DROP TABLE IF EXISTS `FAQ's : Establishment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FAQ's : Establishment` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Question` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `FAQ's : Establishment_Question_key` (`Question`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FAQ's : Establishment`
--

LOCK TABLES `FAQ's : Establishment` WRITE;
/*!40000 ALTER TABLE `FAQ's : Establishment` DISABLE KEYS */;
/*!40000 ALTER TABLE `FAQ's : Establishment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Menu_Items`
--

DROP TABLE IF EXISTS `Menu_Items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Menu_Items` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Menu_Item_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `merchant_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_Partner_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Food_Category` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Item` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Regular` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Medium` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Large` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Platter` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Image` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `Notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `SKU` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Created_At` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Updated_At` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Available` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LastToggledAt` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Promotion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `Free_Sauces` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Free_Sides` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Special_Instructions_Allowed` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Menu_Items_Menu_Item_ID_key` (`Menu_Item_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Menu_Items`
--

LOCK TABLES `Menu_Items` WRITE;
/*!40000 ALTER TABLE `Menu_Items` DISABLE KEYS */;
INSERT INTO `Menu_Items` VALUES ('cmf8tn0qz000esbz1pgt0r1ur','GMI-00001','Le Damas','Grb-0001','Wraps','Lamb Doner','£4.99','','£6.99','','Image','does what it says on the tin mate.','','SKU-001','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0uk000fsbz18vza6f8k','GMI-00002','Le Damas','Grb-0001','Wraps','Chicken Shawarma','£4.99','','£6.99','','Image','does what it says on the tin mate.','','SKU-002','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0up000gsbz18f3c5vir','GMI-00003','Le Damas','Grb-0001','Wraps','Lamb Shawarma','£6.99','','£8.99','','Image','does what it says on the tin mate.','','SKU-003','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0uu000hsbz1t7g3tqtm','GMI-00004','Le Damas','Grb-0001','Wraps','Mixed Shawarma / Doner','£5.99','','£8.99','','Image','does what it says on the tin mate.','','SKU-004','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0uy000isbz15a14lvbz','GMI-00005','Le Damas','Grb-0001','Wraps','Chicken Shish','£6.49','','£8.49','','Image','does what it says on the tin mate.','','SKU-005','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0v3000jsbz1iy0fn1k6','GMI-00006','Le Damas','Grb-0001','Wraps','Lamb Shish','£6.99','','£9.99','','Image','does what it says on the tin mate.','','SKU-006','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0v9000ksbz1y5l8csgf','GMI-00007','Le Damas','Grb-0001','Wraps','Kofta Shish','£6.99','','£9.99','','Image','does what it says on the tin mate.','','SKU-007','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0vc000lsbz1x1iq30cy','GMI-00008','Le Damas','Grb-0001','Wraps','Mixed Shish (2 Skewers)','£6.99','','£9.99','','Image','does what it says on the tin mate.','','SKU-008','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0vf000msbz12rtqloxs','GMI-00009','Le Damas','Grb-0001','Wraps','Falafel (Ve)','£4.49','','£6.99','','Image','does what it says on the tin mate.','','SKU-009','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0vl000nsbz14kg9ui3o','GMI-00010','Le Damas','Grb-0001','Wraps','Halloumi (V)','£5.99','','£7.99','','Image','does what it says on the tin mate.','','SKU-010','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0vq000osbz1iu0fbv3t','GMI-00011','Le Damas','Grb-0001','Wraps','Faloumi (V)','£6.49','','£8.49','','Image','does what it says on the tin mate.','','SKU-011','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0vt000psbz16qnqeh9u','GMI-00012','Le Damas','Grb-0001','Platters','Lamb Doner','','','','£10.99','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-012','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0vy000qsbz19jo9inas','GMI-00013','Le Damas','Grb-0001','Platters','Chicken Shawarma','','','','£10.99','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-013','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0w3000rsbz1w942ppf7','GMI-00014','Le Damas','Grb-0001','Platters','Lamb Shawarma','','','','£12.99','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-014','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0w7000ssbz1652gd0dd','GMI-00015','Le Damas','Grb-0001','Platters','Mixed Shawarma / Doner','','','','£12.49','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-015','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0w9000tsbz1l5dbnl9x','GMI-00016','Le Damas','Grb-0001','Platters','Chicken Shish','','','','£11.99','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-016','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0wc000usbz157ka3czv','GMI-00017','Le Damas','Grb-0001','Platters','Lamb Shish','','','','£13.99','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-017','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0we000vsbz1cnudkv2a','GMI-00018','Le Damas','Grb-0001','Platters','Kofta Shish','','','','£13.99','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-018','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0wh000wsbz1qxwlte2s','GMI-00019','Le Damas','Grb-0001','Platters','Mixed Shish (2 Skewers)','','','','£13.99','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-019','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0wl000xsbz11so024ri','GMI-00020','Le Damas','Grb-0001','Platters','Falafel (Ve)','','','','£9.99','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-020','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0wn000ysbz1z4n7j5dz','GMI-00021','Le Damas','Grb-0001','Platters','Halloumi (V)','','','','£10.99','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-021','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0wp000zsbz1udamddun','GMI-00022','Le Damas','Grb-0001','Platters','Faloumi (V)','','','','£11.49','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-022','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0wr0010sbz16eido4kq','GMI-00023','Le Damas','Grb-0001','Le Damas Special','Le Damas Special','£10.99','','','','Image','does what it says on the tin mate.','A toasted chicken shawarma served with a side of our signature garlic sauce, fresh tomatoes, pickles and chips.','SKU-023','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0wt0011sbz1uzoghjh1','GMI-00024','Le Damas','Grb-0001','Meat & Chips','Lamb Doner Meat & Chips','£6.99','','','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-024','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0ww0012sbz1hykqr47d','GMI-00025','Le Damas','Grb-0001','Meat & Chips','Chicken Shawarma Meat & Chips','£6.99','','','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-025','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0wy0013sbz12el7imkr','GMI-00026','Le Damas','Grb-0001','Meat & Chips','Lamb Shawarma Meat & Chips','£8.99','','','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-026','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0x10014sbz1oi9lti72','GMI-00027','Le Damas','Grb-0001','Meat & Chips','Mixed Doner/Shawarma Meat & Chips','£8.49','','','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-027','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0x30015sbz1sc0r9i1v','GMI-00028','Le Damas','Grb-0001','Grill & Rotisserie','Half Chicken','£5.49','','£9.49','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-028','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0x50016sbz1975k71bt','GMI-00029','Le Damas','Grb-0001','Grill & Rotisserie','Whole Chicken','£7.99','','£12.99','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-029','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0x70017sbz1f2gmtljp','GMI-00030','Le Damas','Grb-0001','Grill & Rotisserie','Lamb Chops x3','£7.99','','£11.99','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-030','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xa0018sbz1uz324hyy','GMI-00031','Le Damas','Grb-0001','Grill & Rotisserie','Chicken Wings x4','£5.99','','£9.99','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-031','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xc0019sbz1bj7nk22f','GMI-00032','Le Damas','Grb-0001','Grill & Rotisserie','Sea Bass','£7.99','','£11.99','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-032','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xf001asbz1bqp83pst','GMI-00033','Le Damas','Grb-0001','Grill & Rotisserie','King Prawns','£9.99','','£12.99','','Image','does what it says on the tin mate.','All platters are served with sauce, salad, mezze dip, bread, and a choice of regular side.','SKU-033','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xh001bsbz1zefuoonj','GMI-00034','Le Damas','Grb-0001','Mixed Grills (1 Person)','Mixed Grill','','','','£13.99','Image','2 x Choice of Skewers, 1 x Lamb Chop, 1 x Chicken Wings, 1 x Mixed Veg Skewer, 1 x Regular Side, 1 x Meze Dip, 1 x Salad','','SKU-034','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xj001csbz1fgbxedzd','GMI-00035','Le Damas','Grb-0001','Mixed Grills (2 People)','Mixed Grill','','','','£26.99','Image','4 x Choice of Skewers, 2 x Lamb Chops, 2 x Chicken Wings, 2 x Mixed Veg Skewer, 2 x Regular Sides, 2 x Meze Dip, 1 x Large Salad','','SKU-035','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xl001dsbz1k7sye1wg','GMI-00036','Le Damas','Grb-0001','Mixed Grills (4 People)','Mixed Grill','','','','£69.99','Image','8 x Choice of Skewers, 4 x Lamb Chops, 4 x Chicken Wings, 3 x Mixed Veg Skewer, 4 x Regular Sides, 3 x Meze Dip, 1 x Large Salad','','SKU-036','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xn001esbz1ypc2191y','GMI-00037','Le Damas','Grb-0001','Lunchtime Special','Lunchtime Special','£5.99','','','','Image','does what it says on the tin mate.','11AM-3PM - Choose one from each option: Option 1: Lamb Doner, Chicken Shawarma, Chicken Wings, Faloumi Option 2: Houmous, Chilli Houmous, Baba Ghanouj, Jujeck Option 3: Chips, Aromatic Rice, Vegetable Rice, Burghul Option 4: Salad, Batata Harra, Mixed Pickles, Bread','SKU-037','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xp001fsbz1rilctt0e','GMI-00038','Le Damas','Grb-0001','Family Meal Deal','Family Meal Deal','£49.99','','','','Image','does what it says on the tin mate.','Includes: Whole Chicken, Half Kg of Mixed Shawarma, Choice of 4x Skewers, 8x Chicken Wings, Choice of 4x Sides, 8x Falafel, Salad, Houmous, Bread & Sauces, Large Bottle of Drink','SKU-038','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xr001gsbz1m9aczrx0','GMI-00039','Le Damas','Grb-0001','Mezze','Houmous (Ve)','£3.99','','','','Image','does what it says on the tin mate.','','SKU-039','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xv001hsbz10h7778gc','GMI-00040','Le Damas','Grb-0001','Mezze','Chilli Houmous (Ve)','£4.49','','','','Image','does what it says on the tin mate.','','SKU-040','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0xx001isbz1n55s2hoi','GMI-00041','Le Damas','Grb-0001','Mezze','Baba Ghanouj (Ve)','£4.99','','','','Image','does what it says on the tin mate.','','SKU-041','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0y0001jsbz1wc72n57l','GMI-00042','Le Damas','Grb-0001','Mezze','Jujeck (V)','£4.99','','','','Image','does what it says on the tin mate.','','SKU-042','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0y2001ksbz186zfkxpy','GMI-00043','Le Damas','Grb-0001','Mezze','Falafel (Ve)','£3.99','','','','Image','does what it says on the tin mate.','','SKU-043','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0y4001lsbz1n034im5h','GMI-00044','Le Damas','Grb-0001','Mezze','Halloumi (V)','£5.99','','','','Image','does what it says on the tin mate.','','SKU-044','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0y6001msbz1ofqyk57l','GMI-00045','Le Damas','Grb-0001','Mezze','Batata Harra (Ve)','£3.49','','','','Image','does what it says on the tin mate.','','SKU-045','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0y9001nsbz1nbkrsi0d','GMI-00046','Le Damas','Grb-0001','Mezze','Onion Rings (V)','£3.49','','','','Image','does what it says on the tin mate.','','SKU-046','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yc001osbz1ima3wo67','GMI-00047','Le Damas','Grb-0001','Mezze','Lentil Soup (Ve)','£3.49','','','','Image','does what it says on the tin mate.','','SKU-047','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yf001psbz1uj2akekb','GMI-00048','Le Damas','Grb-0001','Gourmet Burgers','6oz Beef','£6.49','','£8.49','','Image','does what it says on the tin mate.','Add regular chips for £2 only.','SKU-048','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yh001qsbz13x79c6gi','GMI-00049','Le Damas','Grb-0001','Gourmet Burgers','6oz Lamb','£7.49','','£9.49','','Image','does what it says on the tin mate.','Add regular chips for £2 only.','SKU-049','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yj001rsbz1owtzgy4a','GMI-00050','Le Damas','Grb-0001','Gourmet Burgers','Chicken Fillet','£6.49','','£8.49','','Image','does what it says on the tin mate.','Add regular chips for £2 only.','SKU-050','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yl001ssbz15r7h81xt','GMI-00051','Le Damas','Grb-0001','Gourmet Burgers','Veggie','£4.49','','£6.49','','Image','does what it says on the tin mate.','Add regular chips for £2 only.','SKU-051','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yn001tsbz1zwas7tjq','GMI-00052','Le Damas','Grb-0001','Sides','Chips','£2.29','','£3.29','','Image','does what it says on the tin mate.','','SKU-052','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yr001usbz1pbbm975y','GMI-00053','Le Damas','Grb-0001','Sides','House Chips','£2.99','','£3.99','','Image','does what it says on the tin mate.','','SKU-053','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yu001vsbz1b931fmum','GMI-00054','Le Damas','Grb-0001','Sides','Cheesy Chips','£3.49','','£4.49','','Image','does what it says on the tin mate.','','SKU-054','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yw001wsbz1qhswridj','GMI-00055','Le Damas','Grb-0001','Sides','Aromatic Rice','£3.29','','£4.29','','Image','does what it says on the tin mate.','','SKU-055','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0yy001xsbz14bevhyrf','GMI-00056','Le Damas','Grb-0001','Sides','Vegetable Rice','£3.49','','£4.49','','Image','does what it says on the tin mate.','','SKU-056','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0z0001ysbz1ih2n5g9x','GMI-00057','Le Damas','Grb-0001','Sides','Burghul','£3.49','','£4.49','','Image','does what it says on the tin mate.','','SKU-057','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0z3001zsbz1l1fpsiy9','GMI-00058','Le Damas','Grb-0001','Extras','Just Falafel x6','£2.99','','','','Image','does what it says on the tin mate.','','SKU-058','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0z50020sbz1229qyset','GMI-00059','Le Damas','Grb-0001','Extras','Mixed Salad','£3.49','','','','Image','does what it says on the tin mate.','','SKU-059','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0z70021sbz1vcichx81','GMI-00060','Le Damas','Grb-0001','Extras','Mixed Pickles','£2.99','','','','Image','does what it says on the tin mate.','','SKU-060','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0z90022sbz1sqhi8fzz','GMI-00061','Le Damas','Grb-0001','Extras','Bread','£0.99','','','','Image','does what it says on the tin mate.','','SKU-061','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zc0023sbz1msgiiard','GMI-00062','Le Damas','Grb-0001','Extras','Sauce Tub','£1.89','','','','Image','does what it says on the tin mate.','','SKU-062','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0ze0024sbz1nbxio401','GMI-00063','Le Damas','Grb-0001','Extras','Sauce Dip','£0.49','','','','Image','does what it says on the tin mate.','','SKU-063','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zf0025sbz1ayossrnf','GMI-00064','Le Damas','Grb-0001','Kids Meals','Chicken Nuggets & Chips','£4.99','','','','Image','does what it says on the tin mate.','All kids meals include a free kids drink.','SKU-064','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zh0026sbz1ir29rvt7','GMI-00065','Le Damas','Grb-0001','Kids Meals','Chicken Steak Burger & Chips','£4.99','','','','Image','does what it says on the tin mate.','All kids meals include a free kids drink.','SKU-065','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zj0027sbz1zttgn2xs','GMI-00066','Le Damas','Grb-0001','Kids Meals','Cheeseburger & Chips','£4.99','','','','Image','does what it says on the tin mate.','All kids meals include a free kids drink.','SKU-066','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zn0028sbz1qlhaax5d','GMI-00067','Le Damas','Grb-0001','Kids Meals','Mini Shawarma & Chips','£4.99','','','','Image','does what it says on the tin mate.','All kids meals include a free kids drink.','SKU-067','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zq0029sbz1hglp3pyq','GMI-00068','Le Damas','Grb-0001','Desserts','Assorted Baklawa','£5.99','','','','Image','does what it says on the tin mate.','Add regular chips for £2 only.','SKU-068','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zs002asbz1vdxezyqk','GMI-00069','Le Damas','Grb-0001','Cold Drinks','Can','£1.49','','','','Image','does what it says on the tin mate.','Add regular chips for £2 only.','SKU-069','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zu002bsbz1vpgp8jgy','GMI-00070','Le Damas','Grb-0001','Cold Drinks','Water','£1.29','','','','Image','','','SKU-070','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zw002csbz12kkk4uld','GMI-00071','Le Damas','Grb-0001','Cold Drinks','Ayran','£1.49','','','','Image','','','SKU-071','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1),('cmf8tn0zz002dsbz1klzdwipf','GMI-00072','Le Damas','Grb-0001','Cold Drinks','Large Bottle','£4.49','','','','Image','','','SKU-072','02/06/25','23/6/2025','YES','',NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `Menu_Items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Order_Lines`
--

DROP TABLE IF EXISTS `Order_Lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Order_Lines` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Order_Line_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Order_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Menu_Item_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Quantity` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Price` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Subtotal` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Order_Lines_Order_Line_ID_key` (`Order_Line_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Order_Lines`
--

LOCK TABLES `Order_Lines` WRITE;
/*!40000 ALTER TABLE `Order_Lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `Order_Lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Order_Messages`
--

DROP TABLE IF EXISTS `Order_Messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Order_Messages` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Message_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Order_Number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `User_Email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Message` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Time_Stamp` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `User_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Order_Messages_Message_ID_key` (`Message_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Order_Messages`
--

LOCK TABLES `Order_Messages` WRITE;
/*!40000 ALTER TABLE `Order_Messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `Order_Messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User : FAQ's`
--

DROP TABLE IF EXISTS `User : FAQ's`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User : FAQ's` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Question` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SKU` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User : FAQ's_Question_key` (`Question`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User : FAQ's`
--

LOCK TABLES `User : FAQ's` WRITE;
/*!40000 ALTER TABLE `User : FAQ's` DISABLE KEYS */;
INSERT INTO `User : FAQ's` VALUES ('cmf8tn1210038sbz1jql9xlvf','What happens if I cancel my order before it\'s received by the restaurant?','BRD-001','If you cancel your order before it\'s received by the restaurant, your account will be automatically refunded the full amount, minus any applicable cancellation fees.'),('cmf8tn1250039sbz1j9h46k4f','Can I track my order in real-time?','MKG-TW2','Yes, as your order is processed and delivered, you\'ll receive real-time updates on its status, including estimated delivery times and any changes to the delivery address.'),('cmf8tn128003asbz1kfb9iour','Is it secure to pay for my order online?','TRP-TP2','Absolutely! Our payment system is fully encrypted and PCI-DSS compliant, ensuring your financial information is safe and secure.'),('cmf8tn129003bsbz1hntwhcl4','How do I update my account information, like my address or payment method?','BSO-FL1','You can easily update your account information by logging in to your account, going to the \'Account\' section, and making the necessary changes.'),('cmf8tn12b003csbz1b8r2px8j','Can I use multiple payment methods for an order?','CPG-LD1','Yes, you can use multiple payment methods, including credit cards, PayPal, and Apple Pay, to make your payment.'),('cmf8tn12c003dsbz1jakora87','What if I encounter issues with my order?','ENG-HP2','If you experience any issues with your order, please contact our customer support team, who will be happy to assist you and resolve the issue as quickly as possible.'),('cmf8tn12d003esbz1w3qrq0ss','How do I cancel an order on the app?','ENG-HP2','You can cancel an order by logging onto your account, going to the \'Order History\' tab, and selecting the order you want to cancel. Please note that cancellation requests may not be accepted after a certain timeframe.'),('cmf8tn12f003fsbz14kle3rzb','What types of payment methods are accepted on the app?','LMB-FE2','We accept major credit cards, including Visa, Mastercard, and American Express, as well as mobile payments like Apple Pay and Google Pay.'),('cmf8tn12j003gsbz1l4qbgadl','Can I make changes to my order once it\'s placed?','GFR-WI3','Yes, you can contact the restaurant directly through the app to make changes to your order before it\'s prepared. Please note that changes may not be allowed once the order has been prepared.'),('cmf8tn12l003hsbz1efwm727y','How will I receive notifications about my order?','ERG-KG1','You will receive notifications about your order status through the app, including a confirmation of your order, an update when your order is being prepared, and a notification when your order is ready for pickup or delivery.'),('cmf8tn12m003isbz15oevpxgd','What happens if I receive the wrong order?','FUS-01','If you receive a wrong order, please contact the restaurant directly through the app and provide a photo of the order. We will work with you to resolve the issue and provide the correct order as soon as possible.'),('cmf8tn12o003jsbz1in1edvpi','Can I reorder an item from a previous order?','HEA-HH1','Yes, you can reorder items from your previous orders by going to the \'Order History\' tab, selecting the order you want, and clicking on the \'Reorder\' button.');
/*!40000 ALTER TABLE `User : FAQ's` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User Session`
--

DROP TABLE IF EXISTS `User Session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User Session` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Session_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Grubsy_User_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Manual_Location` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Search_Location` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Basket_Subtotal` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Fee` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Order_Grand_Total` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Cuisines_of_Grubsy` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Created_At` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User Session_Session_ID_key` (`Session_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User Session`
--

LOCK TABLES `User Session` WRITE;
/*!40000 ALTER TABLE `User Session` DISABLE KEYS */;
/*!40000 ALTER TABLE `User Session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User_Preferences`
--

DROP TABLE IF EXISTS `User_Preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User_Preferences` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_updates` tinyint(1) NOT NULL DEFAULT '1',
  `promotions` tinyint(1) NOT NULL DEFAULT '0',
  `new_restaurants` tinyint(1) NOT NULL DEFAULT '1',
  `delivery_alerts` tinyint(1) NOT NULL DEFAULT '1',
  `location_services` tinyint(1) NOT NULL DEFAULT '1',
  `auto_detect_location` tinyint(1) NOT NULL DEFAULT '1',
  `save_payment_info` tinyint(1) NOT NULL DEFAULT '0',
  `email_receipts` tinyint(1) NOT NULL DEFAULT '1',
  `vegetarian` tinyint(1) NOT NULL DEFAULT '0',
  `vegan` tinyint(1) NOT NULL DEFAULT '0',
  `halal` tinyint(1) NOT NULL DEFAULT '0',
  `gluten_free` tinyint(1) NOT NULL DEFAULT '0',
  `dairy_free` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_Preferences_user_id_key` (`user_id`),
  CONSTRAINT `User_Preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User_Preferences`
--

LOCK TABLES `User_Preferences` WRITE;
/*!40000 ALTER TABLE `User_Preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `User_Preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('19fe4174-d185-46ac-920a-95b245fa6fdc','13b1a72deb093be468d93dde75955b8640f7d0c2f8f05231552f818b4f083b94','2025-09-18 06:33:40.263','20250917102255_fix_createdat_field',NULL,NULL,'2025-09-18 06:33:40.252',1),('1ab7d777-f883-4fe4-b946-ca11f1f850d6','5f008fe9c05660e2880d40146129b7991f0af923afe59f1dbc041c4fdd09afcd',NULL,'20250910111315_grubsy','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250910111315_grubsy\n\nDatabase error code: 1050\n\nDatabase error:\nTable \'Basket_Table\' already exists\n\nPlease check the query number 1 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20250910111315_grubsy\"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20250910111315_grubsy\"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236','2026-01-20 14:46:08.169','2026-01-20 14:44:48.035',0),('2dd641f3-7d4d-4e11-83bc-2847e4d5d4f8','5f008fe9c05660e2880d40146129b7991f0af923afe59f1dbc041c4fdd09afcd','2026-01-20 14:46:08.469','20250910111315_grubsy','',NULL,'2026-01-20 14:46:08.469',0),('70d4329d-1938-4b1a-9e6c-0c382a1df317','0dc106b99c3aefb11facc3c094abccc2a41c2d4b8fa21de9d5e878d02be5f871','2025-09-18 06:33:40.252','20250912021509_init',NULL,NULL,'2025-09-18 06:33:40.205',1),('b49176ca-9f4e-4068-8321-70fc9e37eb92','5f008fe9c05660e2880d40146129b7991f0af923afe59f1dbc041c4fdd09afcd',NULL,'20250910111315_grubsy','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250910111315_grubsy\n\nDatabase error code: 1050\n\nDatabase error:\nTable \'basket_table\' already exists\n\nPlease check the query number 1 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20250910111315_grubsy\"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20250910111315_grubsy\"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236','2026-01-20 14:44:30.415','2025-10-11 19:07:14.183',0);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `role` enum('super_admin','operations','support','finance') NOT NULL DEFAULT 'support',
  `is_active` tinyint(1) DEFAULT '1',
  `requires_otp` tinyint(1) DEFAULT '0',
  `otp_secret` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES ('admin-1770107361580','admin@grubsy.com','$2a$12$fI7sctfvbwqCxIQN6cxIsu/uCBxHduGQzfPcZfmpImhmHxpEXhNUS','Test Admin','super_admin',1,0,NULL,'2026-02-03 08:29:21','2026-02-03 08:29:21',NULL),('admin-1770109710852','Grubsy.Delivery@gmail.com','$2b$10$9suQXW.LhRbvEa3NAKqyjOOyHyMPKDsp7FVj1xdiA49UiuNaTWl5i','Sir Grubsy','super_admin',1,0,NULL,'2026-02-03 09:08:30','2026-03-04 18:55:30',NULL);
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `user_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `details` json DEFAULT NULL,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_entity_type` (`entity_type`),
  KEY `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversationId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fromRole` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toRole` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driverId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supportUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `metadata` json DEFAULT NULL,
  `readAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_conversationId` (`conversationId`),
  KEY `idx_chat_messages_orderId` (`orderId`),
  KEY `idx_chat_messages_driverId` (`driverId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_activities`
--

DROP TABLE IF EXISTS `driver_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_activities` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `order_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `driver_activities_driver_id_idx` (`driver_id`),
  KEY `driver_activities_order_id_idx` (`order_id`),
  KEY `driver_activities_timestamp_idx` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_activities`
--

LOCK TABLES `driver_activities` WRITE;
/*!40000 ALTER TABLE `driver_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_payouts`
--

DROP TABLE IF EXISTS `driver_payouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_payouts` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_amount` decimal(10,2) NOT NULL,
  `method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `requested_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `processed_at` datetime(3) DEFAULT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `driver_payouts_driver_id_idx` (`driver_id`),
  KEY `driver_payouts_status_idx` (`status`),
  KEY `driver_payouts_requested_at_idx` (`requested_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_payouts`
--

LOCK TABLES `driver_payouts` WRITE;
/*!40000 ALTER TABLE `driver_payouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_payouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers`
--

DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers` (
  `Driver_ID` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_photo_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_pw` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `status` enum('pending','active','suspended','deactivated') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `date_joined` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `vehicle_type` enum('bicycle','scooter','motorbike','car','van') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_reg` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driving_licence` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `licence_expiry` date DEFAULT NULL,
  `Registered_address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line1` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line2` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `state_region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postcode` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `insurance_provider` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_policy_number` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_coverage_type` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `insurance_verified` enum('unverified','pending','verified','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unverified',
  `insurance_document_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UTR_Number` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NI_Number` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `availability` tinyint(1) NOT NULL DEFAULT '0',
  `current_location_lat` decimal(9,6) DEFAULT NULL,
  `current_location_lng` decimal(9,6) DEFAULT NULL,
  `location_updated_at` datetime DEFAULT NULL,
  `completed_orders` int NOT NULL DEFAULT '0',
  `cancellations_count` int NOT NULL DEFAULT '0',
  `emergencies` int NOT NULL DEFAULT '0',
  `earnings_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tips_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `current_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `last_payout_at` datetime DEFAULT NULL,
  `emergency_contact_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `base_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_schedule` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `max_distance` decimal(5,2) NOT NULL DEFAULT '25.00',
  `otp` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `push_notification` tinyint(1) NOT NULL DEFAULT '1',
  `sound_notification` tinyint(1) NOT NULL DEFAULT '1',
  `vibrate_notification` tinyint(1) NOT NULL DEFAULT '1',
  `rating` decimal(3,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`Driver_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
INSERT INTO `drivers` VALUES ('DRV-1768230025340','Driver','6789',NULL,NULL,NULL,'+447123456789',NULL,NULL,'active','2026-01-12 15:00:25',NULL,'2026-01-12 15:00:25','2026-01-12 15:00:25','car',NULL,NULL,NULL,'Not specified','Not specified',NULL,'Not specified',NULL,'Not specified','GB',NULL,NULL,NULL,NULL,'unverified',NULL,NULL,NULL,0,NULL,NULL,NULL,0,0,0,0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,25.00,NULL,1,1,1,0.00),('DRV-TEST-001','Test','Driver',NULL,'driver@grubsy.com','$2b$12$CBGCKU9KMKGxkb9PzuRlSOEgp5MWE0OzeMPGpiBKqNiJL94NKDr7q','+447700900123',NULL,NULL,'active','2025-09-21 22:13:38','2025-09-21 22:18:16','2025-09-21 22:13:38','2025-09-21 22:18:16','car',NULL,NULL,NULL,'123 Test Street','123 Test Street',NULL,'London',NULL,'SW1A 1AA','GB',NULL,NULL,NULL,NULL,'unverified',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0,0,0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,25.00,NULL,1,1,1,0.00),('DRV355668S5N4','test','test',NULL,'test@test.com',NULL,'987654321',NULL,NULL,'pending','2026-03-27 08:32:36',NULL,'2026-03-27 08:32:36','2026-03-27 08:32:36','car','',NULL,NULL,'','','','','','','GB',NULL,NULL,NULL,NULL,'unverified',NULL,NULL,NULL,0,NULL,NULL,NULL,0,0,0,0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,25.00,NULL,1,1,1,0.00),('GD-001','Test','Driver',NULL,'driver@grubsy.com','123456','+447700900123',NULL,NULL,'active','2025-09-21 01:08:07','2025-10-11 18:33:46','2025-09-21 01:08:07','2025-10-11 18:33:46','car',NULL,NULL,NULL,'123 Test Street, London','123 Test Street',NULL,'London',NULL,'SW1A 1AA','GB',NULL,NULL,NULL,NULL,'unverified',NULL,NULL,NULL,1,NULL,NULL,NULL,12,0,0,43.00,3.00,0.00,NULL,NULL,NULL,NULL,NULL,25.00,NULL,1,1,1,0.00),('GD-003','Test','Driver',NULL,'testdriver@grubsy.com','$2b$12$AyRQMJwSBU0uyhlwXFMshuUpALPF3jhah37Di9BSLtcCTggXPgw.O','+447700900001',NULL,NULL,'active','2026-01-07 18:31:00','2026-01-20 15:43:23','2026-01-07 18:31:00','2026-01-20 15:43:23','car',NULL,NULL,NULL,'123 Test Street','123 Test Street',NULL,'London',NULL,'SW1A 1AA','UK',NULL,NULL,NULL,NULL,'unverified',NULL,NULL,NULL,0,51.507400,-0.127800,'2026-01-20 14:53:03',0,0,0,0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,25.00,NULL,1,1,1,0.00),('GD-005','Test','Driver',NULL,'testdriver4@example.com','$2b$12$mlVLewkKc60Sl4YECn8oH.Z8OQzC/CZqrJQbN/aX9d45EMTtVptPS','+4412345678',NULL,NULL,'pending','2026-01-26 09:50:15','2026-01-27 09:09:13','2026-01-26 09:50:15','2026-01-27 09:09:13','car',NULL,NULL,NULL,'123 Test Street','123 Test Street',NULL,'London',NULL,'SW1A 1AA','GB',NULL,NULL,NULL,NULL,'unverified',NULL,NULL,NULL,0,51.507400,-0.127800,'2026-01-26 09:55:42',0,0,0,0.00,0.00,0.00,NULL,NULL,NULL,NULL,NULL,25.00,NULL,1,1,1,0.00);
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchant_password_resets`
--

DROP TABLE IF EXISTS `merchant_password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchant_password_resets` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_token` (`email`,`token`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchant_password_resets`
--

LOCK TABLES `merchant_password_resets` WRITE;
/*!40000 ALTER TABLE `merchant_password_resets` DISABLE KEYS */;
INSERT INTO `merchant_password_resets` VALUES ('cmkfhabdp0000qs6ivo7x290o','owner@ladamas.com','498011','2026-01-15 13:51:24',1,'2026-01-15 13:21:24');
/*!40000 ALTER TABLE `merchant_password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchant_payouts`
--

DROP TABLE IF EXISTS `merchant_payouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchant_payouts` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','paid','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `method` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_reference` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_at` datetime NOT NULL,
  `processed_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_partner_created` (`partner_id`,`requested_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchant_payouts`
--

LOCK TABLES `merchant_payouts` WRITE;
/*!40000 ALTER TABLE `merchant_payouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `merchant_payouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchants`
--

DROP TABLE IF EXISTS `merchants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchants` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Grubsy_Partner_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Merchants_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Merchants_Phone_Number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `Cuisine` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Area` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PostCode` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Hygiene_Rating` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Opening_Times` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `حلال Halal Friendly?` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Photo` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Booking_Available` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Relation` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Active` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Created_at` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Owners_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Owners_Number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Merchant_Enrolement_Status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Merchant_Fee_Per_Order` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Merchants_Email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Merchants_Password` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coordinate_lat` decimal(9,6) DEFAULT NULL,
  `coordinate_lon` decimal(9,6) DEFAULT NULL,
  `Delivery_Radius` decimal(5,2) DEFAULT NULL,
  `Average_Preparation_Time` int DEFAULT NULL,
  `Updated_At` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Merchants_Grubsy_Partner_ID_key` (`Grubsy_Partner_ID`),
  UNIQUE KEY `Merchants_Merchants_Email_key` (`Merchants_Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchants`
--

LOCK TABLES `merchants` WRITE;
/*!40000 ALTER TABLE `merchants` DISABLE KEYS */;
INSERT INTO `merchants` VALUES ('cmf8tn0po0005sbz1lnoi89f0','Grb-0002','Big Boys Kitchen',NULL,'Serving up bold USA flavours with a halal twist—think sizzling Nashville Hot Burgers, loaded mac & cheese, crispy wings, and stacked fries. Classic diner taste, 100% halal. 🍔✨ Slough’s go-to for fiery, cheesy, finger-lickin’ goodness! Evening cravings? We’ve got you!','American Diner','73 Grays Rd, Slough SL1 3QG','Slough','SL1','5 Stars ⭐️⭐️⭐️⭐️⭐️','Mon-Sun 12pm-10pm','Yes! 100% Halal','https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/cPIwtkP5E76N00qHOwjw/pub/sSrjD5Tkwpo2dure5QqZ.webp','Yes','','Active','2025-08-27','','','Completed','20%','','',51.509601,-0.595255,NULL,NULL,NULL),('cmf8tn0pr0006sbz101s9p9x4','Grb-0003','Dodgers Dubai Droids',NULL,'Really tasty treats','Deserts','242 Clewer Hill Rd, Windsor, SL4 4BW','Windsor','Sl4','4 Stars ⭐️⭐️⭐️⭐️','mon-weds 3pm-9pm','Halal Options','','No','','Active','2025-08-19','','','Completed','13%',NULL,NULL,51.481194,-0.607471,NULL,NULL,NULL),('cmf8tn0pu0007sbz16dg58gh1','Grb-0001','La Damas',NULL,'Le Damas offers a vibrant tapestry of authentic Syrian flavours, seamlessly blending the convenience of fast food with the warmth of traditional Syrian herbs and spices from Damascus.','Syrian','277a High Street, Slough, Berkshire, SL1 1BN','Slough','SL1','4 Stars ⭐️⭐️⭐️⭐️','Mon-Sun 10am-1am','Yes! 100% Halal','https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/cPIwtkP5E76N00qHOwjw/pub/prRpamdNnMkbk6tIjFiA.png','yes',NULL,'active','2025-06-14','Sami Mheri',NULL,'Completed','10%','owner@ladamas.com','$2b$10$TrdJoVW86MGEVXbZhCQvEua/ULvQcySO5uP5Jr9vGNSa3.oAdldTO',51.511205,-0.595071,NULL,NULL,NULL),('cmf8tn0pu0007sbz16dg58ue5','Grb-0004','Edens Eggs',NULL,'Eggstastically Eggquisite','Sandwichs','Sl3 1QP','Windsor','SL4','5 Stars ⭐️⭐️⭐️⭐️⭐️','Mon-Sun 8am-7pm','Yes! 100% Halal','','Yes','','Active','2025-07-28','Eden Devany','1234567890','Completed','15%',NULL,NULL,51.479991,-0.608819,NULL,NULL,NULL),('cmkcgp1vw0000i3lln25d3p4u','Grb-4444','Test Merchant Grb-4444',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Yes','2026-01-13T10:41:33.642Z',NULL,NULL,'Active',NULL,'test-merchant+store@example.com','$2b$10$yl7fw1pnf1cNMeCYMASgLOCDG4H/Cf2EVWq/i7OP2Sv8gZK304jT2',NULL,NULL,NULL,NULL,NULL),('PARTNER-1774607067531-itji06mba','PARTNER-1774607067531-itji06mba','test','','test','','','','',NULL,'',NULL,NULL,NULL,NULL,'1','2026-03-27T10:24:27.531Z',NULL,NULL,'PENDING',NULL,'test.rest@test.com',NULL,NULL,NULL,NULL,NULL,'2026-03-27T15:47:27.962Z'),('PARTNER-1774791178362-1kfopidww','PARTNER-1774791178362-1kfopidww','test','','test','','','','',NULL,'',NULL,NULL,NULL,NULL,'1','2026-03-29T13:32:58.362Z',NULL,NULL,'PENDING',NULL,'testresr@test.com',NULL,NULL,NULL,NULL,NULL,'2026-03-31T13:53:44.154Z');
/*!40000 ALTER TABLE `merchants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_activities`
--

DROP TABLE IF EXISTS `order_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_activities` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `order_activities_order_id_idx` (`order_id`),
  KEY `order_activities_driver_id_idx` (`driver_id`),
  KEY `order_activities_timestamp_idx` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_activities`
--

LOCK TABLES `order_activities` WRITE;
/*!40000 ALTER TABLE `order_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_photos`
--

DROP TABLE IF EXISTS `order_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_photos` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_url` text COLLATE utf8mb4_unicode_ci,
  `photo_data` longtext COLLATE utf8mb4_unicode_ci,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `restaurant_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `order_photos_order_id_idx` (`order_id`),
  KEY `order_photos_driver_id_idx` (`driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_photos`
--

LOCK TABLES `order_photos` WRITE;
/*!40000 ALTER TABLE `order_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Order_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Ordered_Items` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_User_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_Partner_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Order_Date` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','ACCEPTED','READY_FOR_DRIVER','ALLOCATING_DRIVER','ALLOCATED_DRIVER','AT_RESTAURANT','PICKED_UP','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `Basket_SubTotal` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Service_Fee` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Delivery_Fee` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tips` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Order_Grand_Total` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_Profit` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Delivery_Address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Delivery_Instructions` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Users_Email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Driver_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Created_At` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Delivered_At` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Payment_Link` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Payment_Status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Stripe_Session_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Users_Phone_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coordinates` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Merchant_Accepted_At:` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Driver_PickUp_At:` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Merchants_Order_Images` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Drivers_Order_Images` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `USer_Code_Given` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Accepted_At` datetime(3) DEFAULT NULL,
  `At_Restaurant_At` datetime(3) DEFAULT NULL,
  `Cancellation_Reason` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Cancelled_At` datetime(3) DEFAULT NULL,
  `Delivery_Code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Delivery_Postcode` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Driver_Allocated_At` datetime(3) DEFAULT NULL,
  `Driver_Allocating_At` datetime(3) DEFAULT NULL,
  `Emergency_Reason` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Emergency_Reported_At` datetime(3) DEFAULT NULL,
  `Emergency_Type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Original_Driver_Penalty` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Out_For_Delivery_At` datetime(3) DEFAULT NULL,
  `Picked_Up_At` datetime(3) DEFAULT NULL,
  `Pickup_Code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Ready_At` datetime(3) DEFAULT NULL,
  `Reallocated_At` datetime(3) DEFAULT NULL,
  `Reallocated_Driver_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coordinate_lat` decimal(9,6) DEFAULT NULL,
  `coordinate_lon` decimal(9,6) DEFAULT NULL,
  `Users_Name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Merchants_Name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Driver_Name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Orders_Order_ID_key` (`Order_ID`),
  KEY `idx_orders_partner_status` (`Grubsy_Partner_ID`,`status`),
  KEY `idx_orders_driver_status` (`Driver_ID`,`status`),
  KEY `idx_orders_user` (`Grubsy_User_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('cmf8tn0q00008sbz10e9zyug8','GDS-002BC','kebabs, rice & cheese','Grb:U-004PT','Grb-0001','2025-09-21','ACCEPTED','21','£1.90','£3.50','0','£24.40','','1 washington avenue, Sl1 6rq','i live in a tree house ','Briancostello@gmail.com','','','08:33','','','PAID','','','','2026-01-16T18:50:02.228Z','','','','','2026-01-16 18:50:02.228',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmf8tn0q00008sbz10e9zyug9','ORD-004','Chicken Shawarma, Salad','Grb:U-002LV','Grb-0001','2025-09-21','ALLOCATED_DRIVER','12.00','1.20','3.00','1.80','16.20',NULL,'test','test','Briancostello@gmail.com','GD-001',NULL,'09:03',NULL,NULL,'PAID',NULL,'7411259052',NULL,'2025-09-09T09:02:12.385Z',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmf8tn0q60009sbz1ne0ydl54','GDS-003QT','Null','Grb:U-003KC','Grb-0001','2025-09-21','ALLOCATED_DRIVER','21','£1.90','£3.50','0','£24.40','','1 washington avenue, Sl1 6rq','i have no ears so i cant hear the door bell','Briancostello@gmail.com','GD-001','','08:37','','','PAID','','','','','','','','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmf8tn0qa000asbz1l52el0e2','GDS-004XV','Null','Grb:U-002LV','Grb-0001','2025-09-21','CANCELLED','15.50','£2.50','£3.15','0','£30.65','','34 Elm Road, Sl4 3ND','I am a ghost so im not even really here','Briancostello@gmail.com',NULL,'','08:36','','','PAID','','','','','','','','',NULL,NULL,'Restaurant Closed','2026-01-27 09:27:05.413',NULL,NULL,'2026-01-27 09:14:21.889',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmf8tn0qd000bsbz1df5nrueb','GDS-001RT','Null','Grb:U-001KN','Grb-0001','2025-09-21','AT_RESTAURANT','15.50','£2.85','£3.15','0','£34.50','','42 Wexham Road, Flat 3B, Slough, SL2 5EN,','i have two doors','Briancostello@gmail.com','','IZZA-001,SALAD-001','08:40','','','PAID','','44 7700 900123','51.5234, -0.6012','','','','','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmfcbny5f0000sby4n3mex9zx','ORD-001','Lamb Doner, Chips, Can','Grb:U-004PT','Grb-0001','2025-09-21','CANCELLED','15.50','1.50','3.00','2.00','20.00',NULL,'123 Test Street, London, SW1A 1AA','give the parcel to my dog','Briancostello@gmail.com','',NULL,'09:02',NULL,NULL,'PAID',NULL,'7411259052',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Rejected by automated test script','2026-01-16 18:50:03.602',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmfcbny820001sby45kzcjqle','ORD-002','Mixed Grill, Rice, Bread','Grb:U-003KC','Grb-0001','2025-09-21','PICKED_UP','22.00','2.00','3.00','3.00','27.00',NULL,'456 Another Street, London, W1A 0AX','I live on the roof','Lalacostello@gmail.com','',NULL,'09:00',NULL,NULL,'PAID',NULL,'7411259052',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmfcbny890002sby4gwtzqbnw','ORD-003','Chicken Shawarma, Salad','Grb:U-002LV','Grb-0001','2025-09-21','ALLOCATED_DRIVER','12.00','1.20','3.00','1.80','16.20',NULL,'789 Third Avenue, London, EC1A 1BB','watch out for the aligator','Briancostello@gmail.com','GD-001',NULL,'09:03',NULL,NULL,'PAID',NULL,'7411259052',NULL,'2025-09-09T09:02:12.385Z',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_logs`
--

DROP TABLE IF EXISTS `otp_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_logs` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SENT',
  `order_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_response` text COLLATE utf8mb4_unicode_ci,
  `Created_At` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_phone_number` (`phone_number`),
  KEY `idx_status` (`status`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_created_at` (`Created_At`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_logs`
--

LOCK TABLES `otp_logs` WRITE;
/*!40000 ALTER TABLE `otp_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `otp_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Users_Full_Name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Users_Email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Users_Password` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Grubsy_User_ID` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Is_New_User?` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Users_Registered_Address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Users_Registered_PostCode` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Users_Phone_Number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Date_Of_Birth` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Acc_Created_At` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Last_Login` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Users_Users_Email_key` (`Users_Email`),
  UNIQUE KEY `Users_Grubsy_User_ID_key` (`Grubsy_User_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('cmf8tn0on0000sbz1o8nuv2fe','brian costello','Briancostello@gmail.com','$2a$12$4HROAYSTUQ8p2w/gzqEBveOPTOpXfK.MlllUS2zHcDaW0AqUofyk.','Grb:U-004PT','yes','23 elm road, Windsor, Sl4 3ND','SL4 3ND','7411259052','13/12/1990','Approved','1/1/2025','25/8/2025'),('cmf8tn0p60001sbz1ihoevc4t','Lala costello','Lalacostello@gmail.com','Bludude2','Grb:U-003KC','yes','14 elm road, Windsor, Sl4 3ND','SL4 3ND','7411259052','13/12/1990','Approved','1/1/2025','25/8/2025'),('cmf8tn0p90002sbz1qt5fj7a9','Lee costello','Leecostello@gmail.com','Bludude3','Grb:U-002LV','yes','40 elm road, Windsor, Sl4 3ND','SL4 3ND','7411259052','13/12/1990','Approved','1/1/2025','25/8/2025'),('cmf8tn0pc0003sbz1t8nhkm1s','Maggy costello','Maggycostello@gmail.com','Bludude4','Grb:U-001KN','yes','23 elm road, Windsor, Sl4 3ND','SL4 3ND','7411259052','13/12/1990','Approved','1/1/2025','25/8/2025'),('cmfqnofhp0000sbkpddkap36p','Test User','testuser@example.com','$2b$10$O3TRSbWsHzKIZCkF0HlE/uRYRbDquf9zhU1E96qJvM36OKIOAAjYK','GU-1758275236715','Yes',NULL,NULL,'07123456789',NULL,'Active','2025-09-19T09:47:16.715Z',NULL),('cmkbai2tr0000qslgz2jus5yd','Test User','test-1768230024035@example.com','$2b$10$rmza3nU4G9pFY.0CSZ8bGurSHA9w0MBLTQXR/RsBpr4wJLBxQvZY.','GU-1768230024398','Yes',NULL,NULL,'+447123456789',NULL,'Active','2026-01-12T15:00:24.398Z',NULL),('cmkbaq2640001qslg6pl8dygc','Test User','test_1768230396121@grubsy.test','$2b$10$ZP7HR0uYkg6kMe16XtZUfOptDX814nGGJKtdn9JBConMzrVofFXVO','GU-1768230396796','Yes',NULL,NULL,'+44 7123 456789',NULL,'Active','2026-01-12T15:06:36.796Z',NULL),('cmkbbcx660002qslgphy0klcq','umer','umer@gmail.com','$2b$10$mJi6GXPV4OwdYQpTC.dvAuq5sFfI.xWp6j6dfuBPXDy.SpjX0.xPm','GU-1768231463406','Yes',NULL,NULL,NULL,NULL,'Active','2026-01-12T15:24:23.406Z',NULL),('cmkpepy4y0000qssbj37uqi8t','roaan user','roaan.dev@gmail.com','$2b$10$OY51/JW6CJnLApaTOVvCIu.q3p1G8dUynoeGirTQftzXwYCYVu7fO','GU-1769083636498','Yes',NULL,NULL,NULL,NULL,'Active','2026-01-22T12:07:16.498Z',NULL),('cmkxxpfjv0000qs3yzyeofxos','Mike Knight','grubsy.delivery@gmail.com','$2b$10$MfPVCcr0Qx5.BxNaE6iNbuAJp207o1UhJbqFkbExTmurZnk43KSqO','GU-1769599254523','Yes',NULL,NULL,NULL,NULL,'Active','2026-01-28T11:20:54.523Z',NULL),('cml5ag9lh0000qsq6zglnwcf8','Doje  McD','Shane.Halalme@gmail.com','$2b$10$Rr7kZy7.zXpZXqITFSq2duQGKinehTt6UedUG7ucxGp4teeqvR8Fm','GU-1770043925141','Yes',NULL,NULL,NULL,NULL,'Active','2026-02-02T14:52:05.141Z',NULL),('cmm3emk010000qssud3mn5lwk','Sheheryar Khan','sheheryar.alam.khan@gmail.com','$2b$10$VgM4eor0v4M26itWl6CG8eJl7KI3NpPkTscy5UkDVqBul9l4N7e4W','GU-1772106787008','Yes',NULL,NULL,NULL,NULL,'Active','2026-02-26T11:53:07.008Z',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-31 16:03:21
