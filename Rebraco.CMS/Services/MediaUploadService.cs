using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Extensions;

namespace Rebraco.CMS.Services;

/// <summary>
/// Wraps Umbraco's IMediaService to upload/delete images in the media library.
/// Stores files under "Rebraco Uploads/{subfolder}" in the Umbraco backoffice media tree.
/// </summary>
public class MediaUploadService
{
    private readonly IMediaService _mediaService;
    private readonly MediaFileManager _mediaFileManager;
    private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
    private readonly IShortStringHelper _shortStringHelper;
    private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
    private readonly ILogger<MediaUploadService> _logger;

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB
    private const string RootFolderName = "Rebraco Uploads";

    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"
    };

    private static readonly HashSet<string> AllowedDocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"
    };

    public MediaUploadService(
        IMediaService mediaService,
        MediaFileManager mediaFileManager,
        MediaUrlGeneratorCollection mediaUrlGenerators,
        IShortStringHelper shortStringHelper,
        IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
        ILogger<MediaUploadService> logger)
    {
        _mediaService = mediaService;
        _mediaFileManager = mediaFileManager;
        _mediaUrlGenerators = mediaUrlGenerators;
        _shortStringHelper = shortStringHelper;
        _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
        _logger = logger;
    }

    /// <summary>
    /// Uploads a file to the Umbraco media library under "Rebraco Uploads/{subfolder}".
    /// Returns the relative media URL (e.g. /media/abc123/photo.jpg) or an error string.
    /// </summary>
    public (string? Url, string? Error) Upload(IFormFile file, string subfolder)
    {
        // ── Validate ────────────────────────────────────────────────
        if (file == null || file.Length == 0)
            return (null, "No file provided.");

        if (file.Length > MaxFileSizeBytes)
            return (null, $"File exceeds the {MaxFileSizeBytes / (1024 * 1024)} MB limit.");

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedImageExtensions.Contains(ext))
            return (null, $"File type '{ext}' is not allowed. Accepted: {string.Join(", ", AllowedImageExtensions)}");

        try
        {
            // ── Ensure folder structure ─────────────────────────────
            var rootFolder = GetOrCreateFolder(RootFolderName, Constants.System.Root);
            var parentFolder = GetOrCreateFolder(subfolder, rootFolder.Id);

            // ── Create media node ───────────────────────────────────
            var fileName = Path.GetFileName(file.FileName);
            var media = _mediaService.CreateMedia(fileName, parentFolder.Id,
                Constants.Conventions.MediaTypes.Image);

            using var stream = file.OpenReadStream();
            media.SetValue(
                _mediaFileManager,
                _mediaUrlGenerators,
                _shortStringHelper,
                _contentTypeBaseServiceProvider,
                Constants.Conventions.Media.File,
                fileName,
                stream);

            var result = _mediaService.Save(media);
            if (!result.Success)
            {
                _logger.LogWarning("Rebraco: Umbraco media save failed for '{FileName}'", fileName);
                return (null, "Failed to save media file.");
            }

            // ── Resolve URL ─────────────────────────────────────────
            if (media.TryGetMediaPath(Constants.Conventions.Media.File, _mediaUrlGenerators, out var mediaPath))
            {
                _logger.LogInformation("Rebraco: Uploaded media '{FileName}' → {Path} (Node {Id})",
                    fileName, mediaPath, media.Id);
                return (mediaPath, null);
            }

            // Fallback: construct URL from known Umbraco pattern
            var fallbackUrl = $"/media/{media.Key.ToString("N")[..8]}/{fileName}";
            _logger.LogWarning("Rebraco: TryGetMediaPath failed for node {Id}, using fallback: {Url}",
                media.Id, fallbackUrl);
            return (fallbackUrl, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rebraco: Media upload failed for '{FileName}'", file.FileName);
            return (null, "An unexpected error occurred during upload.");
        }
    }

    /// <summary>
    /// Uploads a document file (PDF, DOCX, DOC, JPG, PNG) to the Umbraco media library.
    /// Returns the relative media URL or an error string.
    /// </summary>
    public (string? Url, string? Error) UploadDocument(IFormFile file, string subfolder)
    {
        if (file == null || file.Length == 0)
            return (null, "No file provided.");

        if (file.Length > MaxFileSizeBytes)
            return (null, $"File exceeds the {MaxFileSizeBytes / (1024 * 1024)} MB limit.");

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedDocumentExtensions.Contains(ext))
            return (null, $"File type '{ext}' is not allowed. Accepted: {string.Join(", ", AllowedDocumentExtensions)}");

        try
        {
            var rootFolder = GetOrCreateFolder(RootFolderName, Constants.System.Root);
            var parentFolder = GetOrCreateFolder(subfolder, rootFolder.Id);

            var fileName = Path.GetFileName(file.FileName);

            // Use Image media type for images, File for documents
            var isImage = AllowedImageExtensions.Contains(ext);
            var mediaTypeAlias = isImage
                ? Constants.Conventions.MediaTypes.Image
                : Constants.Conventions.MediaTypes.File;

            var media = _mediaService.CreateMedia(fileName, parentFolder.Id, mediaTypeAlias);

            using var stream = file.OpenReadStream();
            media.SetValue(
                _mediaFileManager,
                _mediaUrlGenerators,
                _shortStringHelper,
                _contentTypeBaseServiceProvider,
                Constants.Conventions.Media.File,
                fileName,
                stream);

            var result = _mediaService.Save(media);
            if (!result.Success)
            {
                _logger.LogWarning("Rebraco: Umbraco media save failed for document '{FileName}'", fileName);
                return (null, "Failed to save document file.");
            }

            if (media.TryGetMediaPath(Constants.Conventions.Media.File, _mediaUrlGenerators, out var mediaPath))
            {
                _logger.LogInformation("Rebraco: Uploaded document '{FileName}' → {Path} (Node {Id})",
                    fileName, mediaPath, media.Id);
                return (mediaPath, null);
            }

            var fallbackUrl = $"/media/{media.Key.ToString("N")[..8]}/{fileName}";
            _logger.LogWarning("Rebraco: TryGetMediaPath failed for document node {Id}, using fallback: {Url}",
                media.Id, fallbackUrl);
            return (fallbackUrl, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rebraco: Document upload failed for '{FileName}'", file.FileName);
            return (null, "An unexpected error occurred during upload.");
        }
    }

    /// <summary>
    /// Deletes the Umbraco media node that corresponds to a given media URL.
    /// Best-effort — logs warnings but doesn't throw.
    /// </summary>
    public void Delete(string? mediaUrl)
    {
        if (string.IsNullOrWhiteSpace(mediaUrl)) return;

        try
        {
            // Umbraco stores media under /media/{shortKey}/filename
            // Try to find by iterating root media in "Rebraco Uploads"
            var rootFolder = FindFolder(RootFolderName, Constants.System.Root);
            if (rootFolder == null) return;

            // Search all media nodes under our root for a matching URL
            long totalRecords;
            var page = _mediaService.GetPagedDescendants(rootFolder.Id, 0, 500, out totalRecords);

            foreach (var media in page)
            {
                if (media.TryGetMediaPath(Constants.Conventions.Media.File, _mediaUrlGenerators, out var path)
                    && string.Equals(path, mediaUrl, StringComparison.OrdinalIgnoreCase))
                {
                    _mediaService.Delete(media);
                    _logger.LogInformation("Rebraco: Deleted media node {Id} for URL {Url}", media.Id, mediaUrl);
                    return;
                }
            }

            _logger.LogWarning("Rebraco: Could not find media node for URL '{Url}' to delete", mediaUrl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rebraco: Failed to delete media for URL '{Url}'", mediaUrl);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private IMedia GetOrCreateFolder(string name, int parentId)
    {
        var existing = FindFolder(name, parentId);
        if (existing != null) return existing;

        var folder = _mediaService.CreateMedia(name, parentId,
            Constants.Conventions.MediaTypes.Folder);
        _mediaService.Save(folder);

        _logger.LogInformation("Rebraco: Created media folder '{Name}' under parent {ParentId}", name, parentId);
        return folder;
    }

    private IMedia? FindFolder(string name, int parentId)
    {
        long totalRecords;
        var children = _mediaService.GetPagedChildren(parentId, 0, 100, out totalRecords);

        return children.FirstOrDefault(c =>
            c.ContentType.Alias == Constants.Conventions.MediaTypes.Folder
            && string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase));
    }
}
