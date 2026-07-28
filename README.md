<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="NestJS Logo" />
</p>

<h1 align="center">NestJS E-Commerce API</h1>

<p align="center">
  A production-ready, feature-rich RESTful + GraphQL e-commerce backend built with NestJS, MongoDB, Redis, AWS S3, and Stripe.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-IORedis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/GraphQL-Apollo-E10098?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL" />
  <img src="https://img.shields.io/badge/AWS-S3-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS S3" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [API Modules](#-api-modules)
- [Authentication & Security](#-authentication--security)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [API Endpoints Reference](#-api-endpoints-reference)
- [GraphQL API](#-graphql-api)
- [Real-Time Features](#-real-time-features)
- [File Uploads & Storage](#-file-uploads--storage)
- [Payment Integration](#-payment-integration)
- [Caching Strategy](#-caching-strategy)
- [Running Tests](#-running-tests)
- [Design Patterns](#-design-patterns)

---

## 🌟 Overview

This is a **production-grade e-commerce backend API** built with **NestJS** and **TypeScript**. It exposes both a **RESTful HTTP API** and a **GraphQL API**, and is designed with scalability, security, and developer experience in mind.

The application handles the full e-commerce lifecycle — from user registration and authentication (including Google OAuth), to product management, cart operations, coupon discounts, order placement, Stripe payments, and real-time stock updates via WebSockets.

> **For Recruiters & HRs:** This project demonstrates strong backend engineering skills including modular architecture, multi-protocol API design (REST + GraphQL + WebSocket), cloud integrations (AWS S3, Stripe), security best practices (JWT, Argon2 hashing, OTP via email), and clean code organization using NestJS's dependency injection system.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT access/refresh tokens, email OTP verification, Google OAuth 2.0 |
| 🛍️ **Product Management** | CRUD with multi-image upload (main image + gallery) to AWS S3, soft-delete, search & pagination |
| 🗂️ **Categories & Brands** | Full CRUD for organizing products |
| 🛒 **Shopping Cart** | Add/remove/update items; cart is auto-cleared on successful order |
| 🎟️ **Coupons** | Percentage & fixed-amount discounts, usage limits, and expiry dates |
| 📦 **Orders** | Place orders from cart, apply coupons, COD or card payment, order status tracking |
| 💳 **Stripe Payments** | Full card checkout via Stripe Sessions + Payment Intents, webhook handling, automatic refunds on cancellation |
| 📡 **WebSockets** | Real-time stock change broadcasting to connected clients on order placement |
| 🌐 **GraphQL** | Apollo GraphQL alongside REST for querying products and a dual-API architecture |
| ⚡ **Redis Caching** | GET requests cached with Redis via `@nestjs/cache-manager`, OTP storage with TTL |
| ☁️ **AWS S3** | Secure file uploads with presigned URLs for private asset access |
| 🔒 **Role-Based Access** | `ADMIN` and `USER` roles enforced through custom guards and decorators |
| 🌍 **i18n Ready** | Language interceptor with `EN` / `AR` support |
| 🧪 **Testing** | Unit & E2E tests with Jest and Supertest |
| 🔗 **Ngrok Integration** | Automatic public tunnel in development for Stripe webhooks |

---

## 🛠️ Tech Stack

### Core Framework
- **[NestJS v11](https://nestjs.com/)** — Progressive Node.js framework with first-class TypeScript support
- **TypeScript 5.x** — Full static typing throughout the codebase

### Database
- **[MongoDB](https://www.mongodb.com/)** via **[Mongoose](https://mongoosejs.com/)** (`@nestjs/mongoose`) — Document-based database with schema models, soft-delete support, and population

### Caching
- **[Redis](https://redis.io/)** via **[ioredis](https://github.com/redis/ioredis)** — Used for OTP storage (with TTL), FCM token sets, and HTTP response caching

### API Layers
- **REST** — Express-based HTTP controller layer (primary API)
- **[GraphQL](https://graphql.org/)** via **[Apollo Server v5](https://www.apollographql.com/)** (`@nestjs/graphql`, `@nestjs/apollo`) — Code-first schema auto-generation

### Real-Time
- **[Socket.IO](https://socket.io/)** via `@nestjs/websockets` and `@nestjs/platform-socket.io` — WebSocket gateway for live stock updates

### Cloud & Storage
- **[AWS S3](https://aws.amazon.com/s3/)** via `@aws-sdk/client-s3` — Image and asset storage with presigned URL support
- **[Multer](https://github.com/expressjs/multer)** — Multipart file upload handling

### Payments
- **[Stripe](https://stripe.com/)** — Checkout sessions, payment intents, and webhook events for order fulfillment and refunds

### Auth & Security
- **[JWT](https://jwt.io/)** via `@nestjs/jwt` and `jsonwebtoken` — Stateless authentication with access and refresh tokens
- **[Argon2](https://github.com/ranisalt/node-argon2)** — Password and OTP hashing (more secure than bcrypt)
- **[Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs)** — Google ID token verification for OAuth 2.0

### Validation
- **[class-validator](https://github.com/typestack/class-validator)** + **[class-transformer](https://github.com/typestack/class-transformer)** — DTO-based request validation with NestJS `ValidationPipe`
- **[Zod v4](https://zod.dev/)** — Additional schema validation utilities

### Developer Tools
- **[Ngrok](https://ngrok.com/)** (`@ngrok/ngrok`) — Auto-tunneling for local Stripe webhook testing
- **[Nodemailer](https://nodemailer.com/)** — Transactional email (OTP delivery)
- **ESLint + Prettier** — Code quality and formatting
- **[pnpm](https://pnpm.io/)** — Fast, disk-efficient package manager

---

## 🏗️ Architecture

The project follows **NestJS's modular architecture** with a clear separation of concerns:

```
HTTP/GraphQL/WebSocket Request
        │
        ▼
   Global Pipes (ValidationPipe)
        │
        ▼
   Global Interceptors
   ├── WatchInterceptor       (performance logging)
   ├── LanguageInterceptor    (i18n header handling)
   └── ResponseInterceptor    (unified response format)
        │
        ▼
   Guards
   ├── AuthenticationGuard    (JWT verification, supports HTTP / GQL / WS)
   └── AuthorizationGuard     (role-based access control)
        │
        ▼
   Controllers / Resolvers / Gateways
        │
        ▼
   Services (business logic)
        │
        ▼
   Repository Layer (generic CRUD abstraction over Mongoose)
        │
        ▼
   MongoDB (via Mongoose)
```

### Key Architectural Decisions

- **Repository Pattern** — A generic repository abstraction (`common/repository`) wraps all Mongoose operations (find, create, update, delete, paginate), keeping services database-agnostic.
- **Shared Module** — `SharedAuthenticationModule` re-exports the `AuthenticationGuard`, `AuthorizationGuard`, `TokenService`, etc., so they can be consumed by any feature module without re-declaration.
- **Event Emitter** — Email sending is decoupled from business logic using Node's `EventEmitter` (emailEmitter), ensuring that account creation doesn't block on email delivery.
- **Code-First GraphQL** — The GraphQL schema (`src/schema.gql`) is auto-generated from TypeScript decorators, keeping a single source of truth.

---

## 📁 Project Structure

```
src/
├── main.ts                        # App bootstrap, global middleware & ngrok setup
├── app.module.ts                  # Root module — wires all feature modules
├── schema.gql                     # Auto-generated GraphQL schema (code-first)
│
├── common/                        # Shared, reusable building blocks
│   ├── decorators/                # @Auth(), @User(), @Role(), @Token() custom decorators
│   ├── dto/                       # Shared DTOs (e.g. PaginationDto)
│   ├── enums/                     # App-wide enums (roles, order status, payment type, etc.)
│   ├── events/                    # Event emitters (email events)
│   ├── guards/                    # AuthenticationGuard, AuthorizationGuard
│   ├── interceptors/              # Response, Watch, Language, Cache interceptors
│   ├── interfaces/                # TypeScript interfaces for request, user, order, etc.
│   ├── middleware/                # Express-level middleware
│   ├── pipes/                     # Custom validation pipes
│   ├── repository/                # Generic Mongoose repository (find, create, update, paginate)
│   ├── services/
│   │   ├── aws/                   # S3Service — upload, delete, presigned URLs
│   │   ├── email/                 # EmailService — OTP generation and delivery
│   │   ├── jwt/                   # TokenService — JWT sign/verify/decode
│   │   ├── payment/               # PaymentService — Stripe integration
│   │   ├── redis/                 # CacheService — OTP cache, FCM tokens
│   │   └── security/              # SecurityService — Argon2 hash/compare, encryption
│   ├── sharedModules/             # SharedAuthenticationModule export
│   ├── utils/                     # Multer config, file signature verification, socket utils
│   └── validation/                # Custom Zod-based validators
│
├── models/                        # Mongoose schema definitions
│   ├── user/                      # User schema
│   ├── product/                   # Product schema
│   ├── order/                     # Order schema
│   ├── cart/                      # Cart schema
│   ├── coupon/                    # Coupon schema
│   ├── category/                  # Category schema
│   └── brand/                     # Brand schema
│
└── modules/                       # Feature modules (business domains)
    ├── auth/                      # Signup, Login, Email confirmation, Google OAuth
    ├── user/                      # Profile, image upload, presigned S3 URLs
    ├── product/                   # Product CRUD, image management, GraphQL resolver
    ├── category/                  # Category CRUD
    ├── brand/                     # Brand CRUD
    ├── cart/                      # Cart management
    ├── coupon/                    # Coupon creation and validation
    ├── order/                     # Order lifecycle, Stripe checkout & webhooks
    └── realtime/                  # Socket.IO gateway for stock updates
```

---

## 📦 API Modules

### 🔐 Authentication (`/auth`)
Handles all identity and access management.

| Operation | Details |
|---|---|
| Register | Email + password signup with async OTP confirmation email |
| Email Confirmation | OTP-based email verification (stored in Redis with TTL) |
| Resend OTP | Rate-limited OTP resend (blocked while previous OTP is still valid) |
| Login | Returns `accessToken` + `refreshToken`; validates account is confirmed |
| Google OAuth | Signup and login via Google ID Token (server-side verification) |

### 👤 User (`/user`)
Authenticated user management.

| Operation | Details |
|---|---|
| Get Profile | Returns full authenticated user object |
| Upload Profile Image | Single image upload to AWS S3 |
| Upload Cover Images | Multiple image uploads (up to 3) to S3 |
| Presigned URL | Generate a time-limited S3 URL for any stored asset (with optional download header) |

### 🛍️ Product (`/product`)
Product catalog management. Admin-only write operations.

| Operation | Details |
|---|---|
| Create Product | Upload main image + gallery (up to 3), validates MIME type & file signature, stores to S3 |
| Update Product | Partial updates including image replacement and gallery diff (add/remove specific images) |
| Get All Products | Paginated list with text search across name, slug, and description; Redis-cached |
| Get Product by ID | Single product fetch |
| Delete Product | Soft-delete support |

Price logic: `finalPrice = salePrice - (salePrice × discountPercentage / 100)`

### 🗂️ Category (`/category`) & Brand (`/brand`)
CRUD operations for product classification. Admin-only.

### 🛒 Cart (`/cart`)
Shopping cart lifecycle management.

| Operation | Details |
|---|---|
| Add to Cart | Add a product with quantity |
| Update Cart Item | Change item quantity |
| Remove from Cart | Remove specific item |
| Clear Cart | Empty the entire cart |

Cart is automatically cleared when an order is successfully placed.

### 🎟️ Coupon (`/coupon`)
Discount coupon management.

| Feature | Details |
|---|---|
| Coupon Types | `PERCENTAGE` or fixed-amount discount |
| Validity | Date-range controlled (`startDate` / `endDate`) |
| Usage Limits | Per-user usage cap tracked in `usedBy` array |
| Application | Applied at order creation; usage is reversed on order cancellation/refund |

### 📦 Order (`/order`)
Full order lifecycle with payment processing.

| Step | Endpoint | Description |
|---|---|---|
| Place Order | `POST /order` | Creates order from cart, validates stock, applies coupon |
| Card Checkout | `POST /order/:orderId/checkout` | Creates Stripe Session + Payment Intent |
| Confirm Order | `PATCH /order/:orderId/confirm` | Admin marks order as `PLACED` |
| Cancel Order | `POST /order/:orderId/cancel` | Cancels order; triggers Stripe refund if paid by card |
| Stripe Webhook | `POST /order/webhook` | Handles `checkout.session.completed` event |

**Order status flow:** `PENDING` → `PLACED` → `ON_WAY` → `DELIVERED` (or `CANCELED` / `REFUNDED`)

**Cancellation with refund** automatically:
1. Refunds via Stripe Payment Intent
2. Restores product stock
3. Recreates the user's cart with previously ordered items
4. Removes the coupon usage record

---

## 🔒 Authentication & Security

### JWT Strategy
- `accessToken` — short-lived token for API access
- `refreshToken` — longer-lived token for re-authentication
- Tokens are verified in the `AuthenticationGuard`, which supports **HTTP**, **GraphQL**, and **WebSocket** contexts

### Password Security
- Passwords are hashed with **Argon2** (memory-hard algorithm, more resistant to GPU attacks than bcrypt)

### OTP Flow
1. User registers → OTP generated, hashed with Argon2, stored in **Redis** with a TTL
2. User submits OTP → fetched from Redis, compared via Argon2
3. On success → `confirmedAt` field is set on the user document; Redis key is deleted
4. Resend is blocked while a valid OTP still exists in Redis

### Google OAuth
- Frontend sends a Google **ID Token** to the server
- Server verifies the token with Google's auth library (`OAuth2Client.verifyIdToken`)
- Creates a new account or signs in the existing one based on email

### Role-Based Access Control
```
@Auth({ roles: [RoleEnums.ADMIN] })   // Admin-only
@Auth({ roles: [RoleEnums.USER] })    // User-only
@Auth({ roles: [RoleEnums.ADMIN, RoleEnums.USER] })  // Both
```
The `@Auth()` decorator applies both `AuthenticationGuard` and `AuthorizationGuard` simultaneously.

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20.x |
| pnpm | ≥ 11.x |
| MongoDB | Running instance (local or Atlas) |
| Redis | Running instance |
| AWS Account | S3 bucket configured |
| Stripe Account | API keys |

### Installation

```bash
# Clone the repository
git clone https://github.com/abdallah834/NestJs-E-Commerce-App.git
cd NestJs-E-Commerce-App

# Install dependencies
pnpm install
```

---

## ⚙️ Environment Variables

Create a `.env.development` file in the root directory:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_URI=mongodb://localhost:27017/ecommerce

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_BUCKET_NAME=your_bucket_name

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Google OAuth
WEB_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Ngrok (development only)
NGROK_AUTHTOKEN=your_ngrok_auth_token
```

---

## ▶️ Running the App

```bash
# Development (watch mode with auto-reload)
pnpm run start:dev

# Standard start
pnpm run start

# Production mode (requires build first)
pnpm run build
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

When running in development mode, the app automatically starts an **ngrok tunnel** and prints the public URL to the console. Use this URL as your Stripe webhook endpoint:

```
Server is running on port: 3000
Public ngrok URL: https://xxxx.ngrok-free.app
```

Configure your Stripe webhook: `https://xxxx.ngrok-free.app/order/webhook`

---

## 📋 API Endpoints Reference

### Authentication
```
POST   /auth/signup                  Register a new account
PATCH  /auth/confirmEmail            Verify account with OTP
PATCH  /auth/resendConfirmationEmail Resend OTP email
POST   /auth/login                   Login with email & password
POST   /auth/signup/gmail            Register via Google OAuth
POST   /auth/login/gmail             Login via Google OAuth
```

### User
```
GET    /user/profile                 Get authenticated user profile  [USER]
PATCH  /user/profile-image           Upload profile picture to S3
PATCH  /user/profile-cover-images    Upload up to 3 cover images to S3
GET    /user/presigned/*path         Get a presigned S3 URL for an asset
```

### Products
```
POST   /product/create               Create a product (with images)   [ADMIN]
PATCH  /product/:productId           Update a product                 [ADMIN]
GET    /product                      List all products (paginated, cached)
GET    /product/:id                  Get a product by ID
DELETE /product/:id                  Delete a product
```

### Categories & Brands
```
POST   /category                     Create category    [ADMIN]
GET    /category                     List categories
PATCH  /category/:id                 Update category    [ADMIN]
DELETE /category/:id                 Delete category    [ADMIN]

POST   /brand                        Create brand       [ADMIN]
GET    /brand                        List brands
PATCH  /brand/:id                    Update brand       [ADMIN]
DELETE /brand/:id                    Delete brand       [ADMIN]
```

### Cart
```
POST   /cart                         Add item to cart   [USER]
PATCH  /cart                         Update cart item   [USER]
DELETE /cart/:productId              Remove cart item   [USER]
DELETE /cart                         Clear cart         [USER]
```

### Coupons
```
POST   /coupon                       Create coupon      [ADMIN]
GET    /coupon                       List coupons       [ADMIN]
PATCH  /coupon/:id                   Update coupon      [ADMIN]
DELETE /coupon/:id                   Delete coupon      [ADMIN]
```

### Orders
```
POST   /order                        Place an order                   [USER/ADMIN]
POST   /order/:orderId/checkout      Stripe card checkout             [USER/ADMIN]
PATCH  /order/:orderId/confirm       Confirm order (admin)            [ADMIN]
POST   /order/:orderId/cancel        Cancel order (+ auto-refund)     [ADMIN]
POST   /order/webhook                Stripe webhook (raw body)
```

---

## 🔵 GraphQL API

The GraphQL playground is available at: `http://localhost:3000/graphql`

The schema is auto-generated from TypeScript decorators (code-first approach).

### Available Queries

```graphql
# Get paginated products list (Redis-cached)
query {
  allProducts(page: 1, size: 10, search: "laptop") {
    currentPage
    pages
    size
    docs {
      _id
      name
      slug
      finalPrice
      salePrice
      discountPercentage
      stock
      image
      gallery
      createdBy {
        username
        email
      }
    }
  }
}

# Admin-only greeting query (requires Authorization header)
query {
  sayHi(name: "Abdallah", age: 25) {
    name
    age
  }
}
```

### Authentication in GraphQL
Pass the JWT token in the request header:
```
Authorization: Bearer <your_access_token>
```

---

## 📡 Real-Time Features

The app uses **Socket.IO** via a NestJS WebSocket Gateway (`RealTimeModule`).

### Stock Updates
When a user places an order, the `OrderService` calls `RealTimeGateWay.changeStock()`, which broadcasts the updated stock levels of all purchased products to all connected WebSocket clients in real time.

**Client usage example:**
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'Bearer <your_access_token>' }
});

socket.on('stockChanged', (stockUpdates) => {
  // [{ productId: '...', stock: 42 }, ...]
  console.log('Stock updated:', stockUpdates);
});
```

---

## ☁️ File Uploads & Storage

All file uploads are handled through **AWS S3**:

| Asset Type | S3 Path | Notes |
|---|---|---|
| Product main image | `Products/{referenceId}/` | MIME type + file signature validated |
| Product gallery | `Products/{referenceId}/gallery/` | Up to 3 images |
| User profile image | `Users/{userId}/` | Max 3MB |

### File Validation (Double-Layer)
1. **MIME type check** — `FileTypeValidator` from NestJS ensures the content-type header is an image
2. **File signature check** — The file's binary magic bytes are verified (`verifyFileSignature`) to prevent MIME spoofing attacks

### Presigned URLs
Private S3 assets are served via time-limited **presigned URLs**, generated on-demand via `GET /user/presigned/*path`. Supports a `?download=true&filename=myfile.jpg` query for forced browser download.

---

## 💳 Payment Integration

Stripe integration supports the full card payment lifecycle:

### Checkout Flow
1. **Place Order** (`POST /order`) → Order created with `PENDING` status and `paymentType: CARD`
2. **Checkout** (`POST /order/:orderId/checkout`):
   - Creates a **Stripe Checkout Session** (for redirect-based UI flows)
   - Creates a **Stripe Payment Method** from the card token
   - Creates a **Stripe Payment Intent** (charges the card)
   - Saves `intentId` on the order document
3. **Webhook** (`POST /order/webhook`) → On `checkout.session.completed`, marks order as `paidAt` and confirms the Payment Intent

### Coupon Discounts on Stripe
If an order has a discount, a **Stripe Coupon** object is created with `percent_off` and applied to the checkout session automatically.

### Refunds
On order cancellation, if the order was paid by card:
- `PaymentService.handleOrderRefund(intentId)` is called
- Status is set to `REFUNDED` and `refundedAt` is recorded
- Product stock is restored
- User's cart is recreated with the returned products
- Coupon usage record is removed

---

## ⚡ Caching Strategy

Redis is used in two ways:

### 1. HTTP Response Caching
The `CustomCacheInterceptor` caches `GET` responses in Redis with a configurable TTL (`CacheModule.register({ ttl: 10000 })`). Applied to:
- `GET /product` (REST)
- `allProducts` query (GraphQL)

### 2. OTP & Session Storage
| Key Pattern | Value | TTL |
|---|---|---|
| `otp:{email}:confirmEmail` | Argon2-hashed OTP | Configurable (e.g. 2 minutes) |
| `fcm:{userId}` | Set of FCM tokens | Session-based |

---

## 🧪 Running Tests

```bash
# Unit tests
pnpm run test

# Unit tests in watch mode
pnpm run test:watch

# E2E tests
pnpm run test:e2e

# Test coverage report
pnpm run test:cov
```

Tests are written with **Jest** and **Supertest**. Unit tests live alongside their modules (`.spec.ts` files). E2E test configuration is in `test/jest-e2e.json`.

---

## 🎨 Design Patterns

| Pattern | Where Used |
|---|---|
| **Repository Pattern** | `common/repository` — generic Mongoose wrapper for all DB operations |
| **Module Pattern** | NestJS modules encapsulate each business domain |
| **Decorator Pattern** | Custom `@Auth()`, `@User()`, `@Role()`, `@Token()` decorators |
| **Guard Pattern** | `AuthenticationGuard` + `AuthorizationGuard` as composable middleware |
| **Interceptor Pattern** | Response formatting, performance logging, language detection, caching |
| **Observer Pattern** | `EventEmitter` for decoupled async email sending |
| **Strategy Pattern** | JWT verification adapts to HTTP, GraphQL, and WebSocket contexts |
| **Factory Pattern** | `TokenService.createLoginTokens()` builds token pairs |

---

## 📄 License

This project is **UNLICENSED** — all rights reserved by the author.

---

<p align="center">
  Built using <a href="https://nestjs.com/">NestJS</a>
</p>
