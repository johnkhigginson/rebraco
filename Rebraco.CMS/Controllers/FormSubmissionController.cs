using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/forms")]
public class FormSubmissionController : ControllerBase
{
    private readonly ILogger<FormSubmissionController> _logger;

    public FormSubmissionController(ILogger<FormSubmissionController> logger)
    {
        _logger = logger;
    }

    [HttpPost("submit")]
    [EnableRateLimiting("PublicForm")]
    public IActionResult Submit([FromBody] FormSubmissionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (request.Fields == null || request.Fields.Count == 0)
        {
            return BadRequest(new { error = "No form fields provided." });
        }

        if (request.Fields.Count > 50)
        {
            return BadRequest(new { error = "Too many form fields." });
        }

        // Log submission summary (truncate values to avoid log injection / bloat)
        _logger.LogInformation(
            "Form submission received: Type={FormType}, Fields={FieldCount}, Recipient={Recipient}",
            Truncate(request.FormType, 50),
            request.Fields.Count,
            Truncate(request.RecipientEmail, 100)
        );

        foreach (var field in request.Fields)
        {
            _logger.LogDebug("  {Key}: {Value}", Truncate(field.Key, 50), Truncate(field.Value, 200));
        }

        // TODO: Add email sending via SMTP
        // To enable email, add an IEmailSender service or use SmtpClient
        // configured via appsettings.json:
        //
        // "Smtp": {
        //   "Host": "smtp.example.com",
        //   "Port": 587,
        //   "Username": "...",
        //   "Password": "...",
        //   "FromAddress": "noreply@example.com"
        // }

        return Ok(new { success = true, message = "Form submitted successfully." });
    }

    private static string? Truncate(string? value, int maxLength) =>
        value?.Length > maxLength ? value[..maxLength] + "..." : value;
}

public class FormSubmissionRequest
{
    [Required]
    [StringLength(100)]
    public string FormType { get; set; } = "custom";

    [EmailAddress]
    [StringLength(254)]
    public string? RecipientEmail { get; set; }

    public Dictionary<string, string> Fields { get; set; } = new();
}
