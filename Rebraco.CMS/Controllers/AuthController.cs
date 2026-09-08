using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.Filters;
using Umbraco.Cms.Web.Common.Security;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMemberSignInManager _signInManager;
    private readonly IMemberManager _memberManager;
    private readonly Umbraco.Cms.Core.Services.IMemberService _memberService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IMemberSignInManager signInManager,
        IMemberManager memberManager,
        Umbraco.Cms.Core.Services.IMemberService memberService,
        IEmailService emailService,
        ILogger<AuthController> logger)
    {
        _signInManager = signInManager;
        _memberManager = memberManager;
        _memberService = memberService;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("login")]
    [EnableRateLimiting("Login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _signInManager.PasswordSignInAsync(
            request.Username, request.Password, isPersistent: true, lockoutOnFailure: false);

        if (!result.Succeeded)
            return Unauthorized(new { error = "Invalid username or password." });

        var member = await _memberManager.FindByNameAsync(request.Username);
        if (member == null)
            return Unauthorized(new { error = "Member not found." });

        var roles = await GetMemberRolesAsync(member);

        return Ok(new
        {
            success = true,
            user = BuildUserResponse(member, roles)
        });
    }

    [HttpPost("register")]
    [EnableRateLimiting("PublicForm")]
    public async Task<IActionResult> Register([FromBody] RegisterProspectRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Check if email already in use
        var existing = _memberService.GetByEmail(request.Email);
        if (existing != null)
            return Conflict(new { error = "An account with this email already exists." });

        try
        {
            // Create prospect member via IMemberService (content/property API)
            var member = _memberService.CreateMemberWithIdentity(
                request.Email,
                request.Email,
                $"{request.FirstName} {request.LastName}",
                "prospect"
            );

            member.SetValue("phone", request.Phone ?? "");
            _memberService.Save(member);

            // Set password via Identity
            var identityMember = await _memberManager.FindByEmailAsync(request.Email);
            if (identityMember == null)
                return StatusCode(500, new { error = "Failed to create account." });

            var token = await _memberManager.GeneratePasswordResetTokenAsync(identityMember);
            var pwResult = await _memberManager.ResetPasswordAsync(identityMember, token, request.Password);
            if (!pwResult.Succeeded)
            {
                var errors = string.Join(" ", pwResult.Errors.Select(e => e.Description));
                return BadRequest(new { error = errors });
            }

            // Assign to Prospect group
            _memberService.AssignRole(member.Id, "Prospect");

            // Auto-login
            await _signInManager.PasswordSignInAsync(
                request.Email, request.Password, isPersistent: true, lockoutOnFailure: false);

            var roles = new[] { "Prospect" };

            return Ok(new
            {
                success = true,
                user = new
                {
                    id = identityMember.Id,
                    name = identityMember.Name,
                    email = identityMember.Email,
                    username = identityMember.UserName,
                    roles
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rebraco: Member registration failed for {Email}", request.Email);
            return StatusCode(500, new { error = "An unexpected error occurred during registration." });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { success = true });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null)
            return Unauthorized(new { authenticated = false });

        var roles = await GetMemberRolesAsync(member);

        return Ok(new
        {
            authenticated = true,
            user = BuildUserResponse(member, roles)
        });
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("Login")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Always return 200 to avoid leaking whether email exists
        var member = await _memberManager.FindByEmailAsync(request.Email);
        if (member != null)
        {
            var token = await _memberManager.GeneratePasswordResetTokenAsync(member);
            var encodedToken = Uri.EscapeDataString(token);
            var encodedEmail = Uri.EscapeDataString(request.Email);

            var origin = $"{Request.Scheme}://{Request.Host}";
            var returnPath = string.IsNullOrWhiteSpace(request.ReturnPath)
                ? "/portal"
                : request.ReturnPath.TrimEnd('/');
            var resetUrl = $"{origin}{returnPath}/reset-password?token={encodedToken}&email={encodedEmail}";

            var firstName = member.Name?.Split(' ').FirstOrDefault() ?? "User";

            await _emailService.SendPasswordResetAsync(request.Email, firstName, resetUrl);
        }

        return Ok(new { success = true, message = "If an account exists with that email, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("Login")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var member = await _memberManager.FindByEmailAsync(request.Email);
        if (member == null)
            return BadRequest(new { error = "Invalid or expired reset link." });

        var result = await _memberManager.ResetPasswordAsync(member, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            return BadRequest(new { error = errors });
        }

        return Ok(new { success = true });
    }

    [HttpPost("change-password")]
    [UmbracoMemberAuthorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null)
            return Unauthorized(new { error = "Not authenticated." });

        var result = await _memberManager.ChangePasswordAsync(member, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            return BadRequest(new { error = errors });
        }

        return Ok(new { success = true });
    }

    private async Task<string[]> GetMemberRolesAsync(MemberIdentityUser member)
    {
        var roles = await _memberManager.GetRolesAsync(member);
        return roles.ToArray();
    }

    private static object BuildUserResponse(MemberIdentityUser member, string[] roles)
    {
        return new
        {
            id = member.Id,
            name = member.Name,
            email = member.Email,
            username = member.UserName,
            roles
        };
    }
}

public class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Path prefix for the reset URL (e.g. "/portal" or "/manage").</summary>
    public string? ReturnPath { get; set; }
}

public class ResetPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Token { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class RegisterProspectRequest
{
    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required, MaxLength(254), EmailAddress]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
