using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/dashboard")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _service;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(DashboardService service, ILogger<DashboardController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetSummary()
    {
        try
        {
            var summary = await _service.GetSummaryAsync();
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load dashboard summary");
            return StatusCode(500, new { error = "Failed to load dashboard data." });
        }
    }
}
