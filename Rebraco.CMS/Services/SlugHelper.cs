using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;

namespace Rebraco.CMS.Services;

public static partial class SlugHelper
{
    /// <summary>Generate a URL-friendly slug from a name.</summary>
    public static string Generate(string name)
    {
        var slug = name.ToLowerInvariant().Trim();
        slug = NonAlphaNumeric().Replace(slug, " ");
        slug = Whitespace().Replace(slug, "-").Trim('-');
        return slug;
    }

    /// <summary>Ensure slug is unique among published properties, appending -1, -2, etc. if needed.</summary>
    public static async Task<string> EnsureUniqueAsync(RebracoDbContext db, string slug, int? excludeId = null)
    {
        var candidate = slug;
        var counter = 1;

        while (await db.Properties.AnyAsync(p => p.Slug == candidate && (excludeId == null || p.Id != excludeId)))
        {
            candidate = $"{slug}-{counter++}";
        }

        return candidate;
    }

    [GeneratedRegex(@"[^a-z0-9\s-]")]
    private static partial Regex NonAlphaNumeric();

    [GeneratedRegex(@"[\s-]+")]
    private static partial Regex Whitespace();
}
