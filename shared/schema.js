"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertInspectionSchema = exports.insertOrderSchema = exports.insertUserSchema = exports.inspections = exports.orders = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    role: (0, pg_core_1.text)("role").notNull().default("inspector"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    orderNumber: (0, pg_core_1.text)("order_number").notNull().unique(),
    expectedQuantity: (0, pg_core_1.integer)("expected_quantity").notNull(),
    notes: (0, pg_core_1.text)("notes"),
    status: (0, pg_core_1.text)("status").notNull().default("active"), // active, completed
    createdBy: (0, pg_core_1.integer)("created_by").references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
});
exports.inspections = (0, pg_core_1.pgTable)("inspections", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    imei: (0, pg_core_1.text)("imei").notNull(),
    orderId: (0, pg_core_1.integer)("order_id").references(() => exports.orders.id),
    inspectorId: (0, pg_core_1.integer)("inspector_id").references(() => exports.users.id),
    phoneSpecs: (0, pg_core_1.jsonb)("phone_specs"), // brand, model, storage, color
    grade: (0, pg_core_1.text)("grade"), // A, B, C, D
    defects: (0, pg_core_1.text)("defects").array().default([]),
    notes: (0, pg_core_1.text)("notes"),
    images: (0, pg_core_1.text)("images").array().default([]),
    status: (0, pg_core_1.text)("status").notNull().default("scanning"), // scanning, photographed, completed
    scannedAt: (0, pg_core_1.timestamp)("scanned_at"),
    photographedAt: (0, pg_core_1.timestamp)("photographed_at"),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).pick({
    username: true,
    password: true,
    role: true,
});
exports.insertOrderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.orders).pick({
    orderNumber: true,
    expectedQuantity: true,
    notes: true,
});
exports.insertInspectionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.inspections).pick({
    imei: true,
    orderId: true,
    phoneSpecs: true,
    grade: true,
    defects: true,
    notes: true,
    images: true,
});
