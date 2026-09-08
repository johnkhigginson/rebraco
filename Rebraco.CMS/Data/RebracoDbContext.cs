using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Data;

public class RebracoDbContext : DbContext
{
    public RebracoDbContext(DbContextOptions<RebracoDbContext> options) : base(options) { }

    public DbSet<Inquiry> Inquiries => Set<Inquiry>();
    public DbSet<InquiryNote> InquiryNotes => Set<InquiryNote>();
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Lease> Leases => Set<Lease>();
    public DbSet<MaintenanceRequest> MaintenanceRequests => Set<MaintenanceRequest>();
    public DbSet<MaintenanceNote> MaintenanceNotes => Set<MaintenanceNote>();
    public DbSet<PropertyImage> PropertyImages => Set<PropertyImage>();
    public DbSet<UnitImage> UnitImages => Set<UnitImage>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<LeaseDocument> LeaseDocuments => Set<LeaseDocument>();
    public DbSet<LeaseRenewal> LeaseRenewals => Set<LeaseRenewal>();
    public DbSet<TourAvailability> TourAvailabilities => Set<TourAvailability>();
    public DbSet<Tour> Tours => Set<Tour>();
    public DbSet<MaintenanceImage> MaintenanceImages => Set<MaintenanceImage>();
    public DbSet<MaintenanceNoteImage> MaintenanceNoteImages => Set<MaintenanceNoteImage>();
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Keep business tables in a separate schema from Umbraco's dbo tables
        modelBuilder.HasDefaultSchema("rebraco");

