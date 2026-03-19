import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import path from "path";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { generateExcelReport, generateAllCompletedOrdersReport } from "./services/excel";
import { lookupIMEI } from "./services/imei";
import { insertInspectionSchema, insertOrderSchema } from "../shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
  }
}

const VALID_STATUSES = new Set(["scanning", "photographed", "completed"]);

function getSessionSecret() {
  return process.env.SESSION_SECRET || "phone-inspection-demo-session-key-change-me";
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function parseOrderNotes(notes?: string | null) {
  if (!notes) return { client: "—", description: "—" };
  const [clientLine, descriptionLine] = notes.split("\n");
  return {
    client: clientLine?.replace(/^Client:\s*/, "") || "—",
    description: descriptionLine?.replace(/^Description:\s*/, "") || notes,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    "/temp",
    express.static(path.join(process.cwd(), "temp"), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".xlsx")) {
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          );
          res.setHeader("Content-Disposition", "attachment");
          res.setHeader("Cache-Control", "no-store");
        }
      },
    }),
  );

  app.use(
    session({
      name: "phone-inspection.sid",
      secret: getSessionSecret(),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: isProduction(),
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
      },
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      mode: "demo",
      database: "in-memory",
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password } = req.body;
      const normalizedUsername = typeof username === "string" ? username.trim() : "";
      const normalizedPassword = typeof password === "string" ? password.trim() : "";

      if (!normalizedUsername || !normalizedPassword) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const existing = await storage.getUserByUsername(normalizedUsername);
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      const user = await storage.createUser({ username: normalizedUsername, password: "demo" });
      return res.json({ id: user.id, username: user.username });
    } catch (err) {
      console.error("Signup error:", err);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { username, password } = req.body;
      const normalizedUsername = typeof username === "string" ? username.trim() : "";
      const normalizedPassword = typeof password === "string" ? password.trim() : "";

      if (!normalizedUsername || !normalizedPassword) {
        return res.status(400).json({ message: "Please enter both username and password" });
      }

      let user = await storage.getUserByUsername(normalizedUsername);
      if (!user) {
        user = await storage.createUser({ username: normalizedUsername, password: "demo" });
      }

      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
      });
    } catch (error) {
      console.error("Sign in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("phone-inspection.sid");
      res.json({ message: "Signed out successfully" });
    });
  });

  const requireAuth = (req: Request & { session: any }, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/orders", requireAuth, async (req: any, res) => {
    try {
      const parsed = insertOrderSchema.safeParse({
        orderNumber: req.body.orderNumber,
        expectedQuantity: Number(req.body.expectedQuantity),
        notes: typeof req.body.notes === "string" ? req.body.notes.trim() : undefined,
      });

      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid order payload" });
      }

      if (parsed.data.orderNumber && !/^\d{12}$/.test(parsed.data.orderNumber)) {
        return res.status(400).json({ message: "Order number must be exactly 12 digits" });
      }

      const order = await storage.createOrder({
        ...parsed.data,
        createdBy: req.session.userId,
      });
      res.json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/recent", requireAuth, async (_req, res) => {
    try {
      const orders = await storage.getRecentOrders(5);
      res.json(orders);
    } catch (error) {
      console.error("Get recent orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders", requireAuth, async (_req, res) => {
    try {
      const orders = await storage.getRecentOrders(50);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:orderNumber", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.put("/api/orders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const orderId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order id" });
      }

      const updateData = {
        orderNumber: typeof req.body.orderNumber === "string" ? req.body.orderNumber.trim() : undefined,
        expectedQuantity: req.body.expectedQuantity !== undefined ? Number(req.body.expectedQuantity) : undefined,
        notes: typeof req.body.notes === "string" ? req.body.notes.trim() : undefined,
      };

      if (updateData.orderNumber && !updateData.orderNumber.match(/^\d{12}$/)) {
        return res.status(400).json({ message: "Order number must be exactly 12 digits" });
      }

      if (updateData.expectedQuantity !== undefined && (!Number.isInteger(updateData.expectedQuantity) || updateData.expectedQuantity <= 0)) {
        return res.status(400).json({ message: "Expected quantity must be a positive integer" });
      }

      await storage.updateOrder(orderId, updateData);
      res.json({ message: "Order updated successfully" });
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.get("/api/orders/:id/details", requireAuth, async (req: Request, res: Response) => {
    try {
      const orderId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order id" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const inspections = await storage.getInspectionsByOrder(orderId);

      res.json({
        order: {
          ...order,
          noteSummary: parseOrderNotes(order.notes),
        },
        inspections: inspections.map((inspection) => ({
          ...inspection,
          hasImages: inspection.images && inspection.images.length > 0,
          isCompleted: inspection.status === "completed",
        })),
      });
    } catch (error) {
      console.error("Get order details error:", error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  app.get("/api/orders/:orderId/inspections", requireAuth, async (req, res) => {
    try {
      const orderId = Number.parseInt(req.params.orderId, 10);
      if (Number.isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order id" });
      }

      const inspections = await storage.getInspectionsByOrder(orderId);
      res.json(inspections);
    } catch (error) {
      console.error("Get inspections error:", error);
      res.status(500).json({ message: "Failed to fetch inspections" });
    }
  });

  app.get("/api/imei/:imei", requireAuth, async (req: Request, res: Response) => {
    try {
      const specs = await lookupIMEI(req.params.imei);
      res.json(specs);
    } catch (error: any) {
      console.error("IMEI lookup error:", error);
      res.status(400).json({ message: error.message || "Failed to lookup IMEI" });
    }
  });

  app.post("/api/inspections", requireAuth, async (req: any, res) => {
    try {
      const parsed = insertInspectionSchema.safeParse({
        imei: typeof req.body.imei === "string" ? req.body.imei.trim() : "",
        orderId: Number(req.body.orderId),
        phoneSpecs: req.body.phoneSpecs,
        grade: typeof req.body.grade === "string" ? req.body.grade : undefined,
        defects: Array.isArray(req.body.defects) ? req.body.defects : undefined,
        notes: typeof req.body.notes === "string" ? req.body.notes.trim() : undefined,
        images: Array.isArray(req.body.images) ? req.body.images : undefined,
      });

      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid inspection payload" });
      }

      const { imei, orderId, phoneSpecs, grade, defects, notes, images } = parsed.data;

      if (!/^\d{15}$/.test(imei)) {
        return res.status(400).json({ message: "IMEI must be exactly 15 digits" });
      }

      const existingInspection = await storage.getInspectionByImei(imei, orderId!);
      if (existingInspection) {
        return res.status(400).json({
          message: "IMEI already exists for this order",
          existingInspection,
        });
      }

      const inspection = await storage.createInspection({
        imei,
        orderId,
        phoneSpecs,
        grade,
        defects,
        notes,
        images,
        inspectorId: req.session.userId,
      });
      res.json(inspection);
    } catch (error) {
      console.error("Create inspection error:", error);
      res.status(500).json({ message: "Failed to create inspection" });
    }
  });

  app.get("/api/inspections/imei/:imei/order/:orderId", requireAuth, async (req, res) => {
    try {
      const orderId = Number.parseInt(req.params.orderId, 10);
      if (Number.isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order id" });
      }

      const inspection = await storage.getInspectionByImei(req.params.imei, orderId);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Get inspection error:", error);
      res.status(500).json({ message: "Failed to fetch inspection" });
    }
  });

  app.get("/api/inspections/order/:orderId", requireAuth, async (req, res) => {
    try {
      const orderId = Number.parseInt(req.params.orderId, 10);
      if (Number.isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order id" });
      }

      const inspections = await storage.getInspectionsByOrder(orderId);
      res.json(inspections);
    } catch (error) {
      console.error("Get inspections error:", error);
      res.status(500).json({ message: "Failed to fetch inspections" });
    }
  });

  app.put("/api/inspections/:id", requireAuth, async (req, res) => {
    try {
      const inspectionId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(inspectionId)) {
        return res.status(400).json({ message: "Invalid inspection id" });
      }

      const inspection = await storage.getInspection(inspectionId);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      const { grade, defects, notes, phoneSpecs } = req.body;
      await storage.updateInspection(inspectionId, { grade, defects, notes, phoneSpecs });
      res.json({ message: "Inspection updated successfully" });
    } catch (error) {
      console.error("Update inspection error:", error);
      res.status(500).json({ message: "Failed to update inspection" });
    }
  });

  app.put("/api/inspections/:id/status", requireAuth, async (req, res) => {
    try {
      const inspectionId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(inspectionId)) {
        return res.status(400).json({ message: "Invalid inspection id" });
      }

      const { status } = req.body;
      if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
        return res.status(400).json({ message: "Invalid inspection status" });
      }

      const inspection = await storage.getInspection(inspectionId);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      if (status === "completed" && (!inspection.images || inspection.images.length === 0)) {
        return res.status(400).json({ message: "Add at least one image before completing an inspection" });
      }

      await storage.updateInspectionStatus(inspectionId, status, new Date());
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Update inspection status error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.post("/api/inspections/:id/images", requireAuth, async (req: Request, res: Response) => {
    try {
      const inspectionId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(inspectionId)) {
        return res.status(400).json({ message: "Invalid inspection id" });
      }

      const inspection = await storage.getInspection(inspectionId);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      const imageCountHeader = req.headers["x-demo-image-count"];
      const imageCount = Number(Array.isArray(imageCountHeader) ? imageCountHeader[0] : imageCountHeader || 0);
      if (!imageCount || imageCount < 1) {
        return res.status(400).json({ message: "Select at least one image to upload" });
      }

      const mockImageUrls = Array.from({ length: imageCount }, (_, index) => `/images/demo-upload-${inspectionId}-${index + 1}.jpg`);

      await storage.updateInspectionImages(inspectionId, mockImageUrls);
      await storage.updateInspectionStatus(inspectionId, "photographed", new Date());
      res.json({ imageUrls: mockImageUrls });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  app.delete("/api/inspections/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const inspectionId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(inspectionId)) {
        return res.status(400).json({ message: "Invalid inspection id" });
      }

      const inspection = await storage.getInspection(inspectionId);
      if (!inspection) {
        return res.status(404).json({ message: "Inspection not found" });
      }

      await storage.deleteInspection(inspectionId);
      res.json({ message: "Inspection deleted successfully" });
    } catch (error) {
      console.error("Delete inspection error:", error);
      res.status(500).json({ message: "Failed to delete inspection" });
    }
  });

  app.post("/api/reports/excel/all", requireAuth, async (_req: Request, res: Response) => {
    try {
      const reportUrl = await generateAllCompletedOrdersReport();
      res.json({ reportUrl, filename: "all-completed-orders" });
    } catch (error: any) {
      console.error("All-orders Excel error:", error);
      res.status(500).json({ message: error.message || "Failed to generate report" });
    }
  });

  app.post("/api/reports/excel", requireAuth, async (req: Request, res: Response) => {
    try {
      const orderId = Number(req.body.orderId);
      if (!Number.isInteger(orderId)) {
        return res.status(400).json({ message: "Invalid order id" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const inspections = await storage.getInspectionsByOrder(orderId);
      const reportUrl = await generateExcelReport(orderId);

      res.json({
        reportUrl,
        orderNumber: order.orderNumber,
        totalInspections: inspections.length,
      });
    } catch (error) {
      console.error("Excel report error:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get("/api/reports/download/:filename", requireAuth, async (req: Request, res: Response) => {
    try {
      const filename = path.basename(req.params.filename);
      if (!filename.endsWith(".xlsx")) {
        return res.status(400).json({ message: "Invalid file type" });
      }

      const filePath = path.join(process.cwd(), "temp", filename);
      const fs = await import("fs");
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
