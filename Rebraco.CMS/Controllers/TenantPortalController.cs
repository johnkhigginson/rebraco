using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;
using Umbraco.Cms.Web.Common.Security;

namespace Rebraco.CMS.Controllers;

/// <summary>
/// Tenant-facing API. All endpoints are scoped to the current tenant
/// (resolved via Umbraco member → MemberKey → Tenant entity).
/// </summary>
[ApiController]
[Route("api/portal")]
[UmbracoMemberAuthorize("", "Tenant", "")]
public class TenantPortalController : ControllerBase
{
    private readonly RebracoDbContext _db;
    private readonly IMemberManager _memberManager;
    private readonly IPaymentService _paymentService;
    private readonly LeaseRenewalService _renewals;
    private readonly MediaUploadService _media;
    private readonly IEmailService _emailService;
    private readonly ILogger<TenantPortalController> _logger;

    public TenantPortalController(
        RebracoDbContext db,
        IMemberManager memberManager,
        IPaymentService paymentService,
        LeaseRenewalService renewals,
        MediaUploadService media,
        IEmailService emailService,
        ILogger<TenantPortalController> logger)
    {
        _db = db;
        _memberManager = memberManager;
        _paymentService = paymentService;
        _renewals = renewals;
        _media = media;
        _emailService = emailService;
        _logger = logger;
    }

    // ─── Profile ─────────────────────────────────────────────────

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized(new { error = "Tenant profile not found." });