        // ─── Inquiry ───────────────────────────────────────────────
        modelBuilder.Entity<Inquiry>(e =>
        {
            e.HasIndex(i => i.Status);
            e.HasIndex(i => i.CreatedAt);
            e.HasIndex(i => i.PropertyId);
            e.HasIndex(i => i.Email);

            e.Property(i => i.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasMany(i => i.Notes)
                .WithOne(n => n.Inquiry)
                .HasForeignKey(n => n.InquiryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InquiryNote>(e =>
        {
            e.HasIndex(n => n.InquiryId);
        });

        // ─── Property ──────────────────────────────────────────────
        modelBuilder.Entity<Property>(e =>
        {
            e.HasIndex(p => p.Name);
            e.HasIndex(p => p.Type);
            e.HasIndex(p => p.Slug).IsUnique();
            e.HasIndex(p => p.IsPublished);

            e.Property(p => p.Type)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.Property(p => p.GenderRestriction)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.Property(p => p.PricingPeriod)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasMany(p => p.Units)
                .WithOne(u => u.Property)
                .HasForeignKey(u => u.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(p => p.Images)
                .WithOne(i => i.Property)
                .HasForeignKey(i => i.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Unit ──────────────────────────────────────────────────
        modelBuilder.Entity<Unit>(e =>
        {
            e.HasIndex(u => u.PropertyId);
            e.HasIndex(u => u.Status);
            e.HasIndex(u => u.FloorPlan);
            e.HasIndex(u => u.IsPublished);
            e.HasIndex(u => new { u.PropertyId, u.UnitNumber }).IsUnique();

            e.Property(u => u.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.Property(u => u.GenderRestriction)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.Property(u => u.PricingModel)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.Property(u => u.PricingPeriod)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasMany(u => u.Leases)
                .WithOne(l => l.Unit)
                .HasForeignKey(l => l.UnitId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(u => u.MaintenanceRequests)
                .WithOne(m => m.Unit)
                .HasForeignKey(m => m.UnitId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(u => u.Images)
                .WithOne(i => i.Unit)
                .HasForeignKey(i => i.UnitId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Tenant ────────────────────────────────────────────────
        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Email).IsUnique();
            e.HasIndex(t => t.MemberKey).HasFilter("[MemberKey] IS NOT NULL");
            e.HasIndex(t => t.Status);
            e.HasIndex(t => t.LastName);

            e.Property(t => t.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasMany(t => t.Leases)
                .WithOne(l => l.Tenant)
                .HasForeignKey(l => l.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(t => t.MaintenanceRequests)
                .WithOne(m => m.Tenant)
                .HasForeignKey(m => m.TenantId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Lease ─────────────────────────────────────────────────
        modelBuilder.Entity<Lease>(e =>
        {
            e.HasIndex(l => l.UnitId);
            e.HasIndex(l => l.TenantId);
            e.HasIndex(l => l.Status);
            e.HasIndex(l => l.EndDate);

            e.Property(l => l.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.Property(l => l.LeaseType)
                .HasConversion<string>()
                .HasMaxLength(20);

            // Multiple active leases per unit allowed (up to Unit.Capacity).
            // Enforced in the service layer, not via DB constraint.

            e.HasMany(l => l.Documents)
                .WithOne(d => d.Lease)
                .HasForeignKey(d => d.LeaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── LeaseRenewal ────────────────────────────────────────────
        modelBuilder.Entity<LeaseRenewal>(e =>
        {
            e.HasIndex(r => r.OriginalLeaseId);
            e.HasIndex(r => r.NewLeaseId).HasFilter("[NewLeaseId] IS NOT NULL");
            e.HasIndex(r => r.Status);

            e.Property(r => r.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.Property(r => r.ProposedLeaseType)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasOne(r => r.OriginalLease)
                .WithMany()
                .HasForeignKey(r => r.OriginalLeaseId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.NewLease)
                .WithMany()
                .HasForeignKey(r => r.NewLeaseId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ─── TourAvailability ──────────────────────────────────────────
        modelBuilder.Entity<TourAvailability>(e =>
        {
            e.HasIndex(a => a.PropertyId);
            e.HasIndex(a => new { a.PropertyId, a.DayOfWeek });

            e.HasOne(a => a.Property)
                .WithMany()
                .HasForeignKey(a => a.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Tour ─────────────────────────────────────────────────────
        modelBuilder.Entity<Tour>(e =>
        {
            e.HasIndex(t => t.PropertyId);
            e.HasIndex(t => t.UnitId).HasFilter("[UnitId] IS NOT NULL");
            e.HasIndex(t => t.InquiryId).HasFilter("[InquiryId] IS NOT NULL");
            e.HasIndex(t => t.Status);
            e.HasIndex(t => t.ScheduledDate);

            e.Property(t => t.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasOne(t => t.Property)
                .WithMany()
                .HasForeignKey(t => t.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(t => t.Unit)
                .WithMany()
                .HasForeignKey(t => t.UnitId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(t => t.Inquiry)
                .WithMany(i => i.Tours)
                .HasForeignKey(t => t.InquiryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ─── LeaseDocument ───────────────────────────────────────────
        modelBuilder.Entity<LeaseDocument>(e =>
        {
            e.HasIndex(d => new { d.LeaseId, d.SortOrder });

            e.Property(d => d.DocumentType)
                .HasConversion<string>()
                .HasMaxLength(30);
        });

        // ─── MaintenanceRequest ────────────────────────────────────
        modelBuilder.Entity<MaintenanceRequest>(e =>
        {
            e.HasIndex(m => m.UnitId);
            e.HasIndex(m => m.TenantId);
            e.HasIndex(m => m.Status);
            e.HasIndex(m => m.Priority);
            e.HasIndex(m => m.CreatedAt);

            e.Property(m => m.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.Property(m => m.Priority)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.Property(m => m.Category)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasMany(m => m.Notes)
                .WithOne(n => n.MaintenanceRequest)
                .HasForeignKey(n => n.MaintenanceRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(m => m.Images)
                .WithOne(i => i.MaintenanceRequest)
                .HasForeignKey(i => i.MaintenanceRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── MaintenanceNote ───────────────────────────────────────
        modelBuilder.Entity<MaintenanceNote>(e =>
        {
            e.HasIndex(n => n.MaintenanceRequestId);

            e.HasMany(n => n.Images)
                .WithOne(i => i.MaintenanceNote)
                .HasForeignKey(i => i.MaintenanceNoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── MaintenanceImage ──────────────────────────────────────
        modelBuilder.Entity<MaintenanceImage>(e =>
        {
            e.HasIndex(i => new { i.MaintenanceRequestId, i.SortOrder });
        });

        // ─── MaintenanceNoteImage ──────────────────────────────────
        modelBuilder.Entity<MaintenanceNoteImage>(e =>
        {
            e.HasIndex(i => new { i.MaintenanceNoteId, i.SortOrder });
        });

        // ─── PropertyImage ───────────────────────────────────────────
        modelBuilder.Entity<PropertyImage>(e =>
        {
            e.HasIndex(i => new { i.PropertyId, i.SortOrder });
        });

        // ─── UnitImage ───────────────────────────────────────────────
        modelBuilder.Entity<UnitImage>(e =>
        {
            e.HasIndex(i => new { i.UnitId, i.SortOrder });
        });

        // ─── NotificationPreference ──────────────────────────────────
        modelBuilder.Entity<NotificationPreference>(e =>
        {
            e.HasIndex(n => n.MemberKey);
            e.HasIndex(n => new { n.MemberKey, n.NotificationType }).IsUnique();
        });

        // ─── Invoice ─────────────────────────────────────────────────
        modelBuilder.Entity<Invoice>(e =>
        {
            e.HasIndex(i => i.LeaseId);
            e.HasIndex(i => i.TenantId);
            e.HasIndex(i => i.Status);
            e.HasIndex(i => i.DueDate);
            e.HasIndex(i => i.StripePaymentIntentId)
                .HasFilter("[StripePaymentIntentId] IS NOT NULL");

            e.Property(i => i.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasOne(i => i.Lease)
                .WithMany()
                .HasForeignKey(i => i.LeaseId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(i => i.Tenant)
                .WithMany(t => t.Invoices)
                .HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(i => i.Payments)
                .WithOne(p => p.Invoice)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Application ────────────────────────────────────────────────
        modelBuilder.Entity<Application>(e =>
        {
            e.HasIndex(a => a.MemberKey);
            e.HasIndex(a => a.Status);
            e.HasIndex(a => a.PropertyId);
            e.HasIndex(a => a.ApplicantEmail);
            e.HasIndex(a => a.StripeCheckoutSessionId)
                .HasFilter("[StripeCheckoutSessionId] IS NOT NULL");

            e.Property(a => a.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasOne(a => a.Property)
                .WithMany()
                .HasForeignKey(a => a.PropertyId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(a => a.Unit)
                .WithMany()
                .HasForeignKey(a => a.UnitId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(a => a.ConvertedTenant)
                .WithMany()
                .HasForeignKey(a => a.ConvertedTenantId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Payment ─────────────────────────────────────────────────
        modelBuilder.Entity<Payment>(e =>
        {
            e.HasIndex(p => p.InvoiceId);
            e.HasIndex(p => p.TenantId);
            e.HasIndex(p => p.StripePaymentIntentId);
            e.HasIndex(p => p.Status);

            e.Property(p => p.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            e.HasOne(p => p.Tenant)
                .WithMany(t => t.Payments)
                .HasForeignKey(p => p.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
