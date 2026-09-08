using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace Rebraco.CMS.Setup;

/// <summary>
/// Creates member types and groups on startup:
/// - "propertyManager" type + "PropertyManager" group (rental management)
/// - "tenant" type + "Tenant" group (tenant self-service portal)
/// - "prospect" type + "Prospect" group (rental application portal)
/// Idempotent — skips if they already exist.
/// </summary>
public class MemberSetup : INotificationHandler<UmbracoApplicationStartedNotification>
{
    private readonly IMemberTypeService _memberTypeService;
    private readonly IMemberGroupService _memberGroupService;
    private readonly IDataTypeService _dataTypeService;
    private readonly IShortStringHelper _ssh;
    private readonly ILogger<MemberSetup> _logger;

    public MemberSetup(
        IMemberTypeService memberTypeService,
        IMemberGroupService memberGroupService,
        IDataTypeService dataTypeService,
        IShortStringHelper shortStringHelper,
        ILogger<MemberSetup> logger)
    {
        _memberTypeService = memberTypeService;
        _memberGroupService = memberGroupService;
        _dataTypeService = dataTypeService;
        _ssh = shortStringHelper;
        _logger = logger;
    }

    public void Handle(UmbracoApplicationStartedNotification notification)
    {
        try
        {
            EnsureMemberType();
            EnsureMemberGroup();
            EnsureTenantMemberType();
            EnsureTenantMemberGroup();
            EnsureProspectMemberType();
            EnsureProspectMemberGroup();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rebraco: Member setup failed.");
            throw;
        }
    }

    private void EnsureMemberType()
    {
        const string alias = "propertyManager";
        var existing = _memberTypeService.Get(alias);
        if (existing != null)
        {
            _logger.LogInformation("Rebraco: Member type '{Alias}' already exists.", alias);
            return;
        }

        var textstring = _dataTypeService.GetAll()
            .FirstOrDefault(d => d.EditorAlias == Constants.PropertyEditors.Aliases.TextBox)
            ?? throw new InvalidOperationException("Textstring data type not found.");

        var memberType = new MemberType(_ssh, -1)
        {
            Alias = alias,
            Name = "Property Manager",
            Icon = "icon-user",
            Description = "Rental property manager account"
        };

        // Add Profile tab with custom properties
        var profileGroup = new PropertyGroup(new PropertyTypeCollection(true))
        {
            Alias = "profile",
            Name = "Profile",
            Type = PropertyGroupType.Tab,
            SortOrder = 0
        };

        profileGroup.PropertyTypes!.Add(new PropertyType(_ssh, textstring)
        {
            Alias = "company",
            Name = "Company",
            Description = "Company or organization name",
            SortOrder = 0
        });

        profileGroup.PropertyTypes.Add(new PropertyType(_ssh, textstring)
        {
            Alias = "phone",
            Name = "Phone",
            Description = "Contact phone number",
            SortOrder = 1
        });

        profileGroup.PropertyTypes.Add(new PropertyType(_ssh, textstring)
        {
            Alias = "jobTitle",
            Name = "Job Title",
            SortOrder = 2
        });

        memberType.PropertyGroups.Add(profileGroup);
        _memberTypeService.Save(memberType);

        _logger.LogInformation("Rebraco: Created member type '{Alias}' with profile properties.", alias);
    }

    private void EnsureMemberGroup()
    {
        const string groupName = "PropertyManager";
        var existing = _memberGroupService.GetByName(groupName);
        if (existing != null)
        {
            _logger.LogInformation("Rebraco: Member group '{Name}' already exists.", groupName);
            return;
        }

        var group = new MemberGroup { Name = groupName };
        _memberGroupService.Save(group);

        _logger.LogInformation("Rebraco: Created member group '{Name}'.", groupName);
    }