        return Ok(new
        {
            tenant.Id,
            tenant.FirstName,
            tenant.LastName,
            tenant.Email,
            tenant.Phone,
            tenant.EmergencyContactName,
            tenant.EmergencyContactPhone,
            tenant.MoveInDate,
            Status = tenant.Status.ToString(),
        });
    }

    [HttpPatch("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateTenantProfileRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized(new { error = "Tenant profile not found." });

        if (request.Phone != null) tenant.Phone = request.Phone;
        if (request.EmergencyContactName != null) tenant.EmergencyContactName = request.EmergencyContactName;
        if (request.EmergencyContactPhone != null) tenant.EmergencyContactPhone = request.EmergencyContactPhone;

        tenant.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // ─── Leases ──────────────────────────────────────────────────

    [HttpGet("leases")]
    public async Task<IActionResult> GetLeases()
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var leases = await _db.Leases
            .AsNoTracking()
            .Include(l => l.Unit)
                .ThenInclude(u => u.Property)
            .Where(l => l.TenantId == tenant.Id)
            .OrderByDescending(l => l.StartDate)
            .Select(l => new
            {
                l.Id,
                l.BedDesignation,
                l.StartDate,
                l.EndDate,
                l.MonthlyRent,
                l.SecurityDeposit,
                Status = l.Status.ToString(),
                LeaseType = l.LeaseType.ToString(),
                Unit = new
                {
                    l.Unit.Id,
                    l.Unit.UnitNumber,
                    l.Unit.Bedrooms,
                    l.Unit.Bathrooms,
                    l.Unit.SqFt,
                    l.Unit.Furnished,
                    l.Unit.ParkingIncluded,
                    l.Unit.UtilitiesIncluded,
                },
                Property = new
                {
                    l.Unit.Property.Id,
                    l.Unit.Property.Name,
                    l.Unit.Property.Street,
                    l.Unit.Property.City,
                    l.Unit.Property.State,
                    l.Unit.Property.Zip,
                    l.Unit.Property.ContactEmail,
                    l.Unit.Property.ContactPhone,
                },
            })
            .ToListAsync();

        return Ok(new { items = leases });
    }

    [HttpGet("leases/{id:int}")]
    public async Task<IActionResult> GetLease(int id)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var lease = await _db.Leases
            .AsNoTracking()
            .Include(l => l.Unit)
                .ThenInclude(u => u.Property)
            .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenant.Id);

        if (lease == null) return NotFound();

        return Ok(new
        {
            lease.Id,
            lease.BedDesignation,
            lease.StartDate,
            lease.EndDate,
            lease.MonthlyRent,
            lease.SecurityDeposit,
            Status = lease.Status.ToString(),
            LeaseType = lease.LeaseType.ToString(),
            Unit = new
            {
                lease.Unit.Id,
                lease.Unit.UnitNumber,
                lease.Unit.Bedrooms,
                lease.Unit.Bathrooms,
                lease.Unit.SqFt,
                lease.Unit.Capacity,
                lease.Unit.Furnished,
                lease.Unit.PetsAllowed,
                lease.Unit.ParkingIncluded,
                lease.Unit.UtilitiesIncluded,
                lease.Unit.Features,
                lease.Unit.FeaturedImageUrl,
            },
            Property = new
            {
                lease.Unit.Property.Id,
                lease.Unit.Property.Name,
                lease.Unit.Property.Street,
                lease.Unit.Property.City,
                lease.Unit.Property.State,
                lease.Unit.Property.Zip,
                lease.Unit.Property.ContactEmail,
                lease.Unit.Property.ContactPhone,
                lease.Unit.Property.BuildingAmenities,
            },
        });
    }

    // ─── Maintenance ─────────────────────────────────────────────

    [HttpGet("maintenance")]
    public async Task<IActionResult> GetMaintenanceRequests()
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var requests = await _db.MaintenanceRequests
            .AsNoTracking()
            .Include(m => m.Unit)
            .Where(m => m.TenantId == tenant.Id)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new
            {
                m.Id,
                m.Title,
                Priority = m.Priority.ToString(),
                Status = m.Status.ToString(),
                Category = m.Category.ToString(),
                m.CreatedAt,
                m.ScheduledDate,
                m.CompletedDate,
                UnitNumber = m.Unit.UnitNumber,
            })
            .ToListAsync();

        return Ok(new { items = requests });
    }

    [HttpGet("maintenance/{id:int}")]
    public async Task<IActionResult> GetMaintenanceRequest(int id)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var request = await _db.MaintenanceRequests
            .AsNoTracking()
            .Include(m => m.Unit)
            .Include(m => m.Images.OrderBy(i => i.SortOrder))
            .Include(m => m.Notes.OrderByDescending(n => n.CreatedAt))
                .ThenInclude(n => n.Images.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenant.Id);

        if (request == null) return NotFound();

        return Ok(new
        {
            request.Id,
            request.Title,
            request.Description,
            request.LocationDetail,
            request.PermissionToEnter,
            request.PreferredAvailability,
            request.UrgencyNotes,
            Priority = request.Priority.ToString(),
            Status = request.Status.ToString(),
            Category = request.Category.ToString(),
            request.CreatedAt,
            request.ScheduledDate,
            request.CompletedDate,
            UnitNumber = request.Unit.UnitNumber,
            Images = request.Images.Select(i => new { i.Id, i.Url, i.Alt, i.SortOrder }),
            Notes = request.Notes.Select(n => new
            {
                n.Id,
                n.Author,
                n.Content,
                n.CreatedAt,
                Images = n.Images.Select(i => new { i.Id, i.Url, i.Alt, i.SortOrder }),
            }),
        });
    }

    [HttpPost("maintenance")]
    public async Task<IActionResult> SubmitMaintenanceRequest(
        [FromBody] SubmitMaintenanceRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        // Verify the unit belongs to an active lease for this tenant
        var activeLease = await _db.Leases
            .AsNoTracking()
            .FirstOrDefaultAsync(l =>
                l.TenantId == tenant.Id &&
                l.UnitId == request.UnitId &&
                l.Status == LeaseStatus.Active);

        if (activeLease == null)
            return BadRequest(new { error = "You don't have an active lease for this unit." });

        var maintenanceRequest = new MaintenanceRequest
        {
            UnitId = request.UnitId,
            TenantId = tenant.Id,
            Title = request.Title,
            Description = request.Description,
            LocationDetail = request.LocationDetail,
            PermissionToEnter = request.PermissionToEnter,
            PreferredAvailability = request.PreferredAvailability,
            UrgencyNotes = request.UrgencyNotes,
            Priority = Enum.TryParse<MaintenancePriority>(request.Priority, true, out var p)
                ? p : MaintenancePriority.Medium,
            Category = Enum.TryParse<MaintenanceCategory>(request.Category, true, out var c)
                ? c : MaintenanceCategory.Other,
            Status = MaintenanceStatus.Open,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _db.MaintenanceRequests.Add(maintenanceRequest);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Rebraco: Tenant #{TenantId} submitted maintenance request #{RequestId} for unit #{UnitId}",
            tenant.Id, maintenanceRequest.Id, request.UnitId);

        // Notify property manager via email
        try
        {
            var fullRequest = await _db.MaintenanceRequests
                .Include(m => m.Unit).ThenInclude(u => u.Property)
                .FirstAsync(m => m.Id == maintenanceRequest.Id);
            await _emailService.SendMaintenanceSubmittedAsync(fullRequest, tenant);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Rebraco: Failed to send maintenance submitted email for Request #{RequestId}", maintenanceRequest.Id);
        }

        return Ok(new { id = maintenanceRequest.Id });
    }

    [HttpPost("maintenance/{id:int}/notes")]
    public async Task<IActionResult> AddMaintenanceNote(int id, [FromBody] TenantAddNoteRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var maintenanceRequest = await _db.MaintenanceRequests
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenant.Id);

        if (maintenanceRequest == null) return NotFound();

        var note = new MaintenanceNote
        {
            MaintenanceRequestId = id,
            Author = $"{tenant.FirstName} {tenant.LastName}",
            Content = request.Content,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _db.MaintenanceNotes.Add(note);
        maintenanceRequest.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { id = note.Id });
    }

    // ─── Maintenance Images ───────────────────────────────────

    /// <summary>Upload an image to a tenant's maintenance request.</summary>
    [HttpPost("maintenance/{id:int}/images")]
    public async Task<IActionResult> UploadMaintenanceImage(int id, [FromForm] IFormFile file, [FromForm] string? alt)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var request = await _db.MaintenanceRequests
            .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenant.Id);
        if (request == null) return NotFound();

        var (url, error) = _media.Upload(file, "Maintenance");
        if (url == null) return BadRequest(new { error });

        var maxSort = await _db.MaintenanceImages
            .Where(i => i.MaintenanceRequestId == id)
            .MaxAsync(i => (int?)i.SortOrder) ?? -1;

        var image = new MaintenanceImage
        {
            MaintenanceRequestId = id,
            Url = url,
            Alt = alt,
            SortOrder = maxSort + 1,
        };

        _db.MaintenanceImages.Add(image);
        request.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { image.Id, image.Url, image.Alt, image.SortOrder });
    }

    /// <summary>Upload an image to a tenant's maintenance note.</summary>
    [HttpPost("maintenance/{id:int}/notes/{noteId:int}/images")]
    public async Task<IActionResult> UploadMaintenanceNoteImage(
        int id, int noteId, [FromForm] IFormFile file, [FromForm] string? alt)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        // Verify the request belongs to this tenant
        var request = await _db.MaintenanceRequests
            .AsNoTracking()
            .AnyAsync(m => m.Id == id && m.TenantId == tenant.Id);
        if (!request) return NotFound();

        var note = await _db.MaintenanceNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.MaintenanceRequestId == id);
        if (note == null) return NotFound(new { error = "Note not found." });

        var (url, error) = _media.Upload(file, "Maintenance");
        if (url == null) return BadRequest(new { error });

        var maxSort = await _db.MaintenanceNoteImages
            .Where(i => i.MaintenanceNoteId == noteId)
            .MaxAsync(i => (int?)i.SortOrder) ?? -1;

        var image = new MaintenanceNoteImage
        {
            MaintenanceNoteId = noteId,
            Url = url,
            Alt = alt,
            SortOrder = maxSort + 1,
        };

        _db.MaintenanceNoteImages.Add(image);
        await _db.SaveChangesAsync();

        return Ok(new { image.Id, image.Url, image.Alt, image.SortOrder });
    }

    // ─── Invoices & Payments ────────────────────────────────────

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices()
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var invoices = await _paymentService.GetTenantInvoicesAsync(tenant.Id);

        return Ok(new
        {
            items = invoices.Select(i => new
            {
                i.Id,
                i.Description,
                i.AmountCents,
                Status = i.Status.ToString(),
                i.DueDate,
                i.PaidAt,
                i.CreatedAt,
            }),
        });
    }

    [HttpGet("invoices/{id:int}")]
    public async Task<IActionResult> GetInvoice(int id)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var invoice = await _paymentService.GetTenantInvoiceByIdAsync(id, tenant.Id);
        if (invoice == null) return NotFound();

        return Ok(new
        {
            invoice.Id,
            invoice.Description,
            invoice.AmountCents,
            Status = invoice.Status.ToString(),
            invoice.DueDate,
            invoice.PaidAt,
            invoice.CreatedAt,
            Payments = invoice.Payments.Select(p => new
            {
                p.Id,
                p.AmountCents,
                Status = p.Status.ToString(),
                p.FailureReason,
                p.CreatedAt,
            }),
        });
    }

    [HttpPost("invoices/{id:int}/pay")]
    public async Task<IActionResult> PayInvoice(int id)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        try
        {
            var result = await _paymentService.CreatePaymentIntentAsync(id, tenant.Id);
            return Ok(new
            {
                clientSecret = result.ClientSecret,
                publishableKey = result.PublishableKey,
                connectedAccountId = result.ConnectedAccountId,
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments()
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var payments = await _paymentService.GetTenantPaymentsAsync(tenant.Id);

        return Ok(new
        {
            items = payments.Select(p => new
            {
                p.Id,
                p.AmountCents,
                Status = p.Status.ToString(),
                p.StripePaymentIntentId,
                p.FailureReason,
                p.CreatedAt,
                InvoiceDescription = p.Invoice.Description,
                p.InvoiceId,
            }),
        });
    }

    // ─── Unit Info ────────────────────────────────────────────────

    [HttpGet("unit")]
    public async Task<IActionResult> GetCurrentUnit()
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var activeLease = await _db.Leases
            .AsNoTracking()
            .Include(l => l.Unit)
                .ThenInclude(u => u.Property)
            .Where(l => l.TenantId == tenant.Id && l.Status == LeaseStatus.Active)
            .OrderByDescending(l => l.StartDate)
            .FirstOrDefaultAsync();

        if (activeLease == null)
            return Ok(new { unit = (object?)null, lease = (object?)null });

        return Ok(new
        {
            unit = new
            {
                activeLease.Unit.Id,
                activeLease.Unit.UnitNumber,
                activeLease.Unit.Bedrooms,
                activeLease.Unit.Bathrooms,
                activeLease.Unit.SqFt,
                activeLease.Unit.Furnished,
                activeLease.Unit.ParkingIncluded,
                activeLease.Unit.UtilitiesIncluded,
                activeLease.Unit.Features,
                PropertyName = activeLease.Unit.Property.Name,
                PropertyAddress = $"{activeLease.Unit.Property.Street}, {activeLease.Unit.Property.City}, {activeLease.Unit.Property.State} {activeLease.Unit.Property.Zip}",
                ContactEmail = activeLease.Unit.Property.ContactEmail,
                ContactPhone = activeLease.Unit.Property.ContactPhone,
            },
            lease = new
            {
                activeLease.Id,
                activeLease.StartDate,
                activeLease.EndDate,
                activeLease.MonthlyRent,
                activeLease.BedDesignation,
                Status = activeLease.Status.ToString(),
            },
        });
    }

    // ─── Lease Documents ────────────────────────────────────────

    /// <summary>List documents for a lease (read-only access for tenants).</summary>
    [HttpGet("leases/{leaseId:int}/documents")]
    public async Task<IActionResult> GetLeaseDocuments(int leaseId)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        // Verify this lease belongs to the tenant
        var lease = await _db.Leases
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == leaseId && l.TenantId == tenant.Id);

        if (lease == null) return NotFound(new { error = "Lease not found." });

        var documents = await _db.LeaseDocuments
            .AsNoTracking()
            .Where(d => d.LeaseId == leaseId)
            .OrderBy(d => d.SortOrder)
            .Select(d => new
            {
                d.Id,
                d.Url,
                d.FileName,
                d.FileSize,
                DocumentType = d.DocumentType.ToString(),
                d.Description,
                d.CreatedAt,
            })
            .ToListAsync();

        return Ok(new { documents });
    }

    // ─── Lease Renewals ─────────────────────────────────────────

    /// <summary>List renewal offers for the tenant's leases.</summary>
    [HttpGet("renewals")]
    public async Task<IActionResult> GetRenewals()
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var renewals = await _db.LeaseRenewals
            .AsNoTracking()
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Unit)
                    .ThenInclude(u => u.Property)
            .Where(r => r.OriginalLease.TenantId == tenant.Id)
            .OrderByDescending(r => r.OfferedAt)
            .Select(r => new
            {
                r.Id,
                r.OriginalLeaseId,
                r.ProposedStartDate,
                r.ProposedEndDate,
                r.ProposedMonthlyRent,
                ProposedLeaseType = r.ProposedLeaseType.ToString(),
                Status = r.Status.ToString(),
                r.ManagerNotes,
                r.TenantNotes,
                r.OfferedAt,
                r.TenantRespondedAt,
                r.ConfirmedAt,
                OriginalLease = new
                {
                    r.OriginalLease.Id,
                    r.OriginalLease.StartDate,
                    r.OriginalLease.EndDate,
                    r.OriginalLease.MonthlyRent,
                },
                UnitNumber = r.OriginalLease.Unit.UnitNumber,
                PropertyName = r.OriginalLease.Unit.Property.Name,
            })
            .ToListAsync();

        return Ok(new { renewals });
    }

    /// <summary>Get a specific renewal offer detail.</summary>
    [HttpGet("renewals/{id:int}")]
    public async Task<IActionResult> GetRenewal(int id)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var renewal = await _db.LeaseRenewals
            .AsNoTracking()
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Unit)
                    .ThenInclude(u => u.Property)
            .FirstOrDefaultAsync(r => r.Id == id && r.OriginalLease.TenantId == tenant.Id);

        if (renewal == null) return NotFound(new { error = "Renewal not found." });

        return Ok(new
        {
            renewal.Id,
            renewal.OriginalLeaseId,
            renewal.ProposedStartDate,
            renewal.ProposedEndDate,
            renewal.ProposedMonthlyRent,
            ProposedLeaseType = renewal.ProposedLeaseType.ToString(),
            Status = renewal.Status.ToString(),
            renewal.ManagerNotes,
            renewal.TenantNotes,
            renewal.OfferedAt,
            renewal.TenantRespondedAt,
            renewal.ConfirmedAt,
            OriginalLease = new
            {
                renewal.OriginalLease.Id,
                renewal.OriginalLease.StartDate,
                renewal.OriginalLease.EndDate,
                renewal.OriginalLease.MonthlyRent,
            },
            UnitNumber = renewal.OriginalLease.Unit.UnitNumber,
            PropertyName = renewal.OriginalLease.Unit.Property.Name,
        });
    }

    /// <summary>Tenant accepts a renewal offer.</summary>
    [HttpPost("renewals/{id:int}/accept")]
    public async Task<IActionResult> AcceptRenewal(int id, [FromBody] TenantRenewalResponseRequest? request)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var (renewal, error) = await _renewals.TenantRespondAsync(id, tenant.Id, true, request?.Notes);
        if (renewal == null) return BadRequest(new { error });

        return Ok(new { success = true, status = renewal.Status.ToString() });
    }

    /// <summary>Tenant declines a renewal offer.</summary>
    [HttpPost("renewals/{id:int}/decline")]
    public async Task<IActionResult> DeclineRenewal(int id, [FromBody] TenantRenewalResponseRequest? request)
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null) return Unauthorized();

        var (renewal, error) = await _renewals.TenantRespondAsync(id, tenant.Id, false, request?.Notes);
        if (renewal == null) return BadRequest(new { error });

        return Ok(new { success = true, status = renewal.Status.ToString() });
    }

    // ─── Helper ──────────────────────────────────────────────────

    private async Task<Tenant?> GetCurrentTenantAsync()
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null) return null;

        var memberKey = member.Key;
        return await _db.Tenants.FirstOrDefaultAsync(t => t.MemberKey == memberKey);
    }
}

// ─── Request DTOs ────────────────────────────────────────────

public class UpdateTenantProfileRequest
{
    [MaxLength(30)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    public string? EmergencyContactName { get; set; }

    [MaxLength(30)]
    public string? EmergencyContactPhone { get; set; }
}

public class SubmitMaintenanceRequest
{
    [Required]
    public int UnitId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? LocationDetail { get; set; }

    public bool PermissionToEnter { get; set; }

    [MaxLength(500)]
    public string? PreferredAvailability { get; set; }

    [MaxLength(500)]
    public string? UrgencyNotes { get; set; }

    public string? Priority { get; set; }
    public string? Category { get; set; }
}

public class TenantAddNoteRequest
{
    [Required, MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
}

public class TenantRenewalResponseRequest
{
    [MaxLength(1000)]
    public string? Notes { get; set; }
}
