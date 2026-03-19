import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { storage } from "../storage";

function runPythonScript(reportData: object, filename: string): Promise<string> {
  const outputPath = path.join(process.cwd(), "temp", filename);
  const pythonScript = path.join(process.cwd(), "scripts", "generate_excel.py");
  const dataJsonPath = path.join(process.cwd(), "temp", `data-${Date.now()}.json`);

  if (!fs.existsSync(path.dirname(dataJsonPath))) {
    fs.mkdirSync(path.dirname(dataJsonPath), { recursive: true });
  }
  fs.writeFileSync(dataJsonPath, JSON.stringify(reportData, null, 2));

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [pythonScript, dataJsonPath, outputPath]);
    pythonProcess.stdout.on("data", (data) => console.log(`Python stdout: ${data}`));
    pythonProcess.stderr.on("data", (data) => console.error(`Python stderr: ${data}`));
    pythonProcess.on("close", (code) => {
      try { fs.unlinkSync(dataJsonPath); } catch {}
      if (code !== 0) { reject(new Error(`Python script exited with code ${code}`)); return; }
      resolve(`/temp/${filename}`);
    });
  });
}

export async function generateExcelReport(orderId: number): Promise<string> {
  const order = await storage.getOrder(orderId);
  if (!order) throw new Error("Order not found");
  const inspections = await storage.getInspectionsByOrder(orderId);
  const filename = `inspection-report-${order.orderNumber}-${Date.now()}.xlsx`;
  return runPythonScript({ order, inspections, timestamp: new Date().toISOString() }, filename);
}

export async function generateAllCompletedOrdersReport(): Promise<string> {
  const allOrders = await storage.getRecentOrders(200);
  const completedOrders = allOrders.filter((o) => o.status === "completed");
  if (completedOrders.length === 0) throw new Error("No completed orders found");

  const orders = await Promise.all(
    completedOrders.map(async (order) => ({
      order,
      inspections: await storage.getInspectionsByOrder(order.id),
    }))
  );

  const filename = `all-completed-orders-${Date.now()}.xlsx`;
  return runPythonScript({ mode: "all", orders, timestamp: new Date().toISOString() }, filename);
}
