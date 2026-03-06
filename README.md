# SSI Studios Platform

SSI Studios is an internal platform designed to streamline the creation, management, and distribution of digital assets such as certificates, visiting cards, ID cards, posters, and invitations.
The system provides tools for automation, analytics, asset generation, bulk operations, and administrative workflows used across organizational processes.

The platform is built using **Next.js (App Router)** and integrates with multiple services including **MongoDB, AWS S3, Cloudinary, and SendGrid** to support scalable asset generation and distribution.

---

# Core Features

### Digital Asset Generation

* Certificate generation and management
* Visiting card generation
* ID card generation
* Poster and invitation creation
* Background removal tools

### Bulk Operations

* Bulk certificate generation
* Bulk visiting card generation
* Bulk downloads and exports

### Analytics & Monitoring

* Certificate usage analytics
* System usage tracking
* Master analytics dashboard

### File Processing

* PDF generation and editing
* Image processing
* Excel import/export
* Document preview and downloads

### Automation & Integrations

* Email distribution using SendGrid
* AI integrations via Google Generative AI
* Cloud storage using AWS S3 and Cloudinary

### System Management

* Authentication and user profiles
* Bug reporting
* System health monitoring
* Usage and performance tracking

---

# Tech Stack

### Framework

* Next.js 16 (App Router)
* React 19
* TypeScript

### Styling & UI

* TailwindCSS
* Radix UI
* Headless UI
* Framer Motion
* Lucide Icons

### State Management

* Zustand
* React Context API
* SWR for data fetching

### Backend & Data

* MongoDB
* Mongoose
* Next.js API Routes

### File & Document Processing

* PDF-Lib
* jsPDF
* html2canvas
* XLSX
* Sharp (image processing)

### Cloud & External Services

* AWS S3
* Cloudinary
* SendGrid
* Google Generative AI API

### Utilities

* Axios
* NanoID
* Date-fns

---

# Installation

Clone the repository and install dependencies.

```bash
git clone <repository-url>
cd ssistudios
npm install
```

---

# Development

Start the development server.

```bash
npm run dev
```

Application runs at:

```
http://localhost:3000
```

---

# Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

# Project Architecture

The project follows **feature-based modular architecture** using the **Next.js App Router**.

```
app/
 ├── (auth)/
 │   └── login/
 │
 ├── api/
 │   ├── admin-login/
 │   ├── analytics/
 │   ├── assets/
 │   ├── certificates/
 │   ├── contacts/
 │   ├── idcards/
 │   ├── visitingcards/
 │   ├── bug-report/
 │   ├── upload/
 │   └── system-status/
 │
 ├── auto/
 ├── bgremover/
 ├── certificates/
 ├── dashboard/
 ├── idcard/
 ├── visitingcards/
 ├── reportbug/
 └── userprofile/
```

---

# Components Architecture

UI components are organized by **domain feature**.

```
components/
 ├── Certificates/
 │   ├── hooks/
 │   ├── ui/
 │   └── utils/
 │
 ├── VisitingCards/
 │   ├── hooks/
 │   ├── ui/
 │   └── utils/
 │
 ├── dashboard/
 ├── login/
 ├── features/
 ├── ui/
 └── animations/
```

---

# Context Providers

Global state and application logic are handled via React Context.

```
contexts/
 ├── AuthContext.tsx
 ├── CrashContext.tsx
 ├── ThemeContext.tsx
 └── UsageContext.tsx
```

---

# Data Models

Database schemas are defined using **Mongoose**.

```
models/
 ├── Asset.ts
 ├── BugReport.ts
 ├── Certificate.ts
 ├── Contact.ts
 ├── IdCard.ts
 ├── VisitingCard.ts
 ├── Usage.ts
 └── SystemState.ts
```

---

# Public Assets

Static files and templates are stored in the `public` directory.

```
public/
 ├── certificates/
 ├── visitingcard/
 ├── idcard/
 ├── posters/
 ├── invitation/
 ├── logos/
 ├── fonts/
 └── bloodgroup/
```

---

# Environment Variables

Create a `.env.local` file in the root directory.

Example configuration:

```
MONGODB_URI=your_mongodb_connection_string

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket

CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

SENDGRID_API_KEY=your_sendgrid_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

# Production Build

Create optimized production build.

```bash
npm run build
```

Start production server.

```bash
npm start
```

---

# System Design Notes

* Uses **App Router based architecture** for scalable routing.
* API routes handle server-side operations including file processing and database interaction.
* Modular component architecture improves maintainability and separation of concerns.
* Asset generation workflows are optimized for batch operations and large datasets.

---

# License

Private internal platform developed under **SSI Studios**.
