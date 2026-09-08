using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/properties/{propertyId:int}/images")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class PropertyImagesController : ControllerBase
{
    private readonly RebracoDbContext _db;
    private readonly MediaUploadService _media;
    private readonly ILogger<PropertyImagesController> _logger;

    public PropertyImagesController(
        RebracoDbContext db,
        MediaUploadService media,
        ILogger<PropertyImagesController> logger)
    {
        _db = db;
        _media = media;
        _logger = logger;
    }

    /// <summary>List all images for a property, ordered by SortOrder.</summary>
    [HttpGet]
    public async Task<IActionResult> List(int propertyId)
    {
        var exists = await _db.Properties.AnyAsync(p => p.Id == propertyId);
        if (!exists) return NotFound(new { error = "Property not found." });

        var images = await _db.PropertyImages
            .Where(i => i.PropertyId == propertyId)
            .OrderBy(i => i.SortOrder)
            .Select(i => new { i.Id, i.Url, i.Alt, i.SortOrder })
            .ToListAsync();

        return Ok(new { images });
    }

    /// <summary>Upload an image and attach it to a property.</summary>
    [HttpPost]
    public async Task<IActionResult> Upload(
        int propertyId,
        [FromForm] IFormFile file,
        [FromForm] string? alt,
        [FromForm] bool setAsFeatured = false)
    {
        var property = await _db.Properties.FindAsync(propertyId);
        if (property == null) return NotFound(new { error = "Property not found." });

        var (url, error) = _media.Upload(file, "Properties");
        if (url == null) return BadRequest(new { error });

        // Determine next sort order
        var maxSort = await _db.PropertyImages
            .Where(i => i.PropertyId == propertyId)
            .MaxAsync(i => (int?)i.SortOrder) ?? -1;

        var image = new PropertyImage
        {
            PropertyId = propertyId,
            Url = url,
            Alt = alt,
            SortOrder = maxSort + 1,
        };

        _db.PropertyImages.Add(image);

        if (setAsFeatured)
        {
            property.FeaturedImageUrl = url;
            property.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Image #{ImageId} uploaded for Property #{PropertyId}",
            image.Id, propertyId);

        return Ok(new
        {
            success = true,
            image = new { image.Id, image.Url, image.Alt, image.SortOrder },
        });
    }

    /// <summary>Update alt text or sort order for an image.</summary>
    [HttpPatch("{imageId:int}")]
    public async Task<IActionResult> Update(int propertyId, int imageId, [FromBody] UpdateImageRequest request)
    {
        var image = await _db.PropertyImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.PropertyId == propertyId);
        if (image == null) return NotFound(new { error = "Image not found." });

        if (request.Alt != null) image.Alt = request.Alt;
        if (request.SortOrder.HasValue) image.SortOrder = request.SortOrder.Value;

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    /// <summary>Delete an image and its media file.</summary>
    [HttpDelete("{imageId:int}")]
    public async Task<IActionResult> Delete(int propertyId, int imageId)
    {
        var image = await _db.PropertyImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.PropertyId == propertyId);
        if (image == null) return NotFound(new { error = "Image not found." });

        // If this was the featured image, clear it
        var property = await _db.Properties.FindAsync(propertyId);
        if (property != null && property.FeaturedImageUrl == image.Url)
        {
            property.FeaturedImageUrl = null;
            property.UpdatedAt = DateTimeOffset.UtcNow;
        }

        _db.PropertyImages.Remove(image);
        await _db.SaveChangesAsync();

        // Best-effort delete from Umbraco media library
        _media.Delete(image.Url);

        _logger.LogInformation("Rebraco: Image #{ImageId} deleted from Property #{PropertyId}",
            imageId, propertyId);

        return Ok(new { success = true });
    }

    /// <summary>Bulk reorder images by providing an ordered array of image IDs.</summary>
    [HttpPatch("reorder")]
    public async Task<IActionResult> Reorder(int propertyId, [FromBody] ReorderImagesRequest request)
    {
        if (request.ImageIds == null || request.ImageIds.Length == 0)
            return BadRequest(new { error = "imageIds array is required." });

        var images = await _db.PropertyImages
            .Where(i => i.PropertyId == propertyId)
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

// --- Shared Request DTOs for image endpoints ---

public class UpdateImageRequest
{
    [MaxLength(200)]
    public string? Alt { get; set; }

    public int? SortOrder { get; set; }

    public bool? IsFloorPlan { get; set; }
}

public class ReorderImagesRequest
{
    public int[] ImageIds { get; set; } = Array.Empty<int>();
}
