using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Umbraco.Cms.Core.Security;

namespace Rebraco.CMS.Services;

public class ApplicationService
{
    private readonly RebracoDbContext _db;
    private readonly ApplicationSettingsService _settings;
    private readonly TenantService _tenants;
    private readonly LeaseService _leases;
    private readonly IStripeConfigService _stripeConfig;
    private readonly IEmailService _email;
    private readonly IMemberManager _memberManager;
    private readonly Umbraco.Cms.Core.Services.IMemberService _memberService;
    private readonly ILogger<ApplicationService> _logger;

    public ApplicationService(
        RebracoDbContext db,
        ApplicationSettingsService settings,
        TenantService tenants,
        LeaseService leases,
        IStripeConfigService stripeConfig,
        IEmailService email,
        IMemberManager memberManager,
        Umbraco.Cms.Core.Services.IMemberService memberService,
        ILogger<ApplicationService> logger)
    {
        _db = db;
        _settings = settings;
        _tenants = tenants;
        _leases = leases;
        _stripeConfig = stripeConfig;
        _email = email;
        _memberManager = memberManager;
        _memberService = memberService;
        _logger = logger;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Prospect Methods
    // ═══════════════════════════════════════════════════════════════

    public async Task<Application> CreateDraftAsync(Guid memberKey, CreateApplicationDto dto)
    {
        var app = new Application
        {
            PropertyId = dto.PropertyId,
            UnitId = dto.UnitId,
            MemberKey = memberKey,
            ApplicantFirstName = dto.FirstName,
            ApplicantLastName = dto.LastName,
            ApplicantEmail = dto.Email,
            ApplicantPhone = dto.Phone,
            DesiredMoveInDate = dto.DesiredMoveInDate,
            DesiredLeaseTerm = dto.DesiredLeaseTerm,
            Status = ApplicationStatus.Draft,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _db.Applications.Add(app);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Application #{Id} draft created by member {MemberKey} for Property #{PropertyId}",
            app.Id, memberKey, dto.PropertyId);

        return app;
    }

    public async Task<(Application? App, string? Error)> UpdateDraftAsync(int id, Guid memberKey, UpdateApplicationDto dto)
    {
        var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.MemberKey == memberKey);
        if (app == null) return (null, "Application not found.");
        if (app.Status != ApplicationStatus.Draft)
            return (null, "Only draft applications can be updated.");

        // Update basic info
        if (dto.FirstName != null) app.ApplicantFirstName = dto.FirstName;
        if (dto.LastName != null) app.ApplicantLastName = dto.LastName;
        if (dto.Email != null) app.ApplicantEmail = dto.Email;
        if (dto.Phone != null) app.ApplicantPhone = dto.Phone;
        if (dto.DesiredMoveInDate.HasValue) app.DesiredMoveInDate = dto.DesiredMoveInDate;
        if (dto.DesiredLeaseTerm != null) app.DesiredLeaseTerm = dto.DesiredLeaseTerm;
        if (dto.UnitId.HasValue) app.UnitId = dto.UnitId;

        // Update section JSON data
        if (dto.EmploymentJson != null) app.EmploymentJson = dto.EmploymentJson;
        if (dto.RentalHistoryJson != null) app.RentalHistoryJson = dto.RentalHistoryJson;
        if (dto.ReferencesJson != null) app.ReferencesJson = dto.ReferencesJson;
        if (dto.EmergencyContactJson != null) app.EmergencyContactJson = dto.EmergencyContactJson;
        if (dto.VehicleJson != null) app.VehicleJson = dto.VehicleJson;
        if (dto.CoSignerJson != null) app.CoSignerJson = dto.CoSignerJson;
        if (dto.PetsJson != null) app.PetsJson = dto.PetsJson;
        if (dto.AdditionalNotes != null) app.AdditionalNotes = dto.AdditionalNotes;

        app.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return (app, null);
    }

    public async Task<(Application? App, string? Error)> SubmitAsync(int id, Guid memberKey)
    {
        var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.MemberKey == memberKey);
        if (app == null) return (null, "Application not found.");
        if (app.Status != ApplicationStatus.Draft)
            return (null, "Only draft applications can be submitted.");

        // Validate required sections
        var validationError = await ValidateRequiredSectionsAsync(app);
        if (validationError != null) return (null, validationError);

        // Snapshot fee amount
        var settings = await _settings.GetSettingsAsync();
        app.FeeAmountCents = settings.FeeAmountCents;

        if (settings.FeeAmountCents > 0)
        {
            app.Status = ApplicationStatus.PendingPayment;
        }
        else
        {
            app.Status = ApplicationStatus.Submitted;
            app.SubmittedAt = DateTimeOffset.UtcNow;
        }

