using PostmarkDotNet;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public class PostmarkEmailServiceOptions
{
    public string ServerToken { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "rebraco@pm.mwsoutbound.com";
    public string NotifyEmail { get; set; } = string.Empty;
}

public class PostmarkEmailService : IEmailService
{
    private readonly PostmarkClient _client;
    private readonly PostmarkEmailServiceOptions _options;
    private readonly RebracoDbContext _db;
    private readonly ILogger<PostmarkEmailService> _logger;

    public PostmarkEmailService(
        PostmarkEmailServiceOptions options,
        RebracoDbContext db,
        ILogger<PostmarkEmailService> logger)
    {
        _options = options;
        _db = db;
        _client = new PostmarkClient(options.ServerToken);
        _logger = logger;
    }

    /// <summary>Resolve from DB override, falling back to startup config.</summary>
    private async Task<(string from, string notify)> ResolveEmailSettingsAsync()
    {
        var fromSetting = await _db.AppSettings.FindAsync("email:fromEmail");
        var notifySetting = await _db.AppSettings.FindAsync("email:notifyEmail");

        var from = !string.IsNullOrWhiteSpace(fromSetting?.Value) ? fromSetting.Value : _options.FromEmail;
        var notify = !string.IsNullOrWhiteSpace(notifySetting?.Value) ? notifySetting.Value : _options.NotifyEmail;
        return (from, notify);
    }

    public async Task SendInquiryNotificationAsync(Inquiry inquiry)
    {
        var (fromEmail, notifyEmail) = await ResolveEmailSettingsAsync();

        if (string.IsNullOrWhiteSpace(notifyEmail))
        {
            _logger.LogWarning("Rebraco: NotifyEmail not configured, skipping notification.");
            return;
        }

        var subject = $"New Inquiry: {inquiry.FullName}";
        if (!string.IsNullOrWhiteSpace(inquiry.PropertyName))
            subject += $" — {inquiry.PropertyName}";

        var body = BuildHtmlBody(inquiry);

        var message = new PostmarkMessage
        {
            From = fromEmail,
            To = notifyEmail,
            Subject = subject,
            HtmlBody = body,
            TextBody = BuildTextBody(inquiry),
            MessageStream = "outbound"
        };

        var response = await _client.SendMessageAsync(message);

        if (response.Status == PostmarkStatus.Success)
        {
            _logger.LogInformation(
                "Rebraco: Inquiry notification sent for {Name} (MessageID: {Id})",
                inquiry.FullName, response.MessageID);
        }
        else
        {
            _logger.LogError(
                "Rebraco: Postmark send failed — {Status}: {Message}",
                response.Status, response.Message);
        }
    }

    private static string BuildHtmlBody(Inquiry inquiry)
    {
        var rows = new List<string>
        {
            Row("Name", inquiry.FullName),
            Row("Email", $"<a href=\"mailto:{inquiry.Email}\">{inquiry.Email}</a>"),
        };

        if (!string.IsNullOrWhiteSpace(inquiry.Phone))
            rows.Add(Row("Phone", inquiry.Phone));
        if (!string.IsNullOrWhiteSpace(inquiry.PropertyName))
            rows.Add(Row("Property", inquiry.PropertyName));
        if (!string.IsNullOrWhiteSpace(inquiry.UnitName))
            rows.Add(Row("Unit", inquiry.UnitName));
        if (inquiry.PreferredMoveInDate.HasValue)
            rows.Add(Row("Move-in Date", inquiry.PreferredMoveInDate.Value.ToString("MMMM d, yyyy")));
        if (!string.IsNullOrWhiteSpace(inquiry.PreferredLeaseTerm))
            rows.Add(Row("Lease Term", inquiry.PreferredLeaseTerm));
        if (!string.IsNullOrWhiteSpace(inquiry.Message))
            rows.Add(Row("Message", inquiry.Message.Replace("\n", "<br>")));

        rows.Add(Row("Source", inquiry.Source));
        rows.Add(Row("Submitted", inquiry.CreatedAt.ToString("MMM d, yyyy h:mm tt UTC")));

        return $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">New Rental Inquiry</h2>
  <table style=""width: 100%; border-collapse: collapse;"">
    {string.Join("\n    ", rows)}
  </table>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">
    Sent by Rebraco — manage this inquiry in the <a href=""#"">management portal</a>.
  </p>
</div>";
    }

    private static string Row(string label, string value)
    {
        return $@"<tr>
      <td style=""padding: 8px 12px 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; white-space: nowrap; vertical-align: top;"">{label}</td>
      <td style=""padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;"">{value}</td>
    </tr>";
    }

    private static string BuildTextBody(Inquiry inquiry)
    {
        var lines = new List<string>
        {
            "NEW RENTAL INQUIRY",
            "==================",
            "",
            $"Name: {inquiry.FullName}",
            $"Email: {inquiry.Email}",
        };

        if (!string.IsNullOrWhiteSpace(inquiry.Phone))
            lines.Add($"Phone: {inquiry.Phone}");
        if (!string.IsNullOrWhiteSpace(inquiry.PropertyName))
            lines.Add($"Property: {inquiry.PropertyName}");
        if (!string.IsNullOrWhiteSpace(inquiry.UnitName))
            lines.Add($"Unit: {inquiry.UnitName}");
        if (inquiry.PreferredMoveInDate.HasValue)
            lines.Add($"Move-in Date: {inquiry.PreferredMoveInDate.Value:MMMM d, yyyy}");
        if (!string.IsNullOrWhiteSpace(inquiry.PreferredLeaseTerm))
            lines.Add($"Lease Term: {inquiry.PreferredLeaseTerm}");
        if (!string.IsNullOrWhiteSpace(inquiry.Message))
        {
            lines.Add("");
            lines.Add($"Message: {inquiry.Message}");
        }

        lines.Add("");
        lines.Add($"Source: {inquiry.Source}");
        lines.Add($"Submitted: {inquiry.CreatedAt:MMM d, yyyy h:mm tt UTC}");

        return string.Join("\n", lines);
    }

    public async Task SendPasswordResetAsync(string email, string firstName, string resetUrl)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();

        var subject = "Reset Your Password";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">Password Reset</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {firstName}, we received a request to reset your password. Click the button below to choose a new password.
  </p>
  <div style=""margin: 24px 0; text-align: center;"">
    <a href=""{resetUrl}""
       style=""display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;"">
      Reset Password
    </a>
  </div>
  <p style=""font-size: 13px; color: #64748b; line-height: 1.6;"">
    If you didn't request this, you can safely ignore this email. This link will expire shortly.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">
    Sent by Rebraco
  </p>
</div>";

        var textBody = $@"Password Reset

Hi {firstName}, we received a request to reset your password.

Reset your password here: {resetUrl}

If you didn't request this, you can safely ignore this email.";

        var message = new PostmarkMessage
        {
            From = fromEmail,
            To = email,
            Subject = subject,
            HtmlBody = htmlBody,
            TextBody = textBody,
            MessageStream = "outbound"
        };

        var response = await _client.SendMessageAsync(message);

        if (response.Status == PostmarkStatus.Success)
        {
            _logger.LogInformation("Rebraco: Password reset email sent to {Email} (MessageID: {Id})",
                email, response.MessageID);
        }
        else
        {
            _logger.LogError("Rebraco: Postmark send failed for password reset — {Status}: {Message}",
                response.Status, response.Message);
        }
    }

    // ── Transactional notifications ──────────────────────────────────────

    public async Task SendInvoiceNotificationAsync(Invoice invoice, Tenant tenant)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();
        var amount = (invoice.AmountCents / 100m).ToString("C");

        var subject = $"Invoice: {invoice.Description} — {amount}";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">New Invoice</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tenant.FirstName}, a new invoice has been created for your account.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Description", invoice.Description)}
    {Row("Amount", amount)}
    {Row("Due Date", invoice.DueDate.ToString("MMMM d, yyyy"))}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Please log in to your tenant portal to view details and make a payment.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">
    Sent by Rebraco Tenant Portal
  </p>
