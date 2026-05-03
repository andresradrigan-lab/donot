-- CreateTable
CREATE TABLE `Droop` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `coverImage` VARCHAR(191) NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Droop_code_key`(`code`),
    INDEX `Droop_isPublished_startsAt_endsAt_idx`(`isPublished`, `startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Box` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('PREMIUM', 'AZUCARADA', 'MIX', 'COLAB') NOT NULL,
    `slotCount` INTEGER NOT NULL,
    `priceClp` INTEGER NOT NULL,
    `images` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `availableWeekdays` JSON NOT NULL,
    `availableFrom` DATETIME(3) NULL,
    `availableTo` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Box_slug_key`(`slug`),
    INDEX `Box_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Flavor` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('PREMIUM', 'AZUCARADA') NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NOT NULL,
    `droopId` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `stockResetDaily` BOOLEAN NOT NULL DEFAULT false,
    `dailyCapacity` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `availableWeekdays` JSON NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Flavor_slug_key`(`slug`),
    INDEX `Flavor_isActive_droopId_idx`(`isActive`, `droopId`),
    INDEX `Flavor_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `deliveryMethod` ENUM('PICKUP_CONCON', 'PICKUP_RENACA', 'DELIVERY') NOT NULL,
    `deliveryAddress` TEXT NULL,
    `deliveryCommune` VARCHAR(191) NULL,
    `deliveryNotes` TEXT NULL,
    `deliveryDate` DATETIME(3) NULL,
    `deliveryTimeSlot` VARCHAR(191) NULL,
    `subtotalClp` INTEGER NOT NULL,
    `discountClp` INTEGER NOT NULL DEFAULT 0,
    `shippingClp` INTEGER NOT NULL DEFAULT 0,
    `totalClp` INTEGER NOT NULL,
    `couponCode` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PAID', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentProvider` ENUM('MERCADO_PAGO', 'TRANSBANK', 'KHIPU') NOT NULL,
    `paymentId` VARCHAR(191) NULL,
    `paymentStatus` ENUM('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `publicToken` VARCHAR(191) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `preparingAt` DATETIME(3) NULL,
    `inTransitAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `Order_publicToken_key`(`publicToken`),
    INDEX `Order_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Order_paymentId_idx`(`paymentId`),
    INDEX `Order_deliveryDate_idx`(`deliveryDate`),
    INDEX `Order_couponCode_idx`(`couponCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `boxId` VARCHAR(191) NOT NULL,
    `boxNameSnapshot` VARCHAR(191) NOT NULL,
    `boxPriceSnapshot` INTEGER NOT NULL,
    `flavors` JSON NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `lineTotalClp` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_boxId_idx`(`boxId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING') NOT NULL,
    `value` INTEGER NOT NULL,
    `minOrderClp` INTEGER NULL,
    `maxUses` INTEGER NULL,
    `usesCount` INTEGER NOT NULL DEFAULT 0,
    `maxUsesPerUser` INTEGER NULL,
    `validFrom` DATETIME(3) NOT NULL,
    `validTo` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_code_isActive_idx`(`code`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoverageZone` (
    `id` VARCHAR(191) NOT NULL,
    `commune` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `shippingClp` INTEGER NOT NULL,
    `freeShippingThresholdClp` INTEGER NULL,
    `freeShippingMinBoxes` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CoverageZone_isActive_idx`(`isActive`),
    UNIQUE INDEX `CoverageZone_commune_region_key`(`commune`, `region`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'OPERATOR', 'VIEWER') NOT NULL DEFAULT 'OPERATOR',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    INDEX `AdminUser_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookLog` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('MERCADO_PAGO', 'TRANSBANK', 'KHIPU') NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NULL,
    `payload` JSON NOT NULL,
    `headers` JSON NOT NULL,
    `status` ENUM('RECEIVED', 'PROCESSED', 'FAILED', 'DUPLICATE') NOT NULL DEFAULT 'RECEIVED',
    `errorMessage` TEXT NULL,
    `orderId` VARCHAR(191) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `WebhookLog_provider_status_idx`(`provider`, `status`),
    INDEX `WebhookLog_orderId_idx`(`orderId`),
    UNIQUE INDEX `WebhookLog_provider_externalId_key`(`provider`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteSetting` (
    `key` VARCHAR(80) NOT NULL,
    `value` TEXT NOT NULL,
    `description` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Flavor` ADD CONSTRAINT `Flavor_droopId_fkey` FOREIGN KEY (`droopId`) REFERENCES `Droop`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_couponCode_fkey` FOREIGN KEY (`couponCode`) REFERENCES `Coupon`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_boxId_fkey` FOREIGN KEY (`boxId`) REFERENCES `Box`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebhookLog` ADD CONSTRAINT `WebhookLog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
