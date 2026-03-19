import type {
  User,
  InsertUser,
  Order,
  InsertOrder,
  Inspection,
  InsertInspection
} from "../shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOrder(order: InsertOrder & { createdBy: number }): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getRecentOrders(limit?: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<void>;
  updateOrder(id: number, updateData: Partial<InsertOrder & { orderNumber: string }>): Promise<void>;
  createInspection(inspection: InsertInspection & { inspectorId: number }): Promise<Inspection>;
  getInspection(id: number): Promise<Inspection | undefined>;
  getInspectionByImei(imei: string, orderId: number): Promise<Inspection | undefined>;
  getInspectionsByOrder(orderId: number): Promise<Inspection[]>;
  updateInspectionStatus(id: number, status: string, timestamp: Date): Promise<void>;
  updateInspectionImages(id: number, images: string[]): Promise<void>;
  updateInspection(id: number, data: Partial<Inspection>): Promise<void>;
  deleteInspection(id: number): Promise<void>;
  searchInspections(query: string, filters: any): Promise<Inspection[]>;
}

// ---------------------------------------------------------------------------
// In-Memory Storage — pre-seeded with realistic demo data
// ---------------------------------------------------------------------------
export class InMemoryStorage implements IStorage {
  private users: User[] = [];
  private orders: Order[] = [];
  private inspections: Inspection[] = [];
  private nextUserId = 1;
  private nextOrderId = 1;
  private nextInspectionId = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    // --- Demo user -----------------------------------------------------------
    const demoUser: User = {
      id: this.nextUserId++,
      username: "demo",
      password: "$2b$10$demo",
      role: "inspector",
      createdAt: new Date("2025-01-10T09:00:00Z"),
    };
    this.users.push(demoUser);

    // --- Orders --------------------------------------------------------------
    // Orders 1-3: completed. Orders 4-5: active (pending).
    const orderSeeds = [
      {
        orderNumber: "481920374856",
        expectedQuantity: 24,
        notes: "Client: TechBridge Distributors LLC\nDescription: Mixed Apple iPhone 15 Pro and Samsung Galaxy S24 Ultra. Carrier-unlocked, Dallas TX.",
        status: "completed" as const,
        createdAt: new Date("2025-01-08T08:00:00Z"),
        completedAt: new Date("2025-01-10T17:30:00Z"),
      },
      {
        orderNumber: "730184629541",
        expectedQuantity: 22,
        notes: "Client: NextGen Mobile Wholesale\nDescription: Google Pixel 8 Pro, Pixel 8, and Pixel Tablet units. Factory unlocked, Atlanta GA.",
        status: "completed" as const,
        createdAt: new Date("2025-01-20T09:15:00Z"),
        completedAt: new Date("2025-01-22T16:00:00Z"),
      },
      {
        orderNumber: "619284037152",
        expectedQuantity: 20,
        notes: "Client: Meridian Electronics Corp.\nDescription: Apple iPhone 15 and iPad (10th Gen) mixed lot. Unlocked, Miami FL.",
        status: "completed" as const,
        createdAt: new Date("2025-02-05T10:00:00Z"),
        completedAt: new Date("2025-02-07T15:45:00Z"),
      },
      {
        orderNumber: "204857391628",
        expectedQuantity: 15,
        notes: "Client: SkyLine Telecom Partners\nDescription: Apple iPhone 14 restocking order. Carrier-unlocked, Phoenix AZ.",
        status: "active" as const,
        createdAt: new Date("2025-03-10T08:30:00Z"),
        completedAt: null,
      },
      {
        orderNumber: "837465920183",
        expectedQuantity: 18,
        notes: "Client: Primex Global Trade Inc.\nDescription: Samsung Galaxy S24+ and Galaxy Tab S9 mixed lot. Factory unlocked, Chicago IL.",
        status: "active" as const,
        createdAt: new Date("2025-03-15T11:00:00Z"),
        completedAt: null,
      },
    ];

