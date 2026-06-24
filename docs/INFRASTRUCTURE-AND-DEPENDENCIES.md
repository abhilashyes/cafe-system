# The Brew Lab — Infrastructure & Dependencies (Bill of Materials)

A single consolidated list of everything the platform needs to run: **cloud**,
**third-party integrations**, **per-store hardware**, **client devices**,
**software/runtime dependencies**, **developer/CI tooling & accounts**, and
**compliance/legal**. Region anchor is **ap-south-1 (Mumbai)** for DPDP data
residency.

Legend — **Status**: ✅ scaffolded/mocked today · 🔜 wired in a later milestone (see
`/root` plan M1–M8) · 🏪 physical/in-store · 🧾 account/contract to obtain.
The cloud section summarises `apps/brew-infra/INFRASTRUCTURE.md` (authoritative
for AWS); this doc adds the integration, hardware, and procurement layers.

---

## 1. Cloud infrastructure (AWS, ap-south-1)

| Area | Component | Purpose | Status |
| --- | --- | --- | --- |
| Landing zone | AWS Organizations + Control Tower, IAM Identity Center | Multi-account guardrails, SSO | 🔜 M8 |
| Accounts | management, log-archive, audit, brew-dev/staging/prod | Environment isolation | 🔜 M8 |
| Network | VPC (public/app/data subnets, 2 AZ), NAT, Route 53, ACM | Connectivity, DNS, TLS | ✅ TF module / 🔜 apply M8 |
| Edge | CloudFront, API Gateway/ALB, **AWS WAF** | CDN, JWT validation, OWASP/rate-limit | ✅ module / 🔜 M8 |
| Compute | **ECS Fargate** (brew-backend), ECR (scan-on-push) | Run the modular monolith | ✅ module / 🔜 M8 |
| Jobs | EventBridge Scheduler → Fargate task | DPDP retention/erasure, EOD reconcile, loyalty rollups | 🔜 M6/M8 |
| Database | **Aurora PostgreSQL Serverless v2** | Transactional store (orders, payments, catalog…) | 🔜 M1 (live profile) |
| NoSQL | **DynamoDB** (on-demand) | Cart/session, idempotency keys, rate-limit counters | 🔜 M1/M3 |
| Cache | **ElastiCache for Redis** | Caching, OTP throttle counters | 🔜 M2 |
| Storage | **S3** (receipts, assets, data-export bundles, logs, TF state) | Object storage + Terraform state | ✅ partial / 🔜 M8 |
| Identity | **Amazon Cognito** user pool | Phone+OTP (customers), MFA (staff) | 🔜 M2 |
| Messaging | **EventBridge** + **SQS** (per-consumer) + **DLQ** + **SNS** | Prod domain-event transport | 🔜 M3 |
| Notifications | **SNS SMS / Amazon Pinpoint** | Order/marketing SMS; OTP via Cognito | 🔜 M7 |
| Secrets | **Secrets Manager** + **KMS** CMKs | Razorpay/DB creds, field-level PII encryption | ✅ module / 🔜 M8 |
| Audit/sec | CloudTrail, GuardDuty, Security Hub, AWS Config | Org-wide audit & posture | 🔜 M8 |
| Observability | CloudWatch (logs/metrics/alarms/dashboards), **OpenTelemetry → ADOT → X-Ray** | Logs, metrics, traces, SLOs | 🔜 M8 |
| CI/CD | GitHub Actions via **OIDC** (no static keys) | Build→test→scan→ECR→terraform→ECS blue/green | ✅ workflows / 🔜 M8 |

Pilot is cost-lean (single NAT, low Aurora ACU, single-node Redis, Fargate
min tasks); the upgrade path to multi-AZ is documented in `INFRASTRUCTURE.md`.

---

## 2. Third-party integrations (SaaS / external APIs)

