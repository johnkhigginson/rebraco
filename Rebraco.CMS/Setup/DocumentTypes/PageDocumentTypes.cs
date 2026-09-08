using Rebraco.CMS.Setup.DataTypes;
using Rebraco.CMS.Setup.Helpers;
using Umbraco.Cms.Core.Services;

namespace Rebraco.CMS.Setup.DocumentTypes;

public static class PageDocumentTypes
{
    public static void EnsureAll(ContentTypeHelper ct, DataTypeHelper dt, IContentTypeService cts)
    {
        UpdateHome(ct, dt);
        CreateStandardPage(ct, dt);
        CreateBlogLanding(ct, dt);
        CreateBlogPost(ct, dt);

        // Set allowed child types (must happen after all page types exist)
        ConfigureAllowedChildren(ct, cts);
    }

    private static void UpdateHome(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("home", "Home", "icon-home", allowedAsRoot: true);

        var mainGrid = dt.FindDataTypeByName(BlockGridDataType.MainContent)!;
        var sidebarGrid = dt.FindDataTypeByName(BlockGridDataType.SidebarContent)!;
        var pageLayout = dt.FindDataTypeByName(DropdownDataTypes.PageLayout)!;

        ct.AddPropertyIfMissing(type, "content", "Content", "mainContent", "Main Content",
            mainGrid, sortOrder: 0);
        ct.AddPropertyIfMissing(type, "content", "Content", "pageLayout", "Page Layout",
            pageLayout, "fullWidth, leftSidebar, rightSidebar", 1);
        ct.AddPropertyIfMissing(type, "content", "Content", "sidebarContent", "Sidebar Content",
            sidebarGrid, "Shown in sidebar layouts", 2);

        // Ensure block grid properties point to the correct (updated) data types
        ct.EnsurePropertyDataType(type, "mainContent", mainGrid);
        ct.EnsurePropertyDataType(type, "sidebarContent", sidebarGrid);

        AddSeoProperties(ct, dt, type);
        ct.Save(type);
    }

    private static void CreateStandardPage(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("standardPage", "Standard Page", "icon-document",
            description: "General-purpose page with block grid content and optional sidebar");

        var mainGrid = dt.FindDataTypeByName(BlockGridDataType.MainContent)!;
        var sidebarGrid = dt.FindDataTypeByName(BlockGridDataType.SidebarContent)!;
        var pageLayout = dt.FindDataTypeByName(DropdownDataTypes.PageLayout)!;

        ct.AddPropertyIfMissing(type, "content", "Content", "mainContent", "Main Content",
            mainGrid, sortOrder: 0);
        ct.AddPropertyIfMissing(type, "content", "Content", "pageLayout", "Page Layout",
            pageLayout, "fullWidth, leftSidebar, rightSidebar", 1);
        ct.AddPropertyIfMissing(type, "content", "Content", "sidebarContent", "Sidebar Content",
            sidebarGrid, "Shown in sidebar layouts", 2);

        // Ensure block grid properties point to the correct (updated) data types
        ct.EnsurePropertyDataType(type, "mainContent", mainGrid);
        ct.EnsurePropertyDataType(type, "sidebarContent", sidebarGrid);

        AddSeoProperties(ct, dt, type);
        ct.Save(type);
    }

    private static void CreateBlogLanding(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("blogLanding", "Blog Landing", "icon-newspaper-alt",
            description: "Blog listing page that automatically shows child blog posts");

        ct.AddPropertyIfMissing(type, "content", "Content", "heading", "Heading",
            dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, "content", "Content", "postsPerPage", "Posts Per Page",
            dt.Numeric, "Number of blog posts per page", 1);

        AddSeoProperties(ct, dt, type);
        ct.Save(type);
    }

    private static void CreateBlogPost(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("blogPost", "Blog Post", "icon-document",
            description: "Individual blog article with featured image, metadata, and block content");

        var mainGrid = dt.FindDataTypeByName(BlockGridDataType.MainContent)!;

        ct.AddPropertyIfMissing(type, "content", "Content", "title", "Title",
            dt.Textstring, sortOrder: 0, mandatory: true);
        ct.AddPropertyIfMissing(type, "content", "Content", "featuredImage", "Featured Image",
            dt.MediaPicker, sortOrder: 1);
        ct.AddPropertyIfMissing(type, "content", "Content", "publishDate", "Publish Date",
            dt.DatePicker, sortOrder: 2);
        ct.AddPropertyIfMissing(type, "content", "Content", "author", "Author",
            dt.Textstring, sortOrder: 3);
        ct.AddPropertyIfMissing(type, "content", "Content", "excerpt", "Excerpt",
            dt.Textarea, "Short summary for listing cards", 4);
        ct.AddPropertyIfMissing(type, "content", "Content", "categories", "Categories",
            dt.Tags, sortOrder: 5);
        ct.AddPropertyIfMissing(type, "content", "Content", "mainContent", "Main Content",
            mainGrid, sortOrder: 6);

        // Ensure block grid property points to the correct (updated) data type
        ct.EnsurePropertyDataType(type, "mainContent", mainGrid);

        AddSeoProperties(ct, dt, type);
        ct.Save(type);
    }

    private static void AddSeoProperties(ContentTypeHelper ct, DataTypeHelper dt, Umbraco.Cms.Core.Models.IContentType type)
    {
        ct.AddPropertyIfMissing(type, "seo", "SEO", "metaTitle", "Meta Title",
            dt.Textstring, "SEO page title", 0, groupSortOrder: 100);
        ct.AddPropertyIfMissing(type, "seo", "SEO", "metaDescription", "Meta Description",
            dt.Textarea, "SEO meta description", 1, groupSortOrder: 100);
        ct.AddPropertyIfMissing(type, "seo", "SEO", "ogImage", "OG Image",
            dt.MediaPicker, "Social sharing image", 2, groupSortOrder: 100);
        ct.AddPropertyIfMissing(type, "seo", "SEO", "noIndex", "No Index",
            dt.Toggle, "Prevent search engine indexing", 3, groupSortOrder: 100);
    }

    private static void ConfigureAllowedChildren(ContentTypeHelper ct, IContentTypeService cts)
    {
        // Home allows StandardPage and BlogLanding
        var home = cts.Get("home");
        if (home != null)
        {
            ct.SetAllowedContentTypes(home, "standardPage", "blogLanding");
            ct.Save(home);
        }

        // StandardPage allows child StandardPages
        var standardPage = cts.Get("standardPage");
        if (standardPage != null)
        {
            ct.SetAllowedContentTypes(standardPage, "standardPage");
            ct.Save(standardPage);
        }

        // BlogLanding allows BlogPosts
        var blogLanding = cts.Get("blogLanding");
        if (blogLanding != null)
        {
            ct.SetAllowedContentTypes(blogLanding, "blogPost");
            ct.Save(blogLanding);
        }
    }
}
