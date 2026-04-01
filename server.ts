import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "codelink-secret-key";

// Database Setup
const db = new Database("codelink.db");
db.pragma("foreign_keys = ON");

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'blocked'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('desktop', 'web', 'mobile')),
    price REAL NOT NULL,
    license_type TEXT NOT NULL CHECK(license_type IN ('lifetime', 'subscription'))
  );

  CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    total_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'converted', 'rejected')),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER,
    client_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    total_price REAL NOT NULL,
    discount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    duration_months INTEGER NOT NULL,
    payment_plan TEXT NOT NULL CHECK(payment_plan IN ('cash', 'installments')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled', 'expired')),
    start_date DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    method TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    license_key TEXT UNIQUE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired')),
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed Roles and Admin User if not exists
const seed = () => {
  const roles = db.prepare("SELECT COUNT(*) as count FROM roles").get() as { count: number };
  if (roles.count === 0) {
    db.prepare("INSERT INTO roles (name) VALUES (?)").run("مدير");
    db.prepare("INSERT INTO roles (name) VALUES (?)").run("مبيعات");
    db.prepare("INSERT INTO roles (name) VALUES (?)").run("محاسب");

    const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'مدير'").get() as { id: number };
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO users (username, password, role_id, full_name, email) VALUES (?, ?, ?, ?, ?)")
      .run("admin", hashedPassword, adminRole.id, "مدير النظام", "admin@codelink.com");
  }
};
seed();

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Middleware for Audit Logging
  const auditLog = (userId: number | null, action: string, entity: string, entityId: number | null, details: string) => {
    db.prepare("INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)")
      .run(userId, action, entity, entityId, details);
  };

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE username = ?
    `).get(username) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "بيانات الاعتماد غير صالحة" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role_name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role_name, fullName: user.full_name } });
  });

  // Clients
  app.get("/api/clients", authenticateToken, (req, res) => {
    const clients = db.prepare("SELECT * FROM clients").all();
    res.json(clients);
  });

  app.post("/api/clients", authenticateToken, (req, res) => {
    const { company_name, contact_person, phone, email, address, status } = req.body;
    const result = db.prepare("INSERT INTO clients (company_name, contact_person, phone, email, address, status) VALUES (?, ?, ?, ?, ?, ?)")
      .run(company_name, contact_person, phone, email, address, status || 'active');
    auditLog((req as any).user.id, "CREATE", "clients", Number(result.lastInsertRowid), `تم إنشاء العميل ${company_name}`);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/clients/:id", authenticateToken, (req, res) => {
    const { company_name, contact_person, phone, email, address, status } = req.body;
    db.prepare("UPDATE clients SET company_name = ?, contact_person = ?, phone = ?, email = ?, address = ?, status = ? WHERE id = ?")
      .run(company_name, contact_person, phone, email, address, status, req.params.id);
    auditLog((req as any).user.id, "UPDATE", "clients", Number(req.params.id), `تم تحديث العميل ${company_name}`);
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", authenticateToken, (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", authenticateToken, (req, res) => {
    const { name, type, price, license_type } = req.body;
    const result = db.prepare("INSERT INTO products (name, type, price, license_type) VALUES (?, ?, ?, ?)")
      .run(name, type, price, license_type);
    auditLog((req as any).user.id, "CREATE", "products", Number(result.lastInsertRowid), `تم إنشاء المنتج ${name}`);
    res.json({ id: result.lastInsertRowid });
  });

  // Quotations
  app.get("/api/quotations", authenticateToken, (req, res) => {
    const quotations = db.prepare(`
      SELECT q.*, c.company_name, p.name as product_name 
      FROM quotations q
      JOIN clients c ON q.client_id = c.id
      JOIN products p ON q.product_id = p.id
    `).all();
    res.json(quotations);
  });

  app.post("/api/quotations", authenticateToken, (req, res) => {
    const { client_id, product_id, total_price } = req.body;
    const result = db.prepare("INSERT INTO quotations (client_id, product_id, total_price) VALUES (?, ?, ?)")
      .run(client_id, product_id, total_price);
    auditLog((req as any).user.id, "CREATE", "quotations", Number(result.lastInsertRowid), `تم إنشاء عرض سعر للعميل رقم ${client_id}`);
    res.json({ id: result.lastInsertRowid });
  });

  // Contracts
  app.get("/api/contracts", authenticateToken, (req, res) => {
    const contracts = db.prepare(`
      SELECT con.*, c.company_name, p.name as product_name 
      FROM contracts con
      JOIN clients c ON con.client_id = c.id
      JOIN products p ON con.product_id = p.id
    `).all();
    res.json(contracts);
  });

  app.post("/api/contracts", authenticateToken, (req, res) => {
    const { quotation_id, client_id, product_id, total_price, discount, duration_months, payment_plan } = req.body;
    const result = db.prepare("INSERT INTO contracts (quotation_id, client_id, product_id, total_price, discount, duration_months, payment_plan) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(quotation_id, client_id, product_id, total_price, discount || 0, duration_months, payment_plan);
    
    const contractId = Number(result.lastInsertRowid);

    if (quotation_id) {
      db.prepare("UPDATE quotations SET status = 'converted' WHERE id = ?").run(quotation_id);
    }

    // Generate License
    const licenseKey = `CL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${contractId}`;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + duration_months);
    db.prepare("INSERT INTO licenses (contract_id, client_id, license_key, expiry_date) VALUES (?, ?, ?, ?)")
      .run(contractId, client_id, licenseKey, expiryDate.toISOString().split('T')[0]);

    auditLog((req as any).user.id, "CREATE", "contracts", contractId, `تم إنشاء عقد للعميل رقم ${client_id}`);
    res.json({ id: contractId });
  });

  // Payments
  app.post("/api/payments", authenticateToken, (req, res) => {
    const { contract_id, amount, method, notes } = req.body;
    const result = db.prepare("INSERT INTO payments (contract_id, amount, method, notes) VALUES (?, ?, ?, ?)")
      .run(contract_id, amount, method, notes || "");
    
    // Update contract paid amount
    const contract = db.prepare("SELECT * FROM contracts WHERE id = ?").get(contract_id) as any;
    const newPaidAmount = contract.paid_amount + amount;
    const netTotal = contract.total_price - (contract.discount || 0);
    let status = 'active';
    if (newPaidAmount >= netTotal) status = 'completed';
    
    db.prepare("UPDATE contracts SET paid_amount = ?, status = ? WHERE id = ?")
      .run(newPaidAmount, status, contract_id);

    auditLog((req as any).user.id, "CREATE", "payments", Number(result.lastInsertRowid), `دفعة بقيمة ${amount} للعقد رقم ${contract_id}`);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/payments", authenticateToken, (req, res) => {
    const payments = db.prepare(`
      SELECT py.*, con.product_id, p.name as product_name, c.company_name, con.total_price as contract_total, con.discount as contract_discount, con.paid_amount as contract_paid
      FROM payments py
      JOIN contracts con ON py.contract_id = con.id
      JOIN clients c ON con.client_id = c.id
      JOIN products p ON con.product_id = p.id
      ORDER BY py.payment_date DESC
    `).all();
    res.json(payments);
  });

  // Licenses
  app.get("/api/licenses", authenticateToken, (req, res) => {
    const licenses = db.prepare(`
      SELECT l.*, c.company_name, p.name as product_name
      FROM licenses l
      JOIN clients c ON l.client_id = c.id
      JOIN contracts con ON l.contract_id = con.id
      JOIN products p ON con.product_id = p.id
    `).all();
    res.json(licenses);
  });

  // Dashboard Stats
  app.get("/api/stats", authenticateToken, (req, res) => {
    const totalRevenue = db.prepare("SELECT SUM(amount) as total FROM payments").get() as any;
    const activeContracts = db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status = 'active'").get() as any;
    const outstandingBalance = db.prepare("SELECT SUM(total_price - COALESCE(discount, 0) - paid_amount) as total FROM contracts WHERE status != 'completed'").get() as any;
    const monthlyIncome = db.prepare(`
      SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as total 
      FROM payments 
      GROUP BY month 
      ORDER BY month DESC 
      LIMIT 12
    `).all();

    res.json({
      totalRevenue: totalRevenue.total || 0,
      activeContracts: activeContracts.count || 0,
      outstandingBalance: outstandingBalance.total || 0,
      monthlyIncome
    });
  });

  // Audit Logs
  app.get("/api/audit-logs", authenticateToken, (req, res) => {
    const logs = db.prepare(`
      SELECT a.*, u.username 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY timestamp DESC
    `).all();
    res.json(logs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:3000`);
  });
}

startServer();