</div>";

        var textBody = $@"New Invoice

Hi {tenant.FirstName}, a new invoice has been created for your account.

Description: {invoice.Description}
Amount: {amount}
Due Date: {invoice.DueDate:MMMM d, yyyy}

Please log in to your tenant portal to view details and make a payment.";

        await SendAsync(fromEmail, tenant.Email, subject, htmlBody, textBody, "invoice notification");
    }

    public async Task SendPaymentConfirmationAsync(Invoice invoice, Tenant tenant)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();
        var amount = (invoice.AmountCents / 100m).ToString("C");

        var subject = $"Payment Confirmed — {amount}";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #16a34a; margin-bottom: 16px;"">Payment Confirmed</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tenant.FirstName}, your payment has been received. Thank you!
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Description", invoice.Description)}
    {Row("Amount Paid", amount)}
    {Row("Date Paid", (invoice.PaidAt ?? DateTimeOffset.UtcNow).ToString("MMMM d, yyyy h:mm tt UTC"))}
    {Row("Invoice #", invoice.Id.ToString())}
  </table>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">
    Sent by Rebraco Tenant Portal
  </p>
</div>";

        var textBody = $@"Payment Confirmed

Hi {tenant.FirstName}, your payment has been received. Thank you!

Description: {invoice.Description}
Amount Paid: {amount}
Date Paid: {(invoice.PaidAt ?? DateTimeOffset.UtcNow):MMMM d, yyyy h:mm tt UTC}
Invoice #: {invoice.Id}";

        await SendAsync(fromEmail, tenant.Email, subject, htmlBody, textBody, "payment confirmation");
    }

    public async Task SendInvoiceOverdueAsync(Invoice invoice, Tenant tenant)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();
        var amount = (invoice.AmountCents / 100m).ToString("C");
        var daysOverdue = (DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - invoice.DueDate.DayNumber);

        var subject = $"Overdue: {invoice.Description} — {amount} (past due)";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #dc2626; margin-bottom: 16px;"">Invoice Past Due</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tenant.FirstName}, the following invoice is past due. Please make a payment as soon as possible.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Description", invoice.Description)}
    {Row("Amount Due", amount)}
    {Row("Due Date", invoice.DueDate.ToString("MMMM d, yyyy"))}
    {Row("Days Overdue", daysOverdue.ToString())}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Please log in to your tenant portal to make a payment immediately.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">
    Sent by Rebraco Tenant Portal
  </p>