| Integration | Vendor / standard | Used for | Status |
| --- | --- | --- | --- |
| Payments | **Razorpay** (PG + UPI + cards) | Checkout, UPI intent/QR/collect, refunds, webhooks | ✅ mock / 🔜 M4 🧾 |
| Auth/OTP | AWS Cognito (+ SMS sender) | Phone+OTP login, staff MFA, JWT | 🔜 M2 |
| SMS gateway | SNS SMS / Pinpoint (or a DLT-registered Indian aggregator) | OTP + transactional SMS | 🔜 M7 🧾 |
| Push notifications | **Firebase Cloud Messaging (FCM)** + **APNs** | Order-ready/status push to the mobile app | 🔜 M7 🧾 |
| Email | Amazon SES (or transactional email vendor) | Receipts, data-export delivery, alerts | 🔜 M7 |
| GST e-invoicing | **GSTN IRP / e-invoice (IRN + signed QR)** via a GSP/ASP | Compliant B2B/threshold invoices | 🔜 M6 🧾 |
| Maps / store locator | Google Maps / Mapbox (geocoding + tiles) | Store locator, delivery radius | 🔜 M7 🧾 |
| Marketplace/aggregators (optional) | Swiggy / Zomato order APIs | Inbound 3rd-party channel orders | future 🧾 |
| Error monitoring (optional) | Sentry (or CloudWatch RUM) | Frontend/mobile crash + error tracking | 🔜 M8 |
| App distribution | Apple App Store, Google Play | Customer app delivery | 🔜 M7 🧾 |

🧾 = requires a commercial account / contract / KYC before go-live.

---

## 3. Per-store hardware (in-store BOM) 🏪

Quantities are **per store** for a typical café; scale printers/displays to layout.

