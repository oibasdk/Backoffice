# Sharoobi Backoffice Dashboard

A modern React 18 + TypeScript admin dashboard for managing the Sharoobi platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📁 Project Structure

```
frontend/backoffice/
├── src/
│   ├── app/                    # Core application
│   │   ├── App.tsx             # Main app component with routing
│   │   ├── AppShell.tsx        # App shell with sidebar/topbar
│   │   ├── moduleRegistry.tsx  # Route registry and navigation
│   │   ├── providers/          # Context providers
│   │   └── shell/              # Shell components
│   ├── auth/                   # Authentication
│   │   ├── pages/              # Login pages
│   │   ├── AdminGuard.tsx      # Route protection
│   │   ├── PermissionGate.tsx  # Permission-based rendering
│   │   └── FeatureFlagGate.tsx # Feature flag gating
│   ├── components/             # Shared components
│   │   ├── DataTable/          # Data table with pagination
│   │   ├── FilterBar/          # Filter components
│   │   ├── KpiCard/            # KPI cards
│   │   ├── PageHeader/         # Page headers
│   │   └── CommandPalette/     # Global command palette (Ctrl+K)
│   ├── features/               # Feature modules
│   │   ├── audit/              # Audit logs
│   │   ├── catalog/            # Categories, products, professions
│   │   ├── chat/               # Chat threads and policies
│   │   ├── configuration/      # Feature flags, settings, content
│   │   ├── escalations/        # Escalation policies
│   │   ├── iam/                # Users, roles, permissions
│   │   ├── knowledge/          # Documentation
│   │   ├── marketplace/        # Vendor/product approvals
│   │   ├── mission_control/    # Overview and analytics
│   │   ├── ops/                # Ops center and monitoring
│   │   ├── payments/           # Orders, intents, escrows
│   │   ├── ras/                # Remote assistance sessions
│   │   ├── remote_sessions/    # Remote session policies
│   │   ├── sla/                # SLA policies
│   │   ├── studio/             # Experience studio
│   │   └── tickets/            # Support tickets
│   ├── api/                    # API client and utilities
│   ├── design-system/          # Design tokens
│   ├── hooks/                  # Custom React hooks
│   ├── i18n/                   # Internationalization
│   └── utils/                  # Utility functions
├── tests/                      # Playwright E2E tests
│   ├── smoke.spec.ts           # Basic smoke tests
│   ├── real-admin.spec.ts      # Admin navigation tests
│   ├── real-dashboard.spec.ts  # Dashboard flow tests
│   └── helpers/                # Test utilities
└── public/locales/             # Translation files
```

## 🎯 Features

### Core Functionality
- **Mission Control**: Overview dashboard with KPIs and analytics
- **IAM**: User management, roles, permissions, devices, sessions
- **Audit**: Comprehensive audit logging
- **Support Ops**: Tickets, SLA policies, escalation policies
- **Communications**: Chat threads and chat policies
- **Marketplace**: Vendor and product approvals
- **Catalog**: Categories, products, professions, bundles
- **Payments**: Orders, intents, proofs, methods, banks, escrows
- **Configuration**: Feature flags, app settings, content management
- **Studio**: Experience and brand management
- **Ops**: System health, alerts, notifications
- **Knowledge**: Documentation and guides

### UX Features
- **Command Palette**: Press `Ctrl+K` for quick navigation
- **RTL Support**: Full Arabic language support
- **Dark Mode**: System-aware theme switching
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: React Query for data fetching

## 🧪 Testing

### Unit Tests (Vitest)
```bash
npm run test:unit
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- smoke.spec.ts

# UI mode
npm run test:e2e -- --ui
```

### Test Files
- `src/app/__tests__/AdminGuard.test.tsx` - Auth guard tests
- `src/app/__tests__/DataTable.test.tsx` - DataTable tests
- `src/features/*/__tests__/api.test.ts` - API integration tests

## 📦 Build & Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` with:
```env
VITE_BFF_BASE_URL=http://localhost:9000
VITE_API_TIMEOUT=30000
```

### Feature Flags
Manage feature flags in Configuration → Feature Flags

### Permissions
- `user.view` - View users
- `role_template.view` - View roles
- `ticket.view` - View tickets
- `audit_log.view` - View audit logs
- And many more...

## 🎨 Design System

### Design Tokens
Located in `src/design-system/tokens.ts`:
- Typography: Manrope (EN), Noto Sans Arabic (AR)
- Colors: Brand (#356BFF), neutral, semantic
- Spacing: 8px base unit
- Radius: 8px, 10px, 12px
- Elevation: 4 shadow levels

### Figma Integration
- Design tokens exported to: `figma_tokens_export.json`
- Full design spec (archived): `docs/archive/design/figma ux ui Sharoobi Dashboard.md`

## 📱 Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔒 Security
- JWT-based authentication
- Role-based access control (RBAC)
- Feature flag gating
- Audit logging for all admin actions

## 📄 License
Proprietary - Sharoobi Platform