</div>";

        var textBody = $@"Invoice Past Due

Hi {tenant.FirstName}, the following invoice is past due. Please make a payment as soon as possible.

Description: {invoice.Description}
Amount Due: {amount}
Due Date: {invoice.DueDate:MMMM d, yyyy}
Days Overdue: {daysOverdue}

Please log in to your tenant portal to make a payment immediately.";

        await SendAsync(fromEmail, tenant.Email, subject, htmlBody, textBody, "invoice overdue");
    }

    public async Task SendMaintenanceStatusUpdateAsync(MaintenanceRequest request, Tenant tenant,
        string oldStatus, string newStatus)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();

        var subject = $"Maintenance Update: {request.Title}";
        var rows = new List<string>
        {
            Row("Request", request.Title),
            Row("Status", $"{oldStatus} → {newStatus}"),
            Row("Category", request.Category.ToString()),
        };

        if (request.CompletedDate.HasValue)
            rows.Add(Row("Completed", request.CompletedDate.Value.ToString("MMMM d, yyyy")));

        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">Maintenance Update</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tenant.FirstName}, there's an update on your maintenance request.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {string.Join("\n    ", rows)}
  </table>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">
    Sent by Rebraco Tenant Portal
  </p>
</div>";

        var textBody = $@"Maintenance Update

Hi {tenant.FirstName}, there's an update on your maintenance request.

