using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/profile")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class ProfileController : ControllerBase
{
    private readonly IMemberManager _memberManager;
    private readonly IMemberService _memberService;

    public ProfileController(IMemberManager memberManager, IMemberService memberService)
    {
        _memberManager = memberManager;
        _memberService = memberService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var identity = await _memberManager.GetCurrentMemberAsync();
        if (identity == null)
            return Unauthorized();

        var member = _memberService.GetByEmail(identity.Email!);
        if (member == null)
            return NotFound();

        return Ok(new
        {
            name = member.Name,
            email = member.GetValue<string>("umbracoMemberEmail") ?? identity.Email,
            company = member.GetValue<string>("company"),
            phone = member.GetValue<string>("phone"),
            jobTitle = member.GetValue<string>("jobTitle"),
        });
    }

    [HttpPatch]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var identity = await _memberManager.GetCurrentMemberAsync();
        if (identity == null)
            return Unauthorized();

        var member = _memberService.GetByEmail(identity.Email!);
        if (member == null)
            return NotFound();

        if (request.Name != null)
            member.Name = request.Name;
        if (request.Company != null)
            member.SetValue("company", request.Company);
        if (request.Phone != null)
            member.SetValue("phone", request.Phone);
        if (request.JobTitle != null)
            member.SetValue("jobTitle", request.JobTitle);

        _memberService.Save(member);

        return Ok(new
        {
            success = true,
            name = member.Name,
            company = member.GetValue<string>("company"),
            phone = member.GetValue<string>("phone"),
            jobTitle = member.GetValue<string>("jobTitle"),
        });
    }
}

public class UpdateProfileRequest
{
    [MaxLength(150)]
    public string? Name { get; set; }

    [MaxLength(200)]
    public string? Company { get; set; }

    [MaxLength(30)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    public string? JobTitle { get; set; }
}
