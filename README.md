# Rebraco

Headless CMS and rental management platform. Umbraco 17 backend with a server-rendered React 19 frontend.

## Stack

**Backend** (`Rebraco.CMS`)

- .NET 10, Umbraco 17.5 with the Delivery API
- Entity Framework Core and SQL Server for rental domain data
- Stripe for payments, Postmark for transactional email

**Frontend** (`Rebraco.Client`)

- React 19 with React Router v7 in framework mode
- Server-side rendering through Express, Vite 7 for dev and build
- Tailwind CSS 4

## Requirements

- .NET 10 SDK
- Node.js 20 or newer
- SQL Server (local instance or Docker)

## Getting started

### 1. Configure the backend

Secrets stay out of the repository. Use .NET user secrets:

```bash
cd Rebraco.CMS
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:umbracoDbDSN" "Server=localhost,1433;Database=Rebraco;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=true;"
```

Optional integrations, set the same way:

| Key | Purpose |
| --- | --- |
| `Postmark:ServerToken` | Transactional email |
| `Postmark:FromEmail` | Sender address |
| `Postmark:NotifyEmail` | Internal notification recipient |
| `Stripe:PlatformSecretKey` | Server-side Stripe calls |
| `Stripe:PlatformPublishableKey` | Client-side Stripe |
| `Stripe:ConnectClientId` | Stripe Connect onboarding |
| `Stripe:WebhookSecret` | Webhook signature verification |
| `Cors:AllowedOrigins` | Allowed origins in production |

### 2. Run the backend

```bash
dotnet run --project Rebraco.CMS
```

The site runs on `https://localhost:44339`. First run walks through Umbraco installation. The backoffice is at `/umbraco`.

### 3. Run the frontend

```bash
cd Rebraco.Client
npm install
npm run dev
```

The dev server runs on `http://localhost:3000` and proxies `/umbraco` and `/media` to the backend.

Copy `.env.example` to `.env.development` and adjust `VITE_CMS_BASE_URL` and `VITE_CMS_MEDIA_URL` if your backend is not on the default port.

## Frontend scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Express dev server with Vite HMR |
| `npm run build` | Production client and server bundles |
| `npm start` | Serve the production build |
| `npm run typecheck` | Generate route types, then type check |
| `npm run lint` | ESLint |

## Project structure

```
Rebraco.CMS/           .NET backend
  Controllers/         API endpoints
  Data/                EF Core context and migrations
  Models/              Domain and DTO models
  Services/            Business logic
  Views/               Razor views
Rebraco.Client/        React frontend
  src/lib/             Parsing, design tokens, utilities
  server.js            Express SSR entry point
```

## License

MIT. See [LICENSE](LICENSE).