Request: {request.Title}
Status: {oldStatus} → {newStatus}
Category: {request.Category}{(request.CompletedDate.HasValue ? $"\nCompleted: {request.CompletedDate.Value:MMMM d, yyyy}" : "")}";

        await SendAsync(fromEmail, tenant.Email, subject, htmlBody, textBody, "maintenance status update");
    }

    public async Task SendMaintenanceSubmittedAsync(MaintenanceRequest request, Tenant tenant)
    {
        var (fromEmail, notifyEmail) = await ResolveEmailSettingsAsync();
        var toEmail = !string.IsNullOrWhiteSpace(notifyEmail) ? notifyEmail : fromEmail;

        var tenantName = $"{tenant.FirstName} {tenant.LastName}";
        var unitInfo = request.Unit != null
            ? $"{request.Unit.Property?.Name} — Unit {request.Unit.UnitNumber}"
            : $"Unit #{request.UnitId}";

        var subject = $"New Maintenance Request: {request.Title}";
        var rows = new List<string>
        {
            Row("Tenant", tenantName),
            Row("Unit", unitInfo),
            Row("Category", request.Category.ToString()),
            Row("Priority", request.Priority.ToString()),
        };

        if (!string.IsNullOrWhiteSpace(request.LocationDetail))
            rows.Add(Row("Location", request.LocationDetail));

        rows.Add(Row("Permission to Enter", request.PermissionToEnter ? "Yes" : "No"));

        if (!string.IsNullOrWhiteSpace(request.Description))
            rows.Add(Row("Description", request.Description.Length > 200 ? request.Description[..200] + "…" : request.Description));

        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">New Maintenance Request</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    A tenant has submitted a new maintenance request that needs attention.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {string.Join("\n    ", rows)}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Log in to the management portal to review and assign this request.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"New Maintenance Request

Tenant: {tenantName}
Unit: {unitInfo}
Category: {request.Category}
Priority: {request.Priority}
{(!string.IsNullOrWhiteSpace(request.LocationDetail) ? $"Location: {request.LocationDetail}\n" : "")}Permission to Enter: {(request.PermissionToEnter ? "Yes" : "No")}
{(!string.IsNullOrWhiteSpace(request.Description) ? $"\nDescription: {request.Description}\n" : "")}
Log in to the management portal to review and assign this request.";

        await SendAsync(fromEmail, toEmail, subject, htmlBody, textBody, "maintenance submitted");
    }

    // ── Application notifications ─────────────────────────────────────

    public async Task SendApplicationReceivedAsync(Application application)
    {
        var (fromEmail, notifyEmail) = await ResolveEmailSettingsAsync();
        var toEmail = !string.IsNullOrWhiteSpace(notifyEmail) ? notifyEmail : fromEmail;

        var subject = $"New Application: {application.ApplicantFirstName} {application.ApplicantLastName}";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">New Rental Application</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    A new rental application has been submitted and is ready for review.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Applicant", $"{application.ApplicantFirstName} {application.ApplicantLastName}")}
    {Row("Email", application.ApplicantEmail)}
    {Row("Application #", application.Id.ToString())}
    {Row("Submitted", (application.SubmittedAt ?? DateTimeOffset.UtcNow).ToString("MMMM d, yyyy h:mm tt UTC"))}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Log in to the management portal to review and take action on this application.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"New Rental Application

Applicant: {application.ApplicantFirstName} {application.ApplicantLastName}
Email: {application.ApplicantEmail}
Application #: {application.Id}
Submitted: {(application.SubmittedAt ?? DateTimeOffset.UtcNow):MMMM d, yyyy h:mm tt UTC}

Log in to the management portal to review this application.";

        await SendAsync(fromEmail, toEmail, subject, htmlBody, textBody, "application received");
    }

    public async Task SendApplicationStatusUpdateAsync(Application application, string oldStatus, string newStatus)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();

        var subject = $"Application Update — {newStatus}";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">Application Status Update</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {application.ApplicantFirstName}, your rental application status has been updated.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Application #", application.Id.ToString())}
    {Row("Status", $"{oldStatus} → {newStatus}")}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Log in to your portal to view your application details.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"Application Status Update

Hi {application.ApplicantFirstName}, your rental application status has been updated.

Application #: {application.Id}
Status: {oldStatus} → {newStatus}

Log in to your portal to view your application details.";

        await SendAsync(fromEmail, application.ApplicantEmail, subject, htmlBody, textBody, "application status update");
    }

    public async Task SendApplicationApprovedAsync(Application application)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();

        var subject = "Your Application Has Been Approved!";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #16a34a; margin-bottom: 16px;"">Application Approved!</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {application.ApplicantFirstName}, great news! Your rental application has been approved.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Application #", application.Id.ToString())}
    {Row("Status", "Approved")}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Your property manager will be in touch shortly with next steps regarding your move-in.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"Application Approved!

Hi {application.ApplicantFirstName}, great news! Your rental application has been approved.

Application #: {application.Id}

Your property manager will be in touch shortly with next steps regarding your move-in.";

        await SendAsync(fromEmail, application.ApplicantEmail, subject, htmlBody, textBody, "application approved");
    }

    public async Task SendApplicationDeniedAsync(Application application, string reason)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();

        var subject = "Application Update";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">Application Update</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {application.ApplicantFirstName}, after careful review, we are unable to approve your rental application at this time.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Application #", application.Id.ToString())}
    {Row("Status", "Not Approved")}
    {Row("Reason", reason)}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    If you have questions about this decision, please contact the property manager directly.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"Application Update

