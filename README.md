# ShopFlow — Two-Sided Multi-Vendor Local Shopping Platform

ShopFlow is a modern, production-grade local shopping web application that connects neighborhood shopkeepers with local customers. Customers can discover nearby physical stores via GPS or unique Shop IDs, browse live product inventories, and pay directly to the vendor's UPI account with 0% gateway commission. Once payment is confirmed, a unique 8-character **Pickup ID** is issued for in-store collection.

---

## 🌟 Core Highlights

1. **Two-Sided Platform:**
   - **Vendor Portal:** Complete shop management, real-time inventory tracking, categorised catalogs, manual direct UPI payment verification, live pickup queues, in-store Walk-in POS terminal, and financial sales analytics.
   - **Customer Experience:** GPS-assisted shop discovery, single-shop browsing, verified cart calculations, zero-cost direct UPI payments, active Pickup ID tracking, and printable purchase receipts.

2. **Strict Single-Shop Order Rule:**
   - To reflect physical retail fulfillment, an order belongs to exactly one shop at a time. The platform provides automated cross-shop conflict resolution and server-side ownership validation.

3. **Zero-Cost Direct UPI Payment Architecture:**
   - No payment gateway charges or third-party platform cuts.
   - Dynamic UPI payment links and QR codes prefilled with the vendor's own UPI ID, exact calculated order amount, and unique order reference.
   - Secure verification: payments are verified directly by merchants in their bank/UPI app before releasing Pickup IDs.

4. **Data Isolation & Merchant Privacy:**
   - Vendors only access their own shop and sales records.
   - Sensitive vendor financial information (such as wholesale cost prices, profit margins, and exact warehouse stock quantities) is strictly stripped from all public customer endpoints.

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js (v24+)
- **Framework:** Express.js (v5)
- **Database:** PostgreSQL 18 (`shopflow` database, `public` schema)
- **ORM:** Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs password hashing
- **Security:** In-memory sliding-window rate limiting on OTP endpoints

### Frontend
- **Framework:** React 19
- **Bundler / Dev Server:** Vite 8
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4
- **Icons:** React Icons (`react-icons/fi`)
- **HTTP Client:** Axios (with Bearer token interceptor)

---

## 📁 Repository Structure

```
ShopFlow/
├── client/                     # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI (AuthLayout, Button, BillModal)
│   │   ├── context/            # Global state (CartContext with single-shop rules)
│   │   ├── pages/
│   │   │   ├── customer/       # ShopDiscovery, ShopStorefront, CustomerDashboard, Auth
│   │   │   ├── vendor/         # VendorDashboard, ShopRegistration, Products, Categories, VendorOrders, WalkInPos, Auth
│   │   │   └── Home.jsx        # Two-sided platform landing page
│   │   └── services/           # Axios API modules (auth, shop, product, category, order, dashboard)
│   └── package.json
│
├── server/                     # Node.js + Express + Prisma Backend
│   ├── config/                 # Prisma client instance (`prisma.js`)
│   ├── controllers/            # Controller business logic (auth, shop, product, category, order, dashboard, notification)
│   ├── middleware/             # Role-based auth protection & rate limiters
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL schema & relationships
│   │   └── migrations/         # Version-controlled database migrations
│   ├── routes/                 # Express REST endpoint declarations
│   ├── utils/                  # Unique ID generators (Shop ID, Pickup ID, Order #, Bill #)
│   └── index.js                # Server entry point (port 5000)
│
└── README.md
```

---

## 🗄️ Database Schema & Models

The PostgreSQL database (`shopflow`) is managed via Prisma ORM:

- **`Vendor`**: Shop owner credentials, hashed passwords, verified mobile numbers.
- **`Shop`**: Physical shop name, unique collision-safe `shopId` (e.g. `SHOP-K7N9P`), contact number, address, GPS latitude/longitude, direct `upiId`.
- **`Customer`**: Customer accounts, verified mobile numbers, hashed passwords.
- **`Category`**: Shop-specific product categories (`@@unique([shopId, name])`).
- **`Product`**: Selling price, cost price (private), stock quantity, unit, image URL.
- **`Order`**: Order number, unique 8-character `pickupId` (e.g. `PU-8K3N7P2A`), order type (`ONLINE` | `WALK_IN`), status (`AWAITING_PICKUP` | `COMPLETED`), subtotal, total amount.
- **`OrderItem`**: Historical snapshot of item name, quantity, unit price, and line total.
- **`Payment`**: Payment method (`UPI` | `CASH`), status (`PENDING` | `VERIFIED` | `FAILED`), vendor UPI ID, provider transaction reference.
- **`Bill`**: Official receipt number (e.g. `BILL-20261117-K7PX`), issued timestamp, totals.
- **`Notification`**: Real-time alerts for incoming orders (`NEW_ORDER`) and stock depletion (`OUT_OF_STOCK`).
- **`OtpVerification`**: Secure hashed OTP storage with expiry for registration and password resets.

---

## 🚀 Local Development Setup Guide (Windows)

