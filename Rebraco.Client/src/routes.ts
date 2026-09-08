import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  // Management area (must come before Umbraco splat)
  layout("manage/layout.tsx", [
    route("manage", "manage/dashboard.tsx"),
    route("manage/login", "manage/login.tsx"),
    route("manage/forgot-password", "shared/forgot-password.tsx", { id: "manage-forgot-password" }),
    route("manage/reset-password", "shared/reset-password.tsx", { id: "manage-reset-password" }),
    route("manage/inquiries", "manage/inquiries.tsx"),
    route("manage/inquiries/:id", "manage/inquiry-detail.tsx"),
    route("manage/profile", "manage/profile.tsx"),
    route("manage/settings", "manage/settings.tsx"),

    // Properties & Units
    route("manage/properties", "manage/properties.tsx"),
    route("manage/properties/new", "manage/property-form.tsx", { id: "manage-property-create" }),
    route("manage/properties/:id", "manage/property-detail.tsx"),
    route("manage/properties/:id/edit", "manage/property-form.tsx", { id: "manage-property-edit" }),
    route("manage/properties/:propertyId/units/new", "manage/unit-form.tsx", { id: "manage-unit-create" }),
    route("manage/properties/:id/units/bulk", "manage/bulk-unit-form.tsx"),
    route("manage/units/:id", "manage/unit-detail.tsx"),
    route("manage/units/:id/edit", "manage/unit-form.tsx", { id: "manage-unit-edit" }),

    // Tenants
    route("manage/tenants", "manage/tenants.tsx"),
    route("manage/tenants/new", "manage/tenant-form.tsx", { id: "manage-tenant-create" }),
    route("manage/tenants/:id", "manage/tenant-detail.tsx"),
    route("manage/tenants/:id/edit", "manage/tenant-form.tsx", { id: "manage-tenant-edit" }),

    // Leases
    route("manage/leases", "manage/leases.tsx"),
    route("manage/leases/new", "manage/lease-form.tsx", { id: "manage-lease-create" }),
    route("manage/leases/:id", "manage/lease-detail.tsx"),
    route("manage/leases/:id/edit", "manage/lease-form.tsx", { id: "manage-lease-edit" }),

    // Invoices & Payments
    route("manage/invoices", "manage/invoices.tsx"),
    route("manage/invoices/new", "manage/invoice-form.tsx", { id: "manage-invoice-create" }),
    route("manage/invoices/:id", "manage/invoice-detail.tsx"),
    route("manage/payments", "manage/payments.tsx"),

    // Tours
    route("manage/tours", "manage/tours.tsx"),
    route("manage/tours/:id", "manage/tour-detail.tsx"),

    // Maintenance
    route("manage/maintenance", "manage/maintenance.tsx"),
    route("manage/maintenance/new", "manage/maintenance-form.tsx", { id: "manage-maintenance-create" }),
    route("manage/maintenance/:id", "manage/maintenance-detail.tsx"),
    route("manage/maintenance/:id/edit", "manage/maintenance-form.tsx", { id: "manage-maintenance-edit" }),
  ]),
  // Tenant portal (must come before Umbraco splat)
  layout("portal/layout.tsx", [
    route("portal", "portal/dashboard.tsx"),
    route("portal/login", "portal/login.tsx"),
    route("portal/forgot-password", "shared/forgot-password.tsx", { id: "portal-forgot-password" }),
    route("portal/reset-password", "shared/reset-password.tsx", { id: "portal-reset-password" }),
    route("portal/leases", "portal/leases.tsx"),
    route("portal/leases/:id", "portal/lease-detail.tsx"),
    route("portal/invoices", "portal/invoices.tsx"),
    route("portal/invoices/:id", "portal/pay-invoice.tsx"),
    route("portal/payments", "portal/payments.tsx"),
    route("portal/maintenance", "portal/maintenance.tsx"),
    route("portal/maintenance/new", "portal/maintenance-form.tsx"),
    route("portal/maintenance/:id", "portal/maintenance-detail.tsx"),
    route("portal/tours", "portal/tours.tsx"),
    route("portal/tours/:id", "portal/tour-detail.tsx"),
    route("portal/profile", "portal/profile.tsx"),
  ]),
  // Public property routes — multiple URL aliases, same components
  // The active slug is configured in manager settings (default: "properties")
  route("properties", "pages/PublicPropertyListing.tsx", { id: "public-properties" }),
  route("properties/:slug", "pages/PublicPropertyDetail.tsx", { id: "public-property-detail" }),
  route("floor-plans", "pages/PublicPropertyListing.tsx", { id: "public-floor-plans" }),
  route("floor-plans/:slug", "pages/PublicPropertyDetail.tsx", { id: "public-floor-plan-detail" }),
  route("housing", "pages/PublicPropertyListing.tsx", { id: "public-housing" }),
  route("housing/:slug", "pages/PublicPropertyDetail.tsx", { id: "public-housing-detail" }),
  route("availability", "pages/PublicPropertyListing.tsx", { id: "public-availability" }),
  route("availability/:slug", "pages/PublicPropertyDetail.tsx", { id: "public-availability-detail" }),
  route("rooms", "pages/PublicPropertyListing.tsx", { id: "public-rooms" }),
  route("rooms/:slug", "pages/PublicPropertyDetail.tsx", { id: "public-rooms-detail" }),
  // Splat route: Umbraco handles all paths via Delivery API
  route("*?", "pages/Page.tsx"),
] satisfies RouteConfig;