Hi {application.ApplicantFirstName}, after careful review, we are unable to approve your rental application at this time.

Application #: {application.Id}
Reason: {reason}

If you have questions about this decision, please contact the property manager directly.";

        await SendAsync(fromEmail, application.ApplicantEmail, subject, htmlBody, textBody, "application denied");
    }

    public async Task SendLeaseExpiringAsync(Lease lease, Tenant tenant, int daysRemaining)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();

        var subject = $"Your Lease Expires in {daysRemaining} Days";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #d97706; margin-bottom: 16px;"">Lease Expiring Soon</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tenant.FirstName}, your lease is expiring soon. Please contact your property manager if you'd like to discuss renewal options.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Lease End Date", lease.EndDate.ToString("MMMM d, yyyy"))}
    {Row("Days Remaining", daysRemaining.ToString())}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    If you've already made arrangements, you can disregard this message.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">
    Sent by Rebraco Tenant Portal
  </p>
</div>";

        var textBody = $@"Lease Expiring Soon

Hi {tenant.FirstName}, your lease is expiring soon.

Lease End Date: {lease.EndDate:MMMM d, yyyy}
Days Remaining: {daysRemaining}

Please contact your property manager if you'd like to discuss renewal options.
If you've already made arrangements, you can disregard this message.";

        await SendAsync(fromEmail, tenant.Email, subject, htmlBody, textBody, "lease expiring");
    }

    // ── Lease renewal notifications ──────────────────────────────────────

    public async Task SendRenewalOfferAsync(LeaseRenewal renewal, Tenant tenant)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();

        var subject = "Lease Renewal Offer";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">Lease Renewal Offer</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tenant.FirstName}, your property manager has offered you a lease renewal. Please review the proposed terms below and respond through your tenant portal.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("New Start Date", renewal.ProposedStartDate.ToString("MMMM d, yyyy"))}
    {Row("New End Date", renewal.ProposedEndDate.ToString("MMMM d, yyyy"))}
    {Row("Monthly Rent", $"${renewal.ProposedMonthlyRent:N2}")}
    {Row("Lease Type", renewal.ProposedLeaseType.ToString())}
  </table>
  {(string.IsNullOrWhiteSpace(renewal.ManagerNotes) ? "" : $@"<p style=""font-size: 14px; color: #334155; line-height: 1.6;""><strong>Manager's Note:</strong> {renewal.ManagerNotes}</p>")}
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Log in to your tenant portal to accept or decline this offer.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco Tenant Portal</p>
</div>";

        var textBody = $@"Lease Renewal Offer

Hi {tenant.FirstName}, your property manager has offered you a lease renewal.