### Prerequisites
- **Node.js**: v20 or higher (tested on Node.js v24.13.0, npm 11.6.2)
- **PostgreSQL**: PostgreSQL 16+ running locally on port `5432`
- **Git**

### 1. Database Configuration
Ensure your local PostgreSQL server is running and create the `shopflow` database:
```sql
CREATE DATABASE shopflow;
```

### 2. Backend Setup
Navigate into the `server` directory and configure environment variables:
```bash
cd server
npm install
```

Create or verify `server/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/shopflow?schema=public"
JWT_SECRET="your_secure_random_jwt_secret_key_here"
NODE_ENV="development"
```

Apply Prisma database migrations and generate the Prisma Client:
```bash
npx prisma migrate dev
npx prisma generate
```

Start the backend API server:
```bash
npm run dev
# Server will listen on http://localhost:5000
```

### 3. Frontend Setup
In a new terminal window, navigate into the `client` directory:
```bash
cd client
npm install
npm run dev
# Vite will launch on http://localhost:5173
```

---

## 📡 API Reference Catalog

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/vendor/send-otp` | Public (Rate Limited) | Send SMS OTP for vendor registration/reset |
| `POST` | `/api/auth/vendor/verify-otp` | Public | Verify OTP code |
| `POST` | `/api/auth/vendor/register` | Public | Complete vendor registration |
| `POST` | `/api/auth/vendor/login` | Public | Vendor password login |
| `GET` | `/api/auth/vendor/me` | Vendor | Get authenticated vendor and shop profile |
| `POST` | `/api/auth/customer/send-otp` | Public (Rate Limited) | Send OTP for customer registration/reset |
| `POST` | `/api/auth/customer/verify-otp` | Public | Verify customer OTP code |
| `POST` | `/api/auth/customer/register` | Public | Complete customer registration |
| `POST` | `/api/auth/customer/login` | Public | Customer password login |
| `GET` | `/api/auth/customer/me` | Customer | Get customer profile |

### Shops (`/api/shops`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/shops/search` | Public | GPS-assisted radius search or keyword/ID lookup |
| `GET` | `/api/shops/public/:shopId` | Public | Public shop storefront profile |
| `POST` | `/api/shops` | Vendor | Register vendor shop profile |
| `GET` | `/api/shops/me` | Vendor | Get vendor's owned shop |
| `PUT` | `/api/shops/me` | Vendor | Update shop details, GPS coordinates, or UPI ID |

### Products & Inventory (`/api/products`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products/public/shop/:shopId` | Public | Sanitized public catalog (cost prices and stock counts hidden) |
| `POST` | `/api/products` | Vendor | Create product with cost & selling prices |
| `GET` | `/api/products` | Vendor | List all products in vendor's inventory |
| `PUT` | `/api/products/:id` | Vendor | Edit product details |
| `PATCH` | `/api/products/:id/stock` | Vendor | Quick stock increment/decrement or direct update |
| `DELETE` | `/api/products/:id` | Vendor | Safe product deletion |

### Orders, Payments & POS (`/api/orders`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders/calculate-checkout` | Public | Validates cart against live inventory and calculates bill |
| `POST` | `/api/orders/online` | Customer | Place online order, reserve stock, and get direct UPI link |
| `POST` | `/api/orders/:orderId/submit-payment` | Customer | Submit UPI reference/UTR for merchant verification |
| `POST` | `/api/orders/:orderId/verify-payment` | Vendor / Admin | Verify payment, generate unique Pickup ID & Bill |
| `POST` | `/api/orders/:orderId/reject-payment` | Vendor | Reject unverified order and restore inventory stock |
| `POST` | `/api/orders/walk-in` | Vendor | Counter POS sale with instant receipt printing |
| `PATCH` | `/api/orders/:orderId/complete` | Vendor | Mark order as completed and handed over |
| `GET` | `/api/orders/vendor/orders` | Vendor | List shop orders (unverified, ready for pickup, completed) |
| `GET` | `/api/orders/customer/my-orders` | Customer | List customer order history and active pickups |
| `GET` | `/api/orders/:orderId/bill` | Authorized | Fetch full printable bill details |

### Analytics & Dashboards (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/vendor-summary` | Vendor | Today, weekly, monthly, and lifetime sales from verified payments |
| `GET` | `/api/dashboard/customer-summary` | Customer | Total spent, active pickup count, and supported shops |

---

## 🔒 Security Best Practices Implemented

- **Password Hashing:** Passwords securely hashed using bcryptjs with 10 salt rounds.
- **JWT Authentication:** Strict separation between `VENDOR` and `CUSTOMER` roles.
- **Input Validation:** Quantities and IDs validated; checkout totals are recalculated server-side and never trusted from client inputs.
- **Overselling Prevention:** Stock decrements and checks occur inside atomic Prisma interactive transactions (`prisma.$transaction`).
- **Stock Restoration:** If an unverified online order is rejected by the merchant, reserved inventory quantities are restored atomically.
- **Rate Limiting:** In-memory sliding-window limiter guards all OTP routes against flooding.

---

## 📄 License

This project is proprietary software developed for the ShopFlow platform. All rights reserved.
