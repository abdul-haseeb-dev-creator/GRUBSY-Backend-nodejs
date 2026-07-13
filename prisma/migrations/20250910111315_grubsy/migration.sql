-- CreateTable
CREATE TABLE `Basket_Table` (
    `id` VARCHAR(191) NOT NULL,
    `Basket ID` VARCHAR(191) NOT NULL,
    `User Grubsy ID` VARCHAR(191) NOT NULL,
    `Grubsy_Partner_ID` VARCHAR(191) NOT NULL,
    `Menu_Item_ID` VARCHAR(191) NOT NULL,
    `Quantity` VARCHAR(191) NULL,
    `Price` VARCHAR(191) NULL,
    `Added_At` VARCHAR(191) NULL,
    `Status` VARCHAR(191) NULL,

    UNIQUE INDEX `Basket_Table_Basket ID_key`(`Basket ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bookings` (
    `id` VARCHAR(191) NOT NULL,
    `Merchant_Name` VARCHAR(191) NULL,
    `User_Email` VARCHAR(191) NOT NULL,
    `Date` VARCHAR(191) NULL,
    `Time` VARCHAR(191) NULL,
    `Guests` VARCHAR(191) NULL,
    `Name` VARCHAR(191) NULL,
    `Phone` VARCHAR(191) NULL,
    `Special_Requests` VARCHAR(191) NULL,
    `Grubsy_User_Id` VARCHAR(191) NULL,
    `Grubsy_Partner_ID` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Combo_Options` (
    `id` VARCHAR(191) NOT NULL,
    `Merchant_Name` VARCHAR(191) NULL,
    `Grubsy_Partner_ID` VARCHAR(191) NULL,
    `Combo_Name` VARCHAR(191) NULL,
    `Option_Name` VARCHAR(191) NULL,
    `Option_Order` VARCHAR(191) NULL,
    `Option_Items (comma separated)` VARCHAR(191) NULL,
    `Combo_Option_ID` VARCHAR(191) NOT NULL,
    `Combo_ID` VARCHAR(191) NULL,
    `Image` VARCHAR(191) NULL,

    UNIQUE INDEX `Combo_Options_Combo_Option_ID_key`(`Combo_Option_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Combos` (
    `id` VARCHAR(191) NOT NULL,
    `Combo_ID` VARCHAR(191) NOT NULL,
    `Merchant_Name` VARCHAR(191) NULL,
    `Combo_Name` VARCHAR(191) NULL,
    `Price` VARCHAR(191) NULL,
    `Description` VARCHAR(191) NULL,
    `Available_Times` VARCHAR(191) NULL,
    `Status` VARCHAR(191) NULL,
    `Created_at:` VARCHAR(191) NULL,
    `Grubsy_Partner_ID` VARCHAR(191) NULL,
    `Image` VARCHAR(191) NULL,

    UNIQUE INDEX `Combos_Combo_ID_key`(`Combo_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CRM/Back Office` (
    `id` VARCHAR(191) NOT NULL,
    `CRM_ID` VARCHAR(191) NOT NULL,
    `User_Grubsy_ID` VARCHAR(191) NULL,
    `Order_Number` VARCHAR(191) NULL,
    `Grubsy_Partner_ID` VARCHAR(191) NULL,
    `Status` VARCHAR(191) NULL,
    `Last_Synced` VARCHAR(191) NULL,
    `Notes` VARCHAR(191) NULL,

    UNIQUE INDEX `CRM/Back Office_CRM_ID_key`(`CRM_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Delivery Zones` (
    `id` VARCHAR(191) NOT NULL,
    `Zone_ID` VARCHAR(191) NOT NULL,
    `Zone_Name` VARCHAR(191) NULL,
    `Post_Codes (Comma Separated)` VARCHAR(191) NULL,
    `Status` VARCHAR(191) NULL,
    `Driver_Fee:Normal_hrs` VARCHAR(191) NULL,
    `Driver_Fee:Peak_Hours` VARCHAR(191) NULL,
    `Peak Hours (4pm-7pm) Active:` VARCHAR(191) NULL,
    `Delivery_Charge` VARCHAR(191) NULL,

    UNIQUE INDEX `Delivery Zones_Zone_ID_key`(`Zone_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Documents` (
    `id` VARCHAR(191) NOT NULL,
    `DocumentID` VARCHAR(191) NOT NULL,
    `Code` VARCHAR(191) NULL,
    `Description` VARCHAR(191) NULL,
    `Document_Name` VARCHAR(191) NULL,
    `File_URL` VARCHAR(191) NULL,
    `SKU` VARCHAR(191) NULL,
    `Image_URL` VARCHAR(191) NULL,
    `Comments` VARCHAR(191) NULL,

    UNIQUE INDEX `Documents_DocumentID_key`(`DocumentID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Driver : FAQ's` (
    `id` VARCHAR(191) NOT NULL,
    `Question` VARCHAR(191) NOT NULL,
    `Answer` TEXT NOT NULL,

    UNIQUE INDEX `Driver : FAQ's_Question_key`(`Question`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Drivers` (
    `id` VARCHAR(191) NOT NULL,
    `Driver_ID` VARCHAR(191) NOT NULL,
    `Name` VARCHAR(191) NOT NULL,
    `Email` VARCHAR(191) NULL,
    `Phone` VARCHAR(191) NULL,
    `Vehicle` VARCHAR(191) NULL,
    `Vehicle_Reg` VARCHAR(191) NULL,
    `Driving_Licence` VARCHAR(191) NULL,
    `Date_Joined` VARCHAR(191) NULL,
    `Status` VARCHAR(191) NULL,
    `Completed_Orders` VARCHAR(191) NULL,
    `Created_At` VARCHAR(191) NULL,
    `Last_Login` VARCHAR(191) NULL,
    `Profile_Photo` VARCHAR(191) NULL,
    `Availability` VARCHAR(191) NULL,
    `Current_location` VARCHAR(191) NULL,
    `Cancelations` VARCHAR(191) NULL,

    UNIQUE INDEX `Drivers_Driver_ID_key`(`Driver_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Menu_Items` (
    `id` VARCHAR(191) NOT NULL,
    `Menu_Item_ID` VARCHAR(191) NOT NULL,
    `merchant_name` VARCHAR(191) NULL,
    `Grubsy_Partner_ID` VARCHAR(191) NULL,
    `Food_Category` VARCHAR(191) NULL,
    `Item` VARCHAR(191) NOT NULL,
    `Regular` VARCHAR(191) NULL,
    `Medium` VARCHAR(191) NULL,
    `Large` VARCHAR(191) NULL,
    `Platter` VARCHAR(191) NULL,
    `Image` VARCHAR(191) NULL,
    `Description` TEXT NULL,
    `Promotion` TEXT NULL,
    `Notes` TEXT NULL,
    `SKU` VARCHAR(191) NULL,
    `Created_At` VARCHAR(191) NULL,
    `Updated_At` VARCHAR(191) NULL,
    `Available` VARCHAR(191) NULL,
    `LastToggledAt` VARCHAR(191) NULL,

    UNIQUE INDEX `Menu_Items_Menu_Item_ID_key`(`Menu_Item_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Merchants` (
    `id` VARCHAR(191) NOT NULL,
    `Grubsy_Partner_ID` VARCHAR(191) NOT NULL,
    `Merchants_Name` VARCHAR(191) NULL,
    `Description` TEXT NULL,
    `Cuisine` VARCHAR(191) NULL,
    `Address` VARCHAR(191) NULL,
    `Area` VARCHAR(191) NULL,
    `PostCode` VARCHAR(191) NULL,
    `Hygiene_Rating` VARCHAR(191) NULL,
    `Opening_Times` VARCHAR(191) NULL,
    `حلال Halal Friendly?` VARCHAR(191) NULL,
    `Photo` VARCHAR(191) NULL,
    `Booking_Available` VARCHAR(191) NULL,
    `Relation` VARCHAR(191) NULL,
    `Active` VARCHAR(191) NULL,
    `Owner_Email` VARCHAR(191) NULL,
    `Created_at` VARCHAR(191) NULL,
    `Owners_Name` VARCHAR(191) NULL,
    `Owners_Number` VARCHAR(191) NULL,
    `Merchant_Enrolement_Status` VARCHAR(191) NULL,
    `Merchant_Fee_Per_Order` VARCHAR(191) NULL,

    UNIQUE INDEX `Merchants_Grubsy_Partner_ID_key`(`Grubsy_Partner_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Orders` (
    `id` VARCHAR(191) NOT NULL,
    `Order_ID` VARCHAR(191) NOT NULL,
    `Ordered_Items` VARCHAR(191) NULL,
    `Grubsy_User_ID` VARCHAR(191) NULL,
    `Grubsy_Partner_ID` VARCHAR(191) NULL,
    `Order_Date` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'READY_FOR_DRIVER', 'ALLOCATING_DRIVER', 'ALLOCATED_DRIVER', 'AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') NULL DEFAULT 'PENDING',
    `Basket_SubTotal` VARCHAR(191) NULL,
    `Service_Fee` VARCHAR(191) NULL,
    `Grubsy_Profit` VARCHAR(191) NULL,
    `Delivery_Fee` VARCHAR(191) NULL,
    `Order_Grand_Total` VARCHAR(191) NULL,
    `tips` VARCHAR(191) NULL,
    `Delivery_Address` VARCHAR(191) NULL,
    `Delivery_Instructions` VARCHAR(191) NULL,
    `Users_Email` VARCHAR(191) NULL,
    `Driver_ID` VARCHAR(191) NULL,
    `sku` VARCHAR(191) NULL,
    `Created_At` VARCHAR(191) NULL,
    `Delivered_At` VARCHAR(191) NULL,
    `Payment_Link` VARCHAR(191) NULL,
    `Payment_Status` VARCHAR(191) NULL,
    `Stripe_Session_ID` VARCHAR(191) NULL,
    `Users_Phone_number` VARCHAR(191) NULL,
    `coordinates` VARCHAR(191) NULL,
    `Merchant_Accepted_At:` VARCHAR(191) NULL,
    `Driver_PickUp_At:` VARCHAR(191) NULL,
    `Merchants_Order_Images` VARCHAR(191) NULL,
    `Drivers_Order_Images` VARCHAR(191) NULL,
    `USer_Code_Given` VARCHAR(191) NULL,
    `Accepted_At` DATETIME(3) NULL,
    `At_Restaurant_At` DATETIME(3) NULL,
    `Cancellation_Reason` VARCHAR(191) NULL,
    `Cancelled_At` DATETIME(3) NULL,
    `Delivery_Code` VARCHAR(191) NULL,
    `Delivery_Postcode` VARCHAR(191) NULL,
    `Driver_Allocated_At` DATETIME(3) NULL,
    `Driver_Allocating_At` DATETIME(3) NULL,
    `Emergency_Reason` VARCHAR(191) NULL,
    `Emergency_Reported_At` DATETIME(3) NULL,
    `Emergency_Type` VARCHAR(191) NULL,
    `Original_Driver_Penalty` VARCHAR(191) NULL,
    `Out_For_Delivery_At` DATETIME(3) NULL,
    `Picked_Up_At` DATETIME(3) NULL,
    `Pickup_Code` VARCHAR(191) NULL,
    `Ready_At` DATETIME(3) NULL,
    `Reallocated_At` DATETIME(3) NULL,
    `Reallocated_Driver_ID` VARCHAR(191) NULL,

    UNIQUE INDEX `Orders_Order_ID_key`(`Order_ID`),
    INDEX `idx_orders_partner_status`(`Grubsy_Partner_ID`, `status`),
    INDEX `idx_orders_driver_status`(`Driver_ID`, `status`),
    INDEX `idx_orders_user`(`Grubsy_User_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Users` (
    `id` VARCHAR(191) NOT NULL,
    `Users_Full_Name` VARCHAR(191) NULL,
    `Users_Email` VARCHAR(191) NOT NULL,
    `Users_Password` VARCHAR(191) NULL,
    `Grubsy_User_ID` VARCHAR(191) NOT NULL,
    `Is_New_User?` VARCHAR(191) NULL,
    `Users_Registered_Address` VARCHAR(191) NULL,
    `Users_Registered_PostCode` VARCHAR(191) NULL,
    `Users_Phone_Number` VARCHAR(191) NULL,
    `Date_Of_Birth` VARCHAR(191) NULL,
    `Status` VARCHAR(191) NULL,
    `Acc_Created_At` VARCHAR(191) NULL,
    `Last_Login` VARCHAR(191) NULL,

    UNIQUE INDEX `Users_Users_Email_key`(`Users_Email`),
    UNIQUE INDEX `Users_Grubsy_User_ID_key`(`Grubsy_User_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order_Lines` (
    `id` VARCHAR(191) NOT NULL,
    `Order_Line_ID` VARCHAR(191) NOT NULL,
    `Order_ID` VARCHAR(191) NULL,
    `Menu_Item_ID` VARCHAR(191) NULL,
    `Quantity` VARCHAR(191) NULL,
    `Price` VARCHAR(191) NULL,
    `Subtotal` VARCHAR(191) NULL,

    UNIQUE INDEX `Order_Lines_Order_Line_ID_key`(`Order_Line_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order_Messages` (
    `id` VARCHAR(191) NOT NULL,
    `Message_ID` VARCHAR(191) NOT NULL,
    `Order_Number` VARCHAR(191) NULL,
    `User_Email` VARCHAR(191) NULL,
    `Message` VARCHAR(191) NULL,
    `Time_Stamp` VARCHAR(191) NULL,
    `Status` VARCHAR(191) NULL,
    `User_ID` VARCHAR(191) NULL,

    UNIQUE INDEX `Order_Messages_Message_ID_key`(`Message_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- CreateTable
CREATE TABLE `admin_users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NULL,
    `role` ENUM('super_admin','operations','support','finance') NOT NULL DEFAULT 'support',
    `is_active` TINYINT(1) DEFAULT 1,
    `requires_otp` TINYINT(1) DEFAULT 0,
    `otp_secret` VARCHAR(255) NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login_at` DATETIME NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `admin_users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FAQ's : Establishment` (
    `id` VARCHAR(191) NOT NULL,
    `Question` VARCHAR(191) NOT NULL,
    `Answer` TEXT NOT NULL,

    UNIQUE INDEX `FAQ's : Establishment_Question_key`(`Question`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User : FAQ's` (
    `id` VARCHAR(191) NOT NULL,
    `Question` VARCHAR(191) NOT NULL,
    `SKU` VARCHAR(191) NULL,
    `Answer` TEXT NOT NULL,

    UNIQUE INDEX `User : FAQ's_Question_key`(`Question`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User Session` (
    `id` VARCHAR(191) NOT NULL,
    `Session_ID` VARCHAR(191) NOT NULL,
    `Grubsy_User_ID` VARCHAR(191) NULL,
    `Manual_Location` VARCHAR(191) NULL,
    `Search_Location` VARCHAR(191) NULL,
    `Basket_Subtotal` VARCHAR(191) NULL,
    `Fee` VARCHAR(191) NULL,
    `Order_Grand_Total` VARCHAR(191) NULL,
    `Cuisines_of_Grubsy` VARCHAR(191) NULL,
    `Created_At` VARCHAR(191) NULL,

    UNIQUE INDEX `User Session_Session_ID_key`(`Session_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