New Start Date: {renewal.ProposedStartDate:MMMM d, yyyy}
New End Date: {renewal.ProposedEndDate:MMMM d, yyyy}
Monthly Rent: ${renewal.ProposedMonthlyRent:N2}
Lease Type: {renewal.ProposedLeaseType}
{(string.IsNullOrWhiteSpace(renewal.ManagerNotes) ? "" : $"\nManager's Note: {renewal.ManagerNotes}\n")}
Log in to your tenant portal to accept or decline this offer.";

        await SendAsync(fromEmail, tenant.Email, subject, htmlBody, textBody, "renewal offer");
    }

    public async Task SendRenewalResponseAsync(LeaseRenewal renewal, bool accepted)
    {
        var (fromEmail, notifyEmail) = await ResolveEmailSettingsAsync();

        if (string.IsNullOrWhiteSpace(notifyEmail))
        {
            _logger.LogWarning("Rebraco: NotifyEmail not configured, skipping renewal response notification.");
            return;
        }

        var tenant = renewal.OriginalLease?.Tenant;
        var tenantName = tenant != null ? $"{tenant.FirstName} {tenant.LastName}" : "Tenant";
        var response = accepted ? "Accepted" : "Declined";

        var subject = $"Renewal {response} — {tenantName}";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: {(accepted ? "#059669" : "#dc2626")}; margin-bottom: 16px;"">Renewal {response}</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    {tenantName} has <strong>{response.ToLower()}</strong> the lease renewal offer.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Renewal #", renewal.Id.ToString())}
    {Row("Original Lease #", renewal.OriginalLeaseId.ToString())}
    {Row("Proposed Rent", $"${renewal.ProposedMonthlyRent:N2}/mo")}
    {Row("Proposed Dates", $"{renewal.ProposedStartDate:MMM d, yyyy} – {renewal.ProposedEndDate:MMM d, yyyy}")}
  </table>
  {(string.IsNullOrWhiteSpace(renewal.TenantNotes) ? "" : $@"<p style=""font-size: 14px; color: #334155; line-height: 1.6;""><strong>Tenant's Note:</strong> {renewal.TenantNotes}</p>")}
  {(accepted ? @"<p style=""font-size: 14px; color: #334155; line-height: 1.6;"">Log in to the management portal to confirm and finalize the renewal.</p>" : "")}
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"Renewal {response}

{tenantName} has {response.ToLower()} the lease renewal offer.

Renewal #: {renewal.Id}
Original Lease #: {renewal.OriginalLeaseId}
Proposed Rent: ${renewal.ProposedMonthlyRent:N2}/mo
Proposed Dates: {renewal.ProposedStartDate:MMM d, yyyy} – {renewal.ProposedEndDate:MMM d, yyyy}
{(string.IsNullOrWhiteSpace(renewal.TenantNotes) ? "" : $"\nTenant's Note: {renewal.TenantNotes}\n")}
{(accepted ? "Log in to the management portal to confirm and finalize the renewal." : "")}";

        await SendAsync(fromEmail, notifyEmail, subject, htmlBody, textBody, "renewal response");
    }

    public async Task SendRenewalConfirmedAsync(LeaseRenewal renewal, Tenant tenant)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();

        var subject = "Your Lease Renewal Has Been Confirmed";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #059669; margin-bottom: 16px;"">Renewal Confirmed</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tenant.FirstName}, your lease renewal has been confirmed! Here are your new lease details:
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Start Date", renewal.ProposedStartDate.ToString("MMMM d, yyyy"))}
    {Row("End Date", renewal.ProposedEndDate.ToString("MMMM d, yyyy"))}
    {Row("Monthly Rent", $"${renewal.ProposedMonthlyRent:N2}")}
    {Row("Lease Type", renewal.ProposedLeaseType.ToString())}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    You can view your updated lease details in your tenant portal.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco Tenant Portal</p>
</div>";

        var textBody = $@"Renewal Confirmed

Hi {tenant.FirstName}, your lease renewal has been confirmed!

Start Date: {renewal.ProposedStartDate:MMMM d, yyyy}
End Date: {renewal.ProposedEndDate:MMMM d, yyyy}
Monthly Rent: ${renewal.ProposedMonthlyRent:N2}
Lease Type: {renewal.ProposedLeaseType}