    private void EnsureTenantMemberType()
    {
        const string alias = "tenant";
        var existing = _memberTypeService.Get(alias);
        if (existing != null)
        {
            _logger.LogInformation("Rebraco: Member type '{Alias}' already exists.", alias);
            return;
        }

        var textstring = _dataTypeService.GetAll()
            .FirstOrDefault(d => d.EditorAlias == Constants.PropertyEditors.Aliases.TextBox)
            ?? throw new InvalidOperationException("Textstring data type not found.");

        var memberType = new MemberType(_ssh, -1)
        {
            Alias = alias,
            Name = "Tenant",
            Icon = "icon-user",
            Description = "Tenant self-service portal account"
        };

        var profileGroup = new PropertyGroup(new PropertyTypeCollection(true))
        {
            Alias = "profile",
            Name = "Profile",
            Type = PropertyGroupType.Tab,
            SortOrder = 0
        };

        profileGroup.PropertyTypes!.Add(new PropertyType(_ssh, textstring)
        {
            Alias = "phone",
            Name = "Phone",
            Description = "Contact phone number",
            SortOrder = 0
        });

        profileGroup.PropertyTypes.Add(new PropertyType(_ssh, textstring)
        {
            Alias = "emergencyContactName",
            Name = "Emergency Contact Name",
            SortOrder = 1
        });

        profileGroup.PropertyTypes.Add(new PropertyType(_ssh, textstring)
        {
            Alias = "emergencyContactPhone",
            Name = "Emergency Contact Phone",
            SortOrder = 2
        });

        memberType.PropertyGroups.Add(profileGroup);
        _memberTypeService.Save(memberType);

        _logger.LogInformation("Rebraco: Created member type '{Alias}' with profile properties.", alias);
    }

    private void EnsureTenantMemberGroup()
    {
        const string groupName = "Tenant";
        var existing = _memberGroupService.GetByName(groupName);
        if (existing != null)
        {
            _logger.LogInformation("Rebraco: Member group '{Name}' already exists.", groupName);
            return;
        }

        var group = new MemberGroup { Name = groupName };
        _memberGroupService.Save(group);

        _logger.LogInformation("Rebraco: Created member group '{Name}'.", groupName);
    }

    private void EnsureProspectMemberType()
    {
        const string alias = "prospect";
        var existing = _memberTypeService.Get(alias);
        if (existing != null)
        {
            _logger.LogInformation("Rebraco: Member type '{Alias}' already exists.", alias);
            return;
        }

        var textstring = _dataTypeService.GetAll()
            .FirstOrDefault(d => d.EditorAlias == Constants.PropertyEditors.Aliases.TextBox)
            ?? throw new InvalidOperationException("Textstring data type not found.");

        var memberType = new MemberType(_ssh, -1)
        {
            Alias = alias,
            Name = "Prospect",
            Icon = "icon-user",
            Description = "Prospect account for rental applications"
        };

        var profileGroup = new PropertyGroup(new PropertyTypeCollection(true))
        {
            Alias = "profile",
            Name = "Profile",
            Type = PropertyGroupType.Tab,
            SortOrder = 0
        };

        profileGroup.PropertyTypes!.Add(new PropertyType(_ssh, textstring)
        {
            Alias = "phone",
            Name = "Phone",
            Description = "Contact phone number",
            SortOrder = 0
        });

        memberType.PropertyGroups.Add(profileGroup);
        _memberTypeService.Save(memberType);

        _logger.LogInformation("Rebraco: Created member type '{Alias}' with profile properties.", alias);
    }

    private void EnsureProspectMemberGroup()
    {
        const string groupName = "Prospect";
        var existing = _memberGroupService.GetByName(groupName);
        if (existing != null)
        {
            _logger.LogInformation("Rebraco: Member group '{Name}' already exists.", groupName);
            return;
        }

        var group = new MemberGroup { Name = groupName };
        _memberGroupService.Save(group);

        _logger.LogInformation("Rebraco: Created member group '{Name}'.", groupName);
    }
}
