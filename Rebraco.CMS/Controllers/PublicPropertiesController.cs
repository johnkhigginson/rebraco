using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Services;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/public/properties")]
[EnableRateLimiting("PublicApi")]
public class PublicPropertiesController : ControllerBase
{
    private readonly PublicPropertyService _service;
    private readonly RebracoDbContext _db;

    public PublicPropertiesController(PublicPropertyService service, RebracoDbContext db)
    {
        _service = service;
        _db = db;
    }

    /// <summary>List published properties with optional filters.</summary>
    [HttpGet]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> List(
        [FromQuery] string? type,
        [FromQuery] string? gender,
        [FromQuery] string? search,
        [FromQuery] string? sort,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 24)
    {
        if (take > 100) take = 100;

        var (items, total) = await _service.GetPublishedPropertiesAsync(new PublicPropertyFilterDto
        {
            Type = type,
            Gender = gender,
            Search = search,
            Sort = sort,
            Skip = skip,
            Take = take,
        });

        return Ok(new { items, total, skip, take });
    }

    /// <summary>Get a single published property by slug, including its units.</summary>
    [HttpGet("{slug:regex(^(?!settings$|units$).+$)}")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var property = await _service.GetBySlugAsync(slug);
        if (property == null)
            return NotFound(new { error = "Property not found." });

        return Ok(property);
    }

    /// <summary>Get a single published unit by ID.</summary>
    [HttpGet("units/{id:int}")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetUnit(int id)
    {
        var unit = await _service.GetUnitByIdAsync(id);
        if (unit == null)
            return NotFound(new { error = "Unit not found." });

        return Ok(unit);
    }

    /// <summary>Get public pages display settings (label and URL slug). Unauthenticated.</summary>
    [HttpGet("settings")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetPublicPagesSettings()
    {
        var keys = new[] { "public:pagesLabel", "public:pagesSlug" };
        var settings = await _db.AppSettings
            .Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        return Ok(new
        {
            publicPagesLabel = settings.GetValueOrDefault("public:pagesLabel", "Properties"),
            publicPagesSlug = settings.GetValueOrDefault("public:pagesSlug", "properties"),
        });
    }
}