You can view your updated lease details in your tenant portal.";

        await SendAsync(fromEmail, tenant.Email, subject, htmlBody, textBody, "renewal confirmed");
    }

    public async Task SendRenewalExpiringLeaseManagerAsync(Lease lease, int daysRemaining)
    {
        var (fromEmail, notifyEmail) = await ResolveEmailSettingsAsync();

        if (string.IsNullOrWhiteSpace(notifyEmail))
        {
            _logger.LogWarning("Rebraco: NotifyEmail not configured, skipping expiring lease renewal alert.");
            return;
        }

        var tenantName = lease.Tenant != null
            ? $"{lease.Tenant.FirstName} {lease.Tenant.LastName}"
            : "Unknown";
        var unitInfo = lease.Unit != null
            ? $"Unit {lease.Unit.UnitNumber}"
            : $"Unit (Lease #{lease.Id})";

        var subject = $"Lease Expiring — {tenantName} ({daysRemaining} days)";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #d97706; margin-bottom: 16px;"">Lease Expiring — No Renewal Offer</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    The following lease is expiring soon and no renewal offer has been created yet.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Lease #", lease.Id.ToString())}
    {Row("Tenant", tenantName)}
    {Row("Unit", unitInfo)}
    {Row("End Date", lease.EndDate.ToString("MMMM d, yyyy"))}
    {Row("Days Remaining", daysRemaining.ToString())}
    {Row("Current Rent", $"${lease.MonthlyRent:N2}/mo")}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Log in to the management portal to create a renewal offer for this tenant.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"Lease Expiring — No Renewal Offer

The following lease is expiring soon and no renewal offer has been created yet.

Lease #: {lease.Id}
Tenant: {tenantName}
Unit: {unitInfo}
End Date: {lease.EndDate:MMMM d, yyyy}
Days Remaining: {daysRemaining}
Current Rent: ${lease.MonthlyRent:N2}/mo

Log in to the management portal to create a renewal offer for this tenant.";

        await SendAsync(fromEmail, notifyEmail, subject, htmlBody, textBody, "renewal expiring lease alert");
    }

    // ── Shared send helper ───────────────────────────────────────────────

    private async Task SendAsync(string fromEmail, string toEmail, string subject,
        string htmlBody, string textBody, string emailType)
    {
        var message = new PostmarkMessage
        {
            From = fromEmail,
            To = toEmail,
            Subject = subject,
            HtmlBody = htmlBody,
            TextBody = textBody,
            MessageStream = "outbound"
        };

        var response = await _client.SendMessageAsync(message);

        if (response.Status == PostmarkStatus.Success)
        {
            _logger.LogInformation("Rebraco: {EmailType} email sent to {Email} (MessageID: {Id})",
                emailType, toEmail, response.MessageID);
        }
        else
        {
            _logger.LogError("Rebraco: Postmark send failed for {EmailType} — {Status}: {Message}",
                emailType, response.Status, response.Message);
        }
    }

    // ── Existing methods ─────────────────────────────────────────────────

    // ── Tour notifications ────────────────────────────────────────────

    public async Task SendTourConfirmationAsync(Tour tour)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();
        var propertyName = tour.Property?.Name ?? $"Property #{tour.PropertyId}";
        var unitInfo = tour.Unit != null ? $" (Unit {tour.Unit.UnitNumber})" : "";
        var dateStr = tour.ScheduledDate.ToString("dddd, MMMM d, yyyy");
        var timeStr = $"{tour.StartTime:h:mm tt} – {tour.EndTime:h:mm tt}";

        var subject = $"Tour Confirmed — {propertyName}";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #059669; margin-bottom: 16px;"">Your Tour is Confirmed</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tour.FullName}, your property tour has been confirmed. Here are the details:
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Property", $"{propertyName}{unitInfo}")}
    {Row("Date", dateStr)}
    {Row("Time", timeStr)}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    If you need to cancel or reschedule, please contact us or use your tenant portal.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"Your Tour is Confirmed

Hi {tour.FullName}, your property tour has been confirmed.

Property: {propertyName}{unitInfo}
Date: {dateStr}
Time: {timeStr}

If you need to cancel or reschedule, please contact us or use your tenant portal.";

        await SendAsync(fromEmail, tour.Email, subject, htmlBody, textBody, "tour confirmation");
    }

    public async Task SendTourRescheduledAsync(Tour tour)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();
        var propertyName = tour.Property?.Name ?? $"Property #{tour.PropertyId}";
        var unitInfo = tour.Unit != null ? $" (Unit {tour.Unit.UnitNumber})" : "";
        var dateStr = tour.ScheduledDate.ToString("dddd, MMMM d, yyyy");
        var timeStr = $"{tour.StartTime:h:mm tt} – {tour.EndTime:h:mm tt}";

        var subject = $"Tour Rescheduled — {propertyName}";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #2563eb; margin-bottom: 16px;"">Your Tour Has Been Rescheduled</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tour.FullName}, your property tour has been rescheduled to a new date/time:
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Property", $"{propertyName}{unitInfo}")}
    {Row("New Date", dateStr)}
    {Row("New Time", timeStr)}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    If this time doesn't work for you, please contact us to arrange an alternative.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"Your Tour Has Been Rescheduled

Hi {tour.FullName}, your property tour has been rescheduled.

Property: {propertyName}{unitInfo}
New Date: {dateStr}
New Time: {timeStr}

