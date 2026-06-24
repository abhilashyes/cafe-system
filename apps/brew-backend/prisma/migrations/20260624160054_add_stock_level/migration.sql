-- CreateTable
CREATE TABLE "StockLevel" (
    "storeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "onHand" INTEGER NOT NULL,

    CONSTRAINT "StockLevel_pkey" PRIMARY KEY ("storeId","ingredientId")
);
