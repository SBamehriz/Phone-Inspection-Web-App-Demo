import { z } from "zod";

// ---------------------------------------------------------------------------
// Type definitions for the phone inspection data model
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  createdAt: Date | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  expectedQuantity: number;
  notes: string | null;
  status: string;
  createdBy: number | null;
  createdAt: Date | null;
  completedAt: Date | null;
}

export interface Inspection {
  id: number;
  imei: string;
  orderId: number;
  inspectorId: number | null;
  phoneSpecs: any | null;
  grade: string | null;
  defects: string[] | null;
  notes: string | null;
  images: string[] | null;
  status: string;
  scannedAt: Date | null;
  photographedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date | null;
}

// ---------------------------------------------------------------------------
// Validation schemas (Zod)
// ---------------------------------------------------------------------------

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.string().optional(),
});

export const insertOrderSchema = z.object({
  orderNumber: z.string().optional(),
  expectedQuantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const insertInspectionSchema = z.object({
  imei: z.string().min(1),
  orderId: z.number().int().optional(),
  phoneSpecs: z.any().optional(),
  grade: z.string().optional(),
  defects: z.array(z.string()).optional(),
  notes: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