### Point of sale
| Item | Spec / example | Qty | Notes |
| --- | --- | --- | --- |
| POS terminal | Android tablet (10") or Windows POS / iPad | 1–2 | Runs `brew-pos-web` (browser/PWA) |
| Customer-facing display (CFD) | Small second screen / tablet | 0–1 | Order + UPI QR display (optional) |
| Receipt printer | **Epson TM-series, ESC/POS**, 80mm thermal | 1 | Customer bill / GST receipt |
| Cash drawer | RJ11/RJ12, printer-kicked | 1 | For cash payments |
| Card / UPI device | Bank/Razorpay POS terminal or UPI soundbox | 1 | Card + dynamic-UPI acceptance |
| Barcode/QR scanner | 1D/2D USB or Bluetooth | 0–1 | Loyalty/redemption, packaged goods |

### Kitchen / fulfilment (KOT + KDS)
| Item | Spec / example | Qty | Notes |
| --- | --- | --- | --- |
| **KOT sticker/label printers** | **Epson ESC/POS** (cup/bar, hot, cold) | 2–3 | Drives stackable cup/food stickers via `brew-kot-printer` |
| **Bakery label printer** | **Zebra / TSC, ZPL** | 0–1 | Date/label printing for bakery items |
| **Kitchen Display System (KDS)** | Wall/counter screen (Android/Fire TV/mini-PC + monitor) per station | 1–3 | Runs `brew-pos-web` KDS screen mode over the `/kds` WebSocket |
| KDS bump bar (optional) | USB bump bar / touch screen | 0–1 | Mark items ready |
| Print agent host | Small mini-PC / always-on tablet on store LAN | 1 | Runs the **KOT print agent** (`brew-kot-printer`), polls jobs, drives printers |

> **Printer protocols** are abstracted by `PrinterDriver`: `EscPosDriver`
> (Epson & compatibles) and `ZplDriver` (Zebra/TSC). Stations route by the
> `<storeId>:<station>` device id (BAR / HOT_KITCHEN / COLD / BAKERY). Real USB /
> network (TCP raw **:9100**) transport + status monitoring land in **M5**.

### Network & power (per store)
| Item | Spec / example | Qty | Notes |
| --- | --- | --- | --- |
| Internet | Primary broadband + **4G/5G failover** | 1 | POS must tolerate brief outages (offline buffer) |
| Router / firewall | Business router w/ VLANs | 1 | Separate POS/KDS/guest networks |
| Network switch | PoE switch (if PoE displays/APs) | 1 | Wired LAN for printers/KDS preferred |
| Wi-Fi AP | Dual-band AP | 1–2 | Staff devices, guest Wi-Fi |
| **UPS** | For POS, router, KDS, print-agent host | 1–2 | Ride through power blips |
| Cabling | Cat6, printer USB/Ethernet | — | Wired printers are more reliable than USB |

---

## 4. Client devices (no procurement — customer/staff owned)

| Device | App | Notes |
| --- | --- | --- |
| Customer smartphone | `brew-mobile-customer` (iOS/Android) **or** the PWA in a browser | Ordering, loyalty, tracking, Privacy Center |
| Staff tablet/phone | POS/admin web (PWA) | Store ops, KDS |
| Manager laptop/desktop | `brew-admin-global` (browser) | Head-office admin, reporting, RBAC, catalog |

---

## 5. Software & runtime dependencies (the stack)

| Layer | Technology | Where |
| --- | --- | --- |
| Monorepo | **pnpm 10** workspaces + **Turborepo** | root |
| Backend | **NestJS 10** + TypeScript (Node ≥ 20) | `apps/brew-backend` |
| Contracts | OpenAPI 3.1 + shared TS types (ESM+CJS) | `packages/brew-contracts` |
| POS / Admin web | **React + TypeScript + Vite** | `apps/brew-pos-web`, `apps/brew-admin-global` |
| Mobile app | **Flutter / Dart** (go_router, google_fonts) | `apps/brew-mobile-customer` |
| Print agent | Node + TypeScript | `apps/brew-kot-printer` |
| Realtime | socket.io (`/kds` namespace) | backend ↔ KDS |
| Data (live) | PostgreSQL (Aurora), DynamoDB, Redis | M1+ |
| ORM/data access | Prisma **or** TypeORM (TBD in M1) | backend |
| IaC | **Terraform** ≥ 1.6 | `apps/brew-infra` |
| Containers | Docker (build → ECR) | backend |
| Eventing | In-memory bus (demo) → EventBridge/SQS/SNS (live) | M3 |

---

## 6. Developer & CI/CD tooling / accounts 🧾

| Need | Item |
| --- | --- |
| Source + CI | GitHub repo + **GitHub Actions** (OIDC to AWS) |
| Cloud account | AWS account/Organization (ap-south-1) |
| Domain + TLS | Registered domain (Route 53) + ACM certs |
| Mobile publishing | **Apple Developer Program** ($99/yr) + **Google Play Console** ($25 one-time) |
| Push | Firebase project (FCM) + Apple APNs key |
| Payments | Razorpay merchant account (KYC) + webhook secret |
| Local dev | Node ≥ 20, pnpm 10, Docker, Flutter SDK, Terraform, AWS CLI v2 |
| Optional IaC lint | tflint, checkov |

---

## 7. Compliance, legal & financial 🧾

| Requirement | Detail |
| --- | --- |
| **DPDP Act** (data residency/consent/erasure) | ap-south-1 hosting; consent records; data-export & erasure flows (privacy module) |
| **GST registration (GSTIN)** | Per legal entity/state; tax computation + invoice series per store |
| **GST e-invoicing (IRP/IRN)** | If turnover crosses the e-invoice threshold — via a GSP/ASP |
| **FSSAI license** | Food business operation (per outlet/central) |
| Payment aggregator/PCI scope | Razorpay handles card data; we stay out of PCI cardholder scope (tokenized) |
| SMS DLT registration | TRAI DLT registration of sender IDs/templates for transactional SMS |
| Business banking | Settlement account for Razorpay payouts |

---

## How this maps to the build milestones
- **M1** Aurora/DynamoDB/Redis behind the live profile (demo keeps in-memory).
- **M2** Cognito (auth/OTP/MFA) + Redis OTP throttle.
- **M3** EventBridge/SQS/SNS event transport.
- **M4** Razorpay live (payments, webhooks, refunds).
- **M5** Real printer transport (USB / TCP :9100) + KDS hardware + status monitoring.
- **M6** GST e-invoicing (IRP/IRN), procurement/inventory hardware-adjacent flows.
- **M7** Push (FCM/APNs), SMS, maps, app-store distribution.
- **M8** Full AWS provisioning, observability, security, CI/CD to ECS.

The **demo profile** needs **none** of the above — it runs fully mocked/in-memory
and is what the GitHub Pages demo uses.