    for (const seed of orderSeeds) {
      this.orders.push({
        id: this.nextOrderId++,
        orderNumber: seed.orderNumber,
        expectedQuantity: seed.expectedQuantity,
        notes: seed.notes,
        status: seed.status,
        createdBy: demoUser.id,
        createdAt: seed.createdAt,
        completedAt: seed.completedAt,
      });
    }

    type InspectionSeed = {
      imei: string;
      specs: { brand: string; model: string; storage: string; color: string };
      grade: string;
      defects: string[];
      notes: string;
    };

    const pushCompleted = (list: InspectionSeed[], orderId: number, baseTime: Date) => {
      for (const ins of list) {
        this.inspections.push({
          id: this.nextInspectionId++,
          imei: ins.imei,
          orderId,
          inspectorId: demoUser.id,
          phoneSpecs: ins.specs,
          grade: ins.grade,
          defects: ins.defects,
          notes: ins.notes,
          images: [],
          status: "completed",
          scannedAt: baseTime,
          photographedAt: new Date(baseTime.getTime() + 3_600_000),
          completedAt: new Date(baseTime.getTime() + 7_200_000),
          createdAt: baseTime,
        });
      }
    };

    // --- Order 1 — TechBridge (24 phones, completed) -------------------------
    // 12 iPhone 15 Pro + 12 Samsung Galaxy S24 Ultra
    pushCompleted([
      { imei: "356741082934561", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "256GB", color: "Black Titanium" },    grade: "A+", defects: [],                              notes: "Mint condition, no signs of use." },
      { imei: "356741082934562", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "256GB", color: "Black Titanium" },    grade: "A",  defects: [],                              notes: "Minor edge wear, display perfect." },
      { imei: "356741082934563", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "256GB", color: "White Titanium" },   grade: "A+", defects: [],                              notes: "Like-new, original packaging marks." },
      { imei: "356741082934564", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "256GB", color: "White Titanium" },   grade: "A",  defects: [],                              notes: "Light scuffs on frame, fully functional." },
      { imei: "356741082934565", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "512GB", color: "Natural Titanium" }, grade: "A+", defects: [],                              notes: "Flawless unit." },
      { imei: "356741082934566", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "512GB", color: "Natural Titanium" }, grade: "A",  defects: [],                              notes: "Small scratch on titanium band." },
      { imei: "356741082934567", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "512GB", color: "Blue Titanium" },    grade: "B+", defects: ["screen-crack"],               notes: "Hairline crack top-right corner, touch unaffected." },
      { imei: "356741082934568", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "512GB", color: "Blue Titanium" },    grade: "B+", defects: ["back-damage"],                notes: "Light scratches on titanium back." },
      { imei: "356741082934569", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "1TB",   color: "Black Titanium" },   grade: "A",  defects: [],                              notes: "Excellent condition, minor use marks." },
      { imei: "356741082934570", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "1TB",   color: "Natural Titanium" }, grade: "B",  defects: ["battery-issue", "back-damage"], notes: "Battery health 79%, rear has visible scratches." },
      { imei: "356741082934571", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "1TB",   color: "White Titanium" },   grade: "A+", defects: [],                              notes: "Perfect condition." },
      { imei: "356741082934572", specs: { brand: "Apple", model: "iPhone 15 Pro", storage: "1TB",   color: "Blue Titanium" },    grade: "C",  defects: ["screen-crack", "water-damage"], notes: "Cracked display, water damage indicator triggered." },
      { imei: "352918407263841", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "256GB", color: "Titanium Black" },  grade: "A+", defects: [],                              notes: "Mint, S Pen intact and undamaged." },
      { imei: "352918407263842", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "256GB", color: "Titanium Black" },  grade: "A",  defects: [],                              notes: "Very light scratches on frame." },
      { imei: "352918407263843", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "256GB", color: "Titanium Gray" },   grade: "A",  defects: [],                              notes: "No defects, S Pen functional." },
      { imei: "352918407263844", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "512GB", color: "Titanium Gray" },   grade: "A+", defects: [],                              notes: "Like-new condition." },
      { imei: "352918407263845", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "512GB", color: "Titanium Violet" }, grade: "B+", defects: ["screen-crack"],               notes: "Small scratch on lower display edge." },
      { imei: "352918407263846", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "512GB", color: "Titanium Violet" }, grade: "A",  defects: [],                              notes: "Good condition overall." },
      { imei: "352918407263847", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "512GB", color: "Titanium Yellow" }, grade: "B",  defects: ["back-damage", "battery-issue"], notes: "Rear panel scratched, battery at 81%." },
      { imei: "352918407263848", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "1TB",   color: "Titanium Black" },  grade: "A",  defects: [],                              notes: "Clean unit, S Pen holder intact." },
      { imei: "352918407263849", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "1TB",   color: "Titanium Gray" },   grade: "A+", defects: [],                              notes: "Excellent condition." },
      { imei: "352918407263850", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "1TB",   color: "Titanium Violet" }, grade: "B+", defects: ["button-stuck"],               notes: "Power button slightly stiff." },
      { imei: "352918407263851", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "1TB",   color: "Titanium Yellow" }, grade: "A",  defects: [],                              notes: "Minor wear, fully functional." },
      { imei: "352918407263852", specs: { brand: "Samsung", model: "Galaxy S24 Ultra", storage: "1TB",   color: "Titanium Yellow" }, grade: "C",  defects: ["screen-crack", "camera-malfunction"], notes: "Cracked display, rear camera intermittent." },
    ], 1, new Date("2025-01-09T09:00:00Z"));

    // --- Order 2 — NextGen (22 phones, completed) ----------------------------
    // 6 Pixel 8 Pro + 10 Pixel 8 + 6 Pixel Tablet (no IMEI → placeholder)
    pushCompleted([
      { imei: "862047193820541", specs: { brand: "Google", model: "Pixel 8 Pro", storage: "128GB", color: "Obsidian" },  grade: "A+", defects: [],                notes: "Pristine condition." },
      { imei: "862047193820542", specs: { brand: "Google", model: "Pixel 8 Pro", storage: "128GB", color: "Obsidian" },  grade: "A",  defects: [],                notes: "Minor scuffs on frame." },
      { imei: "862047193820543", specs: { brand: "Google", model: "Pixel 8 Pro", storage: "256GB", color: "Porcelain" }, grade: "A+", defects: [],                notes: "Like-new, no marks." },
      { imei: "862047193820544", specs: { brand: "Google", model: "Pixel 8 Pro", storage: "256GB", color: "Bay" },       grade: "A",  defects: [],                notes: "Very good condition." },
      { imei: "862047193820545", specs: { brand: "Google", model: "Pixel 8 Pro", storage: "512GB", color: "Obsidian" },  grade: "B+", defects: ["back-damage"],   notes: "Light scratches on rear glass." },
      { imei: "862047193820546", specs: { brand: "Google", model: "Pixel 8 Pro", storage: "512GB", color: "Hazel" },     grade: "A",  defects: [],                notes: "Good condition, clean." },
      { imei: "862047193820547", specs: { brand: "Google", model: "Pixel 8", storage: "128GB", color: "Obsidian" },      grade: "A+", defects: [],                notes: "Excellent, no visible wear." },
      { imei: "862047193820548", specs: { brand: "Google", model: "Pixel 8", storage: "128GB", color: "Hazel" },         grade: "A",  defects: [],                notes: "Very light edge wear." },
      { imei: "862047193820549", specs: { brand: "Google", model: "Pixel 8", storage: "128GB", color: "Rose" },          grade: "A",  defects: [],                notes: "Clean unit." },
      { imei: "862047193820550", specs: { brand: "Google", model: "Pixel 8", storage: "128GB", color: "Mint" },          grade: "B+", defects: ["screen-crack"],  notes: "Hairline crack bottom-left, display functional." },
      { imei: "862047193820551", specs: { brand: "Google", model: "Pixel 8", storage: "256GB", color: "Obsidian" },      grade: "A",  defects: [],                notes: "No defects found." },
      { imei: "862047193820552", specs: { brand: "Google", model: "Pixel 8", storage: "256GB", color: "Hazel" },         grade: "A+", defects: [],                notes: "Like-new." },
      { imei: "862047193820553", specs: { brand: "Google", model: "Pixel 8", storage: "256GB", color: "Rose" },          grade: "B",  defects: ["battery-issue", "back-damage"], notes: "Battery at 80%, rear scratched." },
      { imei: "862047193820554", specs: { brand: "Google", model: "Pixel 8", storage: "256GB", color: "Mint" },          grade: "A",  defects: [],                notes: "Good overall condition." },
      { imei: "862047193820555", specs: { brand: "Google", model: "Pixel 8", storage: "256GB", color: "Obsidian" },      grade: "C",  defects: ["screen-crack", "camera-malfunction"], notes: "Display cracked, front camera blurry." },
      { imei: "862047193820556", specs: { brand: "Google", model: "Pixel 8", storage: "256GB", color: "Hazel" },         grade: "A",  defects: [],                notes: "Clean, fully functional." },
      { imei: "TAB000000000001", specs: { brand: "Google", model: "Pixel Tablet", storage: "128GB", color: "Hazel" },     grade: "A+", defects: [],                notes: "Mint tablet, stylus port clean." },
      { imei: "TAB000000000002", specs: { brand: "Google", model: "Pixel Tablet", storage: "128GB", color: "Hazel" },     grade: "A",  defects: [],                notes: "Minor edge wear." },
      { imei: "TAB000000000003", specs: { brand: "Google", model: "Pixel Tablet", storage: "128GB", color: "Porcelain" }, grade: "A+", defects: [],                notes: "Like-new condition." },
      { imei: "TAB000000000004", specs: { brand: "Google", model: "Pixel Tablet", storage: "256GB", color: "Porcelain" }, grade: "B+", defects: ["screen-crack"],  notes: "Hairline crack on corner, display works fine." },
      { imei: "TAB000000000005", specs: { brand: "Google", model: "Pixel Tablet", storage: "256GB", color: "Rose" },      grade: "A",  defects: [],                notes: "Very good condition." },
      { imei: "TAB000000000006", specs: { brand: "Google", model: "Pixel Tablet", storage: "256GB", color: "Hazel" },     grade: "B",  defects: ["back-damage"],   notes: "Rear panel has visible scratches." },
    ], 2, new Date("2025-01-21T09:00:00Z"));

    // --- Order 3 — Meridian (20 phones, completed) ---------------------------
    // 12 iPhone 15 + 8 iPad 10th Gen (no IMEI → placeholder)
    pushCompleted([
      { imei: "359301847362901", specs: { brand: "Apple", model: "iPhone 15", storage: "128GB", color: "Black" },   grade: "A+", defects: [],                              notes: "Perfect condition." },
      { imei: "359301847362902", specs: { brand: "Apple", model: "iPhone 15", storage: "128GB", color: "Black" },   grade: "A",  defects: [],                              notes: "Very slight scuff on frame." },
      { imei: "359301847362903", specs: { brand: "Apple", model: "iPhone 15", storage: "128GB", color: "Blue" },    grade: "A",  defects: [],                              notes: "Clean unit." },
      { imei: "359301847362904", specs: { brand: "Apple", model: "iPhone 15", storage: "128GB", color: "Pink" },    grade: "A+", defects: [],                              notes: "Like-new, no blemishes." },
      { imei: "359301847362905", specs: { brand: "Apple", model: "iPhone 15", storage: "256GB", color: "Yellow" },  grade: "A",  defects: [],                              notes: "Good condition overall." },
      { imei: "359301847362906", specs: { brand: "Apple", model: "iPhone 15", storage: "256GB", color: "Green" },   grade: "B+", defects: ["back-damage"],                notes: "Light scratches on rear glass." },
      { imei: "359301847362907", specs: { brand: "Apple", model: "iPhone 15", storage: "256GB", color: "Black" },   grade: "A",  defects: [],                              notes: "No defects." },
      { imei: "359301847362908", specs: { brand: "Apple", model: "iPhone 15", storage: "256GB", color: "Blue" },    grade: "B+", defects: ["screen-crack"],               notes: "Small crack near bottom edge." },
      { imei: "359301847362909", specs: { brand: "Apple", model: "iPhone 15", storage: "512GB", color: "Pink" },    grade: "A",  defects: [],                              notes: "Very good condition." },
      { imei: "359301847362910", specs: { brand: "Apple", model: "iPhone 15", storage: "512GB", color: "Yellow" },  grade: "B",  defects: ["battery-issue"],               notes: "Battery health at 78%." },
      { imei: "359301847362911", specs: { brand: "Apple", model: "iPhone 15", storage: "512GB", color: "Black" },   grade: "A+", defects: [],                              notes: "Excellent, pristine." },
      { imei: "359301847362912", specs: { brand: "Apple", model: "iPhone 15", storage: "512GB", color: "Green" },   grade: "C",  defects: ["screen-crack", "water-damage"], notes: "Display cracked, liquid indicator red." },
      { imei: "TAB000000000007", specs: { brand: "Apple", model: "iPad (10th Gen)", storage: "64GB",  color: "Silver" }, grade: "A+", defects: [],               notes: "Like-new iPad." },
      { imei: "TAB000000000008", specs: { brand: "Apple", model: "iPad (10th Gen)", storage: "64GB",  color: "Pink" },   grade: "A",  defects: [],               notes: "Minor scratches on Smart Connector." },
      { imei: "TAB000000000009", specs: { brand: "Apple", model: "iPad (10th Gen)", storage: "64GB",  color: "Blue" },   grade: "A",  defects: [],               notes: "Good condition." },
      { imei: "TAB000000000010", specs: { brand: "Apple", model: "iPad (10th Gen)", storage: "64GB",  color: "Yellow" }, grade: "A+", defects: [],               notes: "Pristine unit." },
      { imei: "TAB000000000011", specs: { brand: "Apple", model: "iPad (10th Gen)", storage: "256GB", color: "Silver" }, grade: "B+", defects: ["screen-crack"], notes: "Hairline crack on screen corner." },
      { imei: "TAB000000000012", specs: { brand: "Apple", model: "iPad (10th Gen)", storage: "256GB", color: "Pink" },   grade: "A",  defects: [],               notes: "Very good condition." },
      { imei: "TAB000000000013", specs: { brand: "Apple", model: "iPad (10th Gen)", storage: "256GB", color: "Blue" },   grade: "A",  defects: [],               notes: "Clean, no defects." },
      { imei: "TAB000000000014", specs: { brand: "Apple", model: "iPad (10th Gen)", storage: "256GB", color: "Yellow" }, grade: "B",  defects: ["back-damage"],  notes: "Rear aluminum has deep scratch." },
    ], 3, new Date("2025-02-06T09:00:00Z"));

    // Orders 4 (SkyLine) and 5 (Primex) are active with no inspections yet.
  }

  // --- User operations -------------------------------------------------------
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || "inspector",
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  // --- Order operations ------------------------------------------------------
  async createOrder(orderData: InsertOrder & { createdBy: number }): Promise<Order> {
    const orderNumber =
      orderData.orderNumber || Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const order: Order = {
      id: this.nextOrderId++,
      orderNumber,
      expectedQuantity: orderData.expectedQuantity,
      notes: orderData.notes || null,
      status: "active",
      createdBy: orderData.createdBy,
      createdAt: new Date(),
      completedAt: null,
    };
    this.orders.push(order);
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.find((o) => o.id === id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return this.orders.find((o) => o.orderNumber === orderNumber);
  }

  async getRecentOrders(limit = 10): Promise<Order[]> {
    return [...this.orders]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async updateOrderStatus(id: number, status: string): Promise<void> {
    const order = this.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      if (status === "completed") order.completedAt = new Date();
    }
  }

  async updateOrder(id: number, updateData: Partial<InsertOrder & { orderNumber: string }>): Promise<void> {
    const order = this.orders.find((o) => o.id === id);
    if (order) {
      if (updateData.orderNumber !== undefined) order.orderNumber = updateData.orderNumber;
      if (updateData.expectedQuantity !== undefined) order.expectedQuantity = updateData.expectedQuantity;
      if (updateData.notes !== undefined) order.notes = updateData.notes;
    }
  }

  // --- Inspection operations -------------------------------------------------
  async createInspection(data: InsertInspection & { inspectorId: number }): Promise<Inspection> {
    const inspection: Inspection = {
      id: this.nextInspectionId++,
      imei: data.imei,
      orderId: data.orderId!,
      inspectorId: data.inspectorId,
      phoneSpecs: data.phoneSpecs || null,
      grade: data.grade || null,
      defects: data.defects || [],
      notes: data.notes || null,
      images: data.images || [],
      status: "scanning",
      scannedAt: new Date(),
      photographedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };
    this.inspections.push(inspection);
    return inspection;
  }

  async getInspection(id: number): Promise<Inspection | undefined> {
    return this.inspections.find((i) => i.id === id);
  }

  async getInspectionByImei(imei: string, orderId: number): Promise<Inspection | undefined> {
    return this.inspections.find((i) => i.imei === imei && i.orderId === orderId);
  }

  async getInspectionsByOrder(orderId: number): Promise<Inspection[]> {
    return this.inspections
      .filter((i) => i.orderId === orderId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async updateInspectionStatus(id: number, status: string, timestamp: Date): Promise<void> {
    const inspection = this.inspections.find((i) => i.id === id);
    if (!inspection) return;

    inspection.status = status;
    if (status === "photographed") inspection.photographedAt = timestamp;
    if (status === "completed") inspection.completedAt = timestamp;

    // Auto-complete order if all inspections done
    if (status === "completed" && inspection.orderId) {
      await this.checkAndCompleteOrder(inspection.orderId);
    }
  }

  private async checkAndCompleteOrder(orderId: number): Promise<void> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return;
    const all = this.inspections.filter((i) => i.orderId === orderId);
    if (all.length > 0 && all.every((i) => i.status === "completed")) {
      order.status = "completed";
      order.completedAt = new Date();
    }
  }

  async updateInspectionImages(id: number, images: string[]): Promise<void> {
    const inspection = this.inspections.find((i) => i.id === id);
    if (inspection) inspection.images = images;
  }

  async updateInspection(id: number, data: Partial<Inspection>): Promise<void> {
    const inspection = this.inspections.find((i) => i.id === id);
    if (inspection) {
      if (data.grade !== undefined) inspection.grade = data.grade;
      if (data.defects !== undefined) inspection.defects = data.defects;
      if (data.notes !== undefined) inspection.notes = data.notes;
      if (data.phoneSpecs !== undefined) inspection.phoneSpecs = data.phoneSpecs;
    }
  }

  async deleteInspection(id: number): Promise<void> {
    this.inspections = this.inspections.filter((i) => i.id !== id);
  }

  async searchInspections(query: string, filters: any): Promise<Inspection[]> {
    let results = [...this.inspections];
    if (query) {
      results = results.filter((i) => i.imei.includes(query));
    }
    if (filters?.grade) {
      results = results.filter((i) => i.grade === filters.grade);
    }
    return results.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
}

export const storage = new InMemoryStorage();
