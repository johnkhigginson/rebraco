using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace Rebraco.CMS.Setup.Helpers;

public class ContentTypeHelper
{
    private readonly IContentTypeService _cts;
    private readonly IShortStringHelper _ssh;
    private readonly ILogger<ContentTypeHelper> _logger;

    public ContentTypeHelper(
        IContentTypeService contentTypeService,
        IShortStringHelper shortStringHelper,
        ILogger<ContentTypeHelper> logger)
    {
        _cts = contentTypeService;
        _ssh = shortStringHelper;
        _logger = logger;
    }

    public IContentType GetOrCreateElementType(string alias, string name, string icon, string description = "")
    {
        var existing = _cts.Get(alias);
        if (existing != null) return existing;

        var ct = new ContentType(_ssh, -1)
        {
            Alias = alias,
            Name = name,
            Icon = icon,
            Description = description,
            IsElement = true,
            AllowedAsRoot = false
        };
        _cts.Save(ct);
        _logger.LogInformation("Rebraco: Created element type '{Alias}'", alias);
        return ct;
    }

    public IContentType GetOrCreateDocumentType(
        string alias, string name, string icon,
        bool allowedAsRoot = false, string description = "")
    {
        var existing = _cts.Get(alias);
        if (existing != null) return existing;

        var ct = new ContentType(_ssh, -1)
        {
            Alias = alias,
            Name = name,
            Icon = icon,
            Description = description,
            IsElement = false,
            AllowedAsRoot = allowedAsRoot
        };
        _cts.Save(ct);
        _logger.LogInformation("Rebraco: Created document type '{Alias}'", alias);
        return ct;
    }

    public void EnsurePropertyGroup(IContentType ct, string alias, string name, int sortOrder = 0)
    {
        if (ct.PropertyGroups.Any(g => g.Alias == alias)) return;

        ct.PropertyGroups.Add(new PropertyGroup(new PropertyTypeCollection(true))
        {
            Alias = alias,
            Name = name,
            Type = PropertyGroupType.Tab,
            SortOrder = sortOrder
        });
    }

    public void AddPropertyIfMissing(
        IContentType ct,
        string groupAlias,
        string groupName,
        string propertyAlias,
        string propertyName,
        IDataType dataType,
        string description = "",
        int sortOrder = 0,
        bool mandatory = false,
        int groupSortOrder = 0)
    {
        if (ct.PropertyTypeExists(propertyAlias)) return;

        EnsurePropertyGroup(ct, groupAlias, groupName, groupSortOrder);

        var group = ct.PropertyGroups.First(g => g.Alias == groupAlias);
        group.PropertyTypes!.Add(new PropertyType(_ssh, dataType)
        {
            Alias = propertyAlias,
            Name = propertyName,
            Description = description,
            SortOrder = sortOrder,
            Mandatory = mandatory
        });
    }

    /// <summary>
    /// Ensure an existing property uses the specified data type. No-op if it already matches.
    /// </summary>
    public bool EnsurePropertyDataType(IContentType ct, string propertyAlias, IDataType dataType)
    {
        var prop = ct.PropertyTypes.FirstOrDefault(p => p.Alias == propertyAlias);
        if (prop == null || prop.DataTypeId == dataType.Id) return false;

        prop.DataTypeId = dataType.Id;
        _logger.LogInformation("Rebraco: Updated property '{Alias}' on '{Type}' to data type '{DataType}'",
            propertyAlias, ct.Alias, dataType.Name);
        return true;
    }

    public void SetAllowedContentTypes(IContentType parent, params string[] childAliases)
    {
        var allowed = new List<ContentTypeSort>();
        for (int i = 0; i < childAliases.Length; i++)
        {
            var child = _cts.Get(childAliases[i]);
            if (child != null)
            {
                allowed.Add(new ContentTypeSort(child.Key, i, child.Alias));
            }
        }
        parent.AllowedContentTypes = allowed;
    }

    public void EnsureAllowedAsRoot(IContentType ct, bool allowed)
    {
        if (ct.AllowedAsRoot != allowed)
        {
            ct.AllowedAsRoot = allowed;
            _cts.Save(ct);
            _logger.LogInformation("Rebraco: Set AllowedAsRoot={Allowed} for '{Alias}'", allowed, ct.Alias);
        }
    }

    /// <summary>
    /// Remove a property and its parent group if the group becomes empty.
    /// </summary>
    public bool RemovePropertyIfExists(IContentType ct, string propertyAlias)
    {
        var prop = ct.PropertyTypes.FirstOrDefault(p => p.Alias == propertyAlias);
        if (prop == null) return false;

        var group = ct.PropertyGroups.FirstOrDefault(g =>
            g.PropertyTypes != null && g.PropertyTypes.Any(p => p.Alias == propertyAlias));

        ct.RemovePropertyType(propertyAlias);

        // Remove the group if it's now empty
        if (group != null && (group.PropertyTypes == null || !group.PropertyTypes.Any()))
        {
            ct.PropertyGroups.Remove(group);
        }

        _logger.LogInformation("Rebraco: Removed property '{Alias}' from '{Type}'", propertyAlias, ct.Alias);
        return true;
    }

    public void Save(IContentType ct)
    {
        _cts.Save(ct);
    }
}