If this time doesn't work for you, please contact us to arrange an alternative.";

        await SendAsync(fromEmail, tour.Email, subject, htmlBody, textBody, "tour rescheduled");
    }

    public async Task SendTourCancelledAsync(Tour tour, string? reason)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();
        var propertyName = tour.Property?.Name ?? $"Property #{tour.PropertyId}";
        var dateStr = tour.ScheduledDate.ToString("dddd, MMMM d, yyyy");
        var timeStr = $"{tour.StartTime:h:mm tt} – {tour.EndTime:h:mm tt}";

        var subject = $"Tour Cancelled — {propertyName}";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #dc2626; margin-bottom: 16px;"">Tour Cancelled</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tour.FullName}, your tour at {propertyName} scheduled for {dateStr} at {timeStr} has been cancelled.
  </p>
  {(string.IsNullOrWhiteSpace(reason) ? "" : $@"<p style=""font-size: 14px; color: #334155; line-height: 1.6;""><strong>Reason:</strong> {reason}</p>")}
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    If you'd like to schedule a new tour, please visit our website or contact us.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"Tour Cancelled

Hi {tour.FullName}, your tour at {propertyName} scheduled for {dateStr} at {timeStr} has been cancelled.
{(string.IsNullOrWhiteSpace(reason) ? "" : $"\nReason: {reason}\n")}
If you'd like to schedule a new tour, please visit our website or contact us.";

        await SendAsync(fromEmail, tour.Email, subject, htmlBody, textBody, "tour cancelled");
    }

    public async Task SendTourReminderAsync(Tour tour)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();
        var propertyName = tour.Property?.Name ?? $"Property #{tour.PropertyId}";
        var unitInfo = tour.Unit != null ? $" (Unit {tour.Unit.UnitNumber})" : "";
        var dateStr = tour.ScheduledDate.ToString("dddd, MMMM d, yyyy");
        var timeStr = $"{tour.StartTime:h:mm tt} – {tour.EndTime:h:mm tt}";

        var subject = $"Tour Reminder — Tomorrow at {propertyName}";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">Tour Reminder</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Hi {tour.FullName}, this is a friendly reminder that you have a property tour scheduled for tomorrow.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Property", $"{propertyName}{unitInfo}")}
    {Row("Date", dateStr)}
    {Row("Time", timeStr)}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    We look forward to seeing you! If you need to cancel, please let us know as soon as possible.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">Sent by Rebraco</p>
</div>";

        var textBody = $@"Tour Reminder

Hi {tour.FullName}, this is a friendly reminder that you have a property tour scheduled for tomorrow.

Property: {propertyName}{unitInfo}
Date: {dateStr}
Time: {timeStr}

We look forward to seeing you! If you need to cancel, please let us know as soon as possible.";

        await SendAsync(fromEmail, tour.Email, subject, htmlBody, textBody, "tour reminder");
    }

    public async Task SendTenantWelcomeAsync(Tenant tenant, string temporaryPassword)
    {
        var (fromEmail, _) = await ResolveEmailSettingsAsync();

        var subject = "Welcome to Your Tenant Portal";
        var htmlBody = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;"">
  <h2 style=""color: #1e293b; margin-bottom: 16px;"">Welcome, {tenant.FirstName}!</h2>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Your tenant portal account has been created. You can now log in to view your lease details,
    submit maintenance requests, and manage your profile.
  </p>
  <table style=""width: 100%; border-collapse: collapse; margin: 20px 0;"">
    {Row("Email / Username", tenant.Email)}
    {Row("Temporary Password", $"<code style=\"background: #f1f5f9; padding: 2px 8px; border-radius: 4px;\">{temporaryPassword}</code>")}
  </table>
  <p style=""font-size: 14px; color: #334155; line-height: 1.6;"">
    Please change your password after your first login.
  </p>
  <p style=""margin-top: 20px; font-size: 13px; color: #94a3b8;"">
    Sent by Rebraco Tenant Portal
  </p>
</div>";

        var textBody = $@"Welcome, {tenant.FirstName}!

Your tenant portal account has been created.

Email / Username: {tenant.Email}
Temporary Password: {temporaryPassword}

Please change your password after your first login.";

        var message = new PostmarkMessage
        {
            From = fromEmail,
            To = tenant.Email,
            Subject = subject,
            HtmlBody = htmlBody,
            TextBody = textBody,
            MessageStream = "outbound"
        };

        var response = await _client.SendMessageAsync(message);

        if (response.Status == PostmarkStatus.Success)
        {
            _logger.LogInformation("Rebraco: Tenant welcome email sent to {Email} (MessageID: {Id})",
                tenant.Email, response.MessageID);
        }
        else
        {
            _logger.LogError("Rebraco: Postmark send failed for tenant welcome — {Status}: {Message}",
                response.Status, response.Message);
        }
    }
}