        app.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        // Send notification if submitted (no fee)
        if (app.Status == ApplicationStatus.Submitted)
        {
            try { await _email.SendApplicationReceivedAsync(app); }
            catch (Exception ex) { _logger.LogError(ex, "Failed to send application received email for #{Id}", id); }
        }

        _logger.LogInformation("Rebraco: Application #{Id} submitted (status={Status})", app.Id, app.Status);
        return (app, null);
    }

    public async Task<List<Application>> GetMyApplicationsAsync(Guid memberKey)
    {
        return await _db.Applications
            .AsNoTracking()
            .Include(a => a.Property)
            .Include(a => a.Unit)
            .Where(a => a.MemberKey == memberKey)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<Application?> GetMyApplicationByIdAsync(int id, Guid memberKey)
    {
        return await _db.Applications
            .AsNoTracking()
            .Include(a => a.Property)
            .Include(a => a.Unit)
            .FirstOrDefaultAsync(a => a.Id == id && a.MemberKey == memberKey);
    }

    public async Task<(bool Success, string? Error)> WithdrawAsync(int id, Guid memberKey)
    {
        var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.MemberKey == memberKey);
        if (app == null) return (false, "Application not found.");

        var withdrawable = new[] { ApplicationStatus.Draft, ApplicationStatus.PendingPayment, ApplicationStatus.Submitted, ApplicationStatus.UnderReview };
        if (!withdrawable.Contains(app.Status))
            return (false, $"Cannot withdraw application in '{app.Status}' status.");

        app.Status = ApplicationStatus.Withdrawn;
        app.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Application #{Id} withdrawn by prospect", app.Id);
        return (true, null);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Stripe Checkout for Application Fee
    // ═══════════════════════════════════════════════════════════════

    public async Task<(string? CheckoutUrl, string? Error)> CreateCheckoutSessionAsync(
        int id, Guid memberKey, string successUrl, string cancelUrl)
    {
        var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.MemberKey == memberKey);
        if (app == null) return (null, "Application not found.");
        if (app.Status != ApplicationStatus.PendingPayment)
            return (null, "Application is not awaiting payment.");
        if (!app.FeeAmountCents.HasValue || app.FeeAmountCents.Value <= 0)
            return (null, "No fee required for this application.");

        var secretKey = await _stripeConfig.GetSecretKeyAsync();
        if (string.IsNullOrWhiteSpace(secretKey))
            return (null, "Payment system is not configured.");

        try
        {
            var client = new Stripe.StripeClient(secretKey);
            var connectedAccountId = await _stripeConfig.GetConnectedAccountIdAsync();
            var requestOptions = !string.IsNullOrWhiteSpace(connectedAccountId)
                ? new Stripe.RequestOptions { StripeAccount = connectedAccountId }
                : null;

            var sessionService = new Stripe.Checkout.SessionService(client);
            var session = await sessionService.CreateAsync(new Stripe.Checkout.SessionCreateOptions
            {
                Mode = "payment",
                LineItems = new List<Stripe.Checkout.SessionLineItemOptions>
                {
                    new()
                    {
                        PriceData = new Stripe.Checkout.SessionLineItemPriceDataOptions
                        {
                            Currency = "usd",
                            UnitAmount = app.FeeAmountCents.Value,
                            ProductData = new Stripe.Checkout.SessionLineItemPriceDataProductDataOptions
                            {
                                Name = "Rental Application Fee",
                            },
                        },
                        Quantity = 1,
                    },
                },
                Metadata = new Dictionary<string, string>
                {
                    ["rebraco_application_id"] = app.Id.ToString(),
                },
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                CustomerEmail = app.ApplicantEmail,
            }, requestOptions);

            app.StripeCheckoutSessionId = session.Id;
            app.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();

            _logger.LogInformation("Rebraco: Stripe Checkout session {SessionId} created for Application #{Id}",
                session.Id, app.Id);

            return (session.Url, null);
        }
        catch (Stripe.StripeException ex)
        {
            _logger.LogError(ex, "Rebraco: Stripe Checkout session creation failed for Application #{Id}", app.Id);
            return (null, "Payment session creation failed.");
        }
    }

    /// <summary>
    /// Handles the Stripe checkout.session.completed webhook event.
    /// Transitions application from PendingPayment → Submitted.
    /// </summary>
    public async Task HandleCheckoutCompletedAsync(Stripe.Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not Stripe.Checkout.Session session)
        {
            _logger.LogWarning("Rebraco: checkout.session.completed event without session data");
            return;
        }

        if (!session.Metadata.TryGetValue("rebraco_application_id", out var appIdStr)
            || !int.TryParse(appIdStr, out var appId))
        {
            return; // Not an application fee session
        }

        var app = await _db.Applications.FindAsync(appId);
        if (app == null)
        {
            _logger.LogWarning("Rebraco: Application #{Id} not found for checkout session {SessionId}", appId, session.Id);
            return;
        }

        if (app.Status != ApplicationStatus.PendingPayment) return; // Already processed

        app.Status = ApplicationStatus.Submitted;
        app.FeePaidAt = DateTimeOffset.UtcNow;
        app.SubmittedAt = DateTimeOffset.UtcNow;
        app.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Application #{Id} fee paid, status → Submitted", appId);

        try { await _email.SendApplicationReceivedAsync(app); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to send application received email for #{Id}", appId); }
    }

    // ═══════════════════════════════════════════════════════════════
    //  Manager Methods
    // ═══════════════════════════════════════════════════════════════

    public async Task<(List<Application> Items, int Total)> GetAllAsync(ApplicationFilterDto filter)
    {
        var query = _db.Applications
            .AsNoTracking()
            .Include(a => a.Property)
            .Include(a => a.Unit)
            .AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(a => a.Status == filter.Status.Value);

        if (filter.PropertyId.HasValue)
            query = query.Where(a => a.PropertyId == filter.PropertyId.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(a =>
                a.ApplicantFirstName.ToLower().Contains(s) ||
                a.ApplicantLastName.ToLower().Contains(s) ||
                a.ApplicantEmail.ToLower().Contains(s));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip(filter.Skip)
            .Take(filter.Take)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Application?> GetByIdAsync(int id)
    {
        return await _db.Applications
            .AsNoTracking()
            .Include(a => a.Property)
            .Include(a => a.Unit)
            .Include(a => a.ConvertedTenant)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<(bool Success, string? Error)> SetUnderReviewAsync(int id, Guid reviewerMemberKey)
    {
        var app = await _db.Applications.FindAsync(id);
        if (app == null) return (false, "Application not found.");
        if (app.Status != ApplicationStatus.Submitted)
            return (false, "Application must be in Submitted status.");

        app.Status = ApplicationStatus.UnderReview;
        app.ReviewedByMemberKey = reviewerMemberKey;
        app.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        try { await _email.SendApplicationStatusUpdateAsync(app, "Submitted", "UnderReview"); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to send status update email for #{Id}", id); }

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ApproveAsync(int id, Guid reviewerMemberKey)
    {
        var app = await _db.Applications.FindAsync(id);
        if (app == null) return (false, "Application not found.");

        var approvable = new[] { ApplicationStatus.Submitted, ApplicationStatus.UnderReview };
        if (!approvable.Contains(app.Status))
            return (false, "Application cannot be approved from current status.");

        app.Status = ApplicationStatus.Approved;
        app.ReviewedAt = DateTimeOffset.UtcNow;
        app.ReviewedByMemberKey = reviewerMemberKey;
        app.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        try { await _email.SendApplicationApprovedAsync(app); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to send approval email for #{Id}", id); }

        _logger.LogInformation("Rebraco: Application #{Id} approved by {Reviewer}", id, reviewerMemberKey);
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DenyAsync(int id, Guid reviewerMemberKey, string reason)
    {
        var app = await _db.Applications.FindAsync(id);
        if (app == null) return (false, "Application not found.");

        var deniable = new[] { ApplicationStatus.Submitted, ApplicationStatus.UnderReview };
        if (!deniable.Contains(app.Status))
            return (false, "Application cannot be denied from current status.");

        app.Status = ApplicationStatus.Denied;
        app.DenialReason = reason;
        app.ReviewedAt = DateTimeOffset.UtcNow;
        app.ReviewedByMemberKey = reviewerMemberKey;
        app.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        try { await _email.SendApplicationDeniedAsync(app, reason); }
        catch (Exception ex) { _logger.LogError(ex, "Failed to send denial email for #{Id}", id); }

        _logger.LogInformation("Rebraco: Application #{Id} denied by {Reviewer}", id, reviewerMemberKey);
        return (true, null);
    }

    /// <summary>
    /// Converts an approved application to a Tenant + Lease.
    /// Upgrades the prospect's member role from Prospect → Tenant.
    /// </summary>
    public async Task<(Tenant? Tenant, Lease? Lease, string? Error)> ConvertToTenantAsync(
        int applicationId, ConvertApplicationDto dto)
    {
        var app = await _db.Applications
            .Include(a => a.Property)
            .FirstOrDefaultAsync(a => a.Id == applicationId);

        if (app == null) return (null, null, "Application not found.");
        if (app.Status != ApplicationStatus.Approved)
            return (null, null, "Only approved applications can be converted.");

        // 1. Create tenant
        var (tenant, tenantError) = await _tenants.CreateAsync(new CreateTenantDto
        {
            FirstName = app.ApplicantFirstName,
            LastName = app.ApplicantLastName,
            Email = app.ApplicantEmail,
            Phone = app.ApplicantPhone,
            MoveInDate = dto.MoveInDate?.ToDateTime(TimeOnly.MinValue),
        });

        if (tenant == null)
            return (null, null, tenantError ?? "Failed to create tenant.");

        // 2. Create lease
        var (lease, leaseError) = await _leases.CreateAsync(new CreateLeaseDto
        {
            UnitId = dto.UnitId,
            TenantId = tenant.Id,
            BedDesignation = dto.BedDesignation,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MonthlyRent = dto.MonthlyRent,
            SecurityDeposit = dto.SecurityDeposit,
            Status = LeaseStatus.Active,
            LeaseType = Enum.TryParse<LeaseType>(dto.LeaseType, true, out var lt) ? lt : LeaseType.Fixed,
        });

        if (lease == null)
        {
            _db.Tenants.Remove(tenant);
            await _db.SaveChangesAsync();
            return (null, null, leaseError ?? "Failed to create lease.");
        }

        // 3. Upgrade prospect member → Tenant role
        var umbracoMember = _memberService.GetByEmail(app.ApplicantEmail);
        if (umbracoMember != null)
        {
            tenant.MemberKey = umbracoMember.Key;

            // Add Tenant role, keep Prospect role for backwards compat
            var existingRoles = _memberService.GetAllRoles(umbracoMember.Id);
            if (!existingRoles.Contains("Tenant"))
                _memberService.AssignRole(umbracoMember.Id, "Tenant");

            // Set tenant profile properties
            umbracoMember.SetValue("phone", app.ApplicantPhone ?? "");
            _memberService.Save(umbracoMember);
        }

        // 4. Mark application as converted
        app.Status = ApplicationStatus.Converted;
        app.ConvertedTenantId = tenant.Id;
        app.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Rebraco: Application #{AppId} converted → Tenant #{TenantId}, Lease #{LeaseId}",
            applicationId, tenant.Id, lease.Id);

        return (tenant, lease, null);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Validation
    // ═══════════════════════════════════════════════════════════════

    private async Task<string?> ValidateRequiredSectionsAsync(Application app)
    {
        var s = await _settings.GetSettingsAsync();

        if (s.RequireEmployment && string.IsNullOrWhiteSpace(app.EmploymentJson))
            return "Employment information is required.";
        if (s.RequireRentalHistory && string.IsNullOrWhiteSpace(app.RentalHistoryJson))
            return "Rental history is required.";
        if (s.RequireReferences && string.IsNullOrWhiteSpace(app.ReferencesJson))
            return "References are required.";
        if (s.RequireEmergencyContact && string.IsNullOrWhiteSpace(app.EmergencyContactJson))
            return "Emergency contact information is required.";
        if (s.RequireVehicle && string.IsNullOrWhiteSpace(app.VehicleJson))
            return "Vehicle information is required.";
        if (s.RequireCoSigner && string.IsNullOrWhiteSpace(app.CoSignerJson))
            return "Co-signer information is required.";
        if (s.RequirePets && string.IsNullOrWhiteSpace(app.PetsJson))
            return "Pet information is required.";
        if (s.RequireAdditionalNotes && string.IsNullOrWhiteSpace(app.AdditionalNotes))
            return "Additional notes are required.";

        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════
//  DTOs
// ═══════════════════════════════════════════════════════════════════

public class CreateApplicationDto
{
    public int PropertyId { get; set; }
    public int? UnitId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateOnly? DesiredMoveInDate { get; set; }
    public string? DesiredLeaseTerm { get; set; }
}

public class UpdateApplicationDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int? UnitId { get; set; }
    public DateOnly? DesiredMoveInDate { get; set; }
    public string? DesiredLeaseTerm { get; set; }

    // Section JSON
    public string? EmploymentJson { get; set; }
    public string? RentalHistoryJson { get; set; }
    public string? ReferencesJson { get; set; }
    public string? EmergencyContactJson { get; set; }
    public string? VehicleJson { get; set; }
    public string? CoSignerJson { get; set; }
    public string? PetsJson { get; set; }
    public string? AdditionalNotes { get; set; }
}

public class ApplicationFilterDto
{
    public ApplicationStatus? Status { get; set; }
    public int? PropertyId { get; set; }
    public string? Search { get; set; }
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 25;
}

public class ConvertApplicationDto
{
    public int UnitId { get; set; }
    public string? BedDesignation { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal SecurityDeposit { get; set; }
    public string? LeaseType { get; set; }
    public DateOnly? MoveInDate { get; set; }
}
