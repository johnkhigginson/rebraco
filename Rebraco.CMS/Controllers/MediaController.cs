using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

/// <summary>
/// General-purpose media browse and upload controller.
/// Lists images from the Umbraco media library under "Rebraco Uploads" and uploads new files.
/// </summary>
[ApiController]
[Route("api/media")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class MediaController : ControllerBase
{
    private readonly MediaUploadService _upload;
    private readonly IMediaService _mediaService;
    private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
    private readonly ILogger<MediaController> _logger;

    private const string RootFolderName = "Rebraco Uploads";

    public MediaController(
        MediaUploadService upload,
        IMediaService mediaService,
        MediaUrlGeneratorCollection mediaUrlGenerators,
        ILogger<MediaController> logger)
    {
        _upload = upload;
        _mediaService = mediaService;
        _mediaUrlGenerators = mediaUrlGenerators;
        _logger = logger;
    }

    /// <summary>List all images under Rebraco Uploads (or a subfolder).</summary>
    [HttpGet]
    public IActionResult List([FromQuery] string? folder)
    {
        var rootFolder = FindFolder(RootFolderName, Constants.System.Root);
        if (rootFolder == null)
            return Ok(Array.Empty<object>());

        int parentId = rootFolder.Id;

        // If a subfolder is specified, find it under the root
        if (!string.IsNullOrWhiteSpace(folder))
        {
            var sub = FindFolder(folder, rootFolder.Id);
            if (sub == null)
                return Ok(Array.Empty<object>());
            parentId = sub.Id;
        }

        var items = _mediaService.GetPagedDescendants(parentId, 0, 500, out _);

        var images = items
            .Where(m => m.ContentType.Alias == Constants.Conventions.MediaTypes.Image)
            .Select(m =>
            {
                m.TryGetMediaPath(Constants.Conventions.Media.File, _mediaUrlGenerators, out var url);
                return new { url, name = m.Name, createDate = m.CreateDate };
            })
            .Where(x => x.url != null)
            .OrderByDescending(x => x.createDate)
            .ToList();

        return Ok(images);
    }

    /// <summary>Upload a file to Umbraco media under Rebraco Uploads/{folder}.</summary>
    [HttpPost("upload")]
    public IActionResult Upload([FromForm] IFormFile file, [FromQuery] string? folder)
    {
        var targetFolder = string.IsNullOrWhiteSpace(folder) ? "General" : folder;
        var (url, error) = _upload.Upload(file, targetFolder);

        if (error != null)
            return BadRequest(new { error });

        return Ok(new { url });
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private IMedia? FindFolder(string name, int parentId)
    {
        var children = _mediaService.GetPagedChildren(parentId, 0, 100, out _);
        return children.FirstOrDefault(c =>
            c.ContentType.Alias == Constants.Conventions.MediaTypes.Folder
            && string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase));
    }
}
