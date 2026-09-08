using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/units/{unitId:int}/images")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class UnitImagesController : ControllerBase
{
    private readonly RebracoDbContext _db;
    private readonly MediaUploadService _media;
    private readonly ILogger<UnitImagesController> _logger;

    public UnitImagesController(
        RebracoDbContext db,
        MediaUploadService media,
        ILogger<UnitImagesController> logger)
    {
        _db = db;
        _media = media;
        _logger = logger;
    }

    /// <summary>List all images for a unit, ordered by SortOrder.</summary>
    [HttpGet]
    public async Task<IActionResult> List(int unitId)
    {
        var exists = await _db.Units.AnyAsync(u => u.Id == unitId);
        if (!exists) return NotFound(new { error = "Unit not found." });

        var images = await _db.UnitImages
            .Where(i => i.UnitId == unitId)
            .OrderBy(i => i.SortOrder)
            .Select(i => new { i.Id, i.Url, i.Alt, i.SortOrder, i.IsFloorPlan })
            .ToListAsync();

        return Ok(new { images });
    }

    /// <summary>Upload an image and attach it to a unit.</summary>
    [HttpPost]
    public async Task<IActionResult> Upload(
        int unitId,
        [FromForm] IFormFile file,
        [FromForm] string? alt,
        [FromForm] bool isFloorPlan = false,
        [FromForm] bool setAsFeatured = false)
    {
        var unit = await _db.Units.FindAsync(unitId);
        if (unit == null) return NotFound(new { error = "Unit not found." });

        var (url, error) = _media.Upload(file, "Units");
        if (url == null) return BadRequest(new { error });

        var maxSort = await _db.UnitImages
            .Where(i => i.UnitId == unitId)
            .MaxAsync(i => (int?)i.SortOrder) ?? -1;

        var image = new UnitImage
        {
            UnitId = unitId,
            Url = url,
            Alt = alt,
            SortOrder = maxSort + 1,
            IsFloorPlan = isFloorPlan,
        };

        _db.UnitImages.Add(image);

        if (setAsFeatured)
        {
            unit.FeaturedImageUrl = url;
            unit.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Image #{ImageId} uploaded for Unit #{UnitId} (floorPlan={IsFloorPlan})",
            image.Id, unitId, isFloorPlan);

        return Ok(new
        {
            success = true,
            image = new { image.Id, image.Url, image.Alt, image.SortOrder, image.IsFloorPlan },
        });
    }

    /// <summary>Update alt text, sort order, or floor plan flag.</summary>
    [HttpPatch("{imageId:int}")]
    public async Task<IActionResult> Update(int unitId, int imageId, [FromBody] UpdateImageRequest request)
    {
        var image = await _db.UnitImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.UnitId == unitId);
        if (image == null) return NotFound(new { error = "Image not found." });

        if (request.Alt != null) image.Alt = request.Alt;
        if (request.SortOrder.HasValue) image.SortOrder = request.SortOrder.Value;
        if (request.IsFloorPlan.HasValue) image.IsFloorPlan = request.IsFloorPlan.Value;

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    /// <summary>Delete an image and its media file.</summary>
    [HttpDelete("{imageId:int}")]
    public async Task<IActionResult> Delete(int unitId, int imageId)
    {
        var image = await _db.UnitImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.UnitId == unitId);
        if (image == null) return NotFound(new { error = "Image not found." });

        var unit = await _db.Units.FindAsync(unitId);
        if (unit != null && unit.FeaturedImageUrl == image.Url)
        {
            unit.FeaturedImageUrl = null;
            unit.UpdatedAt = DateTimeOffset.UtcNow;
        }

        _db.UnitImages.Remove(image);
        await _db.SaveChangesAsync();

        _media.Delete(image.Url);

        _logger.LogInformation("Rebraco: Image #{ImageId} deleted from Unit #{UnitId}",
            imageId, unitId);

        return Ok(new { success = true });
    }

    /// <summary>Bulk reorder images by providing an ordered array of image IDs.</summary>
    [HttpPatch("reorder")]
    public async Task<IActionResult> Reorder(int unitId, [FromBody] ReorderImagesRequest request)
    {
        if (request.ImageIds == null || request.ImageIds.Length == 0)
            return BadRequest(new { error = "imageIds array is required." });

        var images = await _db.UnitImages
            .Where(i => i.UnitId == unitId)
            .ToListAsync();

        var lookup = images.ToDictionary(i => i.Id);

        for (int i = 0; i < request.ImageIds.Length; i++)
        {
            if (lookup.TryGetValue(request.ImageIds[i], out var img))
                img.SortOrder = i;
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
