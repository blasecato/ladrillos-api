-- CreateTable
CREATE TABLE "waste_reasons" (
    "id" SMALLSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "waste_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brick_waste" (
    "id" BIGSERIAL NOT NULL,
    "brick_yard_id" BIGINT NOT NULL,
    "brick_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason_id" SMALLINT NOT NULL,
    "notes" TEXT,
    "order_id" BIGINT,
    "movement_id" BIGINT,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brick_waste_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waste_reasons_code_key" ON "waste_reasons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "brick_waste_movement_id_key" ON "brick_waste"("movement_id");

-- CreateIndex
CREATE INDEX "brick_waste_brick_yard_id_brick_id_idx" ON "brick_waste"("brick_yard_id", "brick_id");

-- CreateIndex
CREATE INDEX "brick_waste_reason_id_idx" ON "brick_waste"("reason_id");

-- CreateIndex
CREATE INDEX "brick_waste_occurred_at_idx" ON "brick_waste"("occurred_at");

-- AddForeignKey
ALTER TABLE "brick_waste" ADD CONSTRAINT "brick_waste_brick_yard_id_fkey" FOREIGN KEY ("brick_yard_id") REFERENCES "brick_yards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "brick_waste" ADD CONSTRAINT "brick_waste_brick_id_fkey" FOREIGN KEY ("brick_id") REFERENCES "bricks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "brick_waste" ADD CONSTRAINT "brick_waste_reason_id_fkey" FOREIGN KEY ("reason_id") REFERENCES "waste_reasons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "brick_waste" ADD CONSTRAINT "brick_waste_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "brick_waste" ADD CONSTRAINT "brick_waste_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "inventory_movements"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "brick_waste" ADD CONSTRAINT "brick_waste_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Una merma siempre danna al menos un ladrillo (mismo criterio que order_items).
ALTER TABLE "brick_waste" ADD CONSTRAINT "brick_waste_quantity_check" CHECK ("quantity" > 0);

-- Catalogo inicial de motivos de merma.
INSERT INTO "waste_reasons" ("code", "name") VALUES
    ('loading', 'Dano en cargue'),
    ('transport', 'Dano en transporte'),
    ('firing', 'Dano en quema/horneado'),
    ('drying', 'Dano en secado'),
    ('handling', 'Dano en manipulacion o almacenamiento'),
    ('defect', 'Defecto de fabricacion'),
    ('weather', 'Dano por clima'),
    ('other', 'Otro')
ON CONFLICT ("code") DO NOTHING;
