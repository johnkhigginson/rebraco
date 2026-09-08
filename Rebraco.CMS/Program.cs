using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Services;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Trust X-Forwarded-* headers from IIS reverse proxy
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// Rebraco business domain (EF Core — same database as Umbraco, 'rebraco' schema)
builder.Services.AddDbContext<RebracoDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("umbracoDbDSN")));

builder.Services.AddHostedService<DatabaseMigrator>();
builder.Services.AddHostedService<NotificationBackgroundService>();
builder.Services.AddScoped<InquiryService>();
builder.Services.AddScoped<PropertyService>();
builder.Services.AddScoped<UnitService>();
builder.Services.AddScoped<TenantService>();
builder.Services.AddScoped<LeaseService>();
builder.Services.AddScoped<MaintenanceService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<PublicPropertyService>();
builder.Services.AddScoped<MediaUploadService>();
builder.Services.AddScoped<ApplicationSettingsService>();
builder.Services.AddScoped<ApplicationService>();
builder.Services.AddScoped<RenewalSettingsService>();
builder.Services.AddScoped<LeaseRenewalService>();
builder.Services.AddScoped<TourSettingsService>();
builder.Services.AddScoped<TourService>();

// Stripe payment processing
builder.Services.AddScoped<IStripeConfigService, StripeConfigService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

// Email: use Postmark if token configured, otherwise NoOp (logs only)
var postmarkToken = builder.Configuration["Postmark:ServerToken"];
if (!string.IsNullOrWhiteSpace(postmarkToken))
{
    var emailOptions = new PostmarkEmailServiceOptions
    {
        ServerToken = postmarkToken,
        FromEmail = builder.Configuration["Postmark:FromEmail"] ?? "rebraco@pm.mwsoutbound.com",
        NotifyEmail = builder.Configuration["Postmark:NotifyEmail"] ?? "",
    };
    builder.Services.AddSingleton(emailOptions);
    builder.Services.AddScoped<IEmailService, PostmarkEmailService>();
}
else
{
    builder.Services.AddScoped<IEmailService, NoOpEmailService>();
}

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
        options.AddPolicy("AllowAll", policy =>
            policy.AllowAnyHeader().AllowAnyMethod()
                .SetIsOriginAllowed(_ => true).AllowCredentials()));
}
else
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    builder.Services.AddCors(options =>
        options.AddPolicy("AllowAll", policy =>
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()
                .AllowCredentials()));
}

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Allow larger multipart uploads for image endpoints (10 MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024;
});

// Rate limiting — protect public endpoints from spam / brute-force
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Too many requests. Please try again later." }, ct);
    };

    // Login: 5 attempts per minute per IP
    options.AddPolicy("Login", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 2,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));

    // Public forms: 10 per minute per IP
    options.AddPolicy("PublicForm", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 2,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));

    // Public API: 60 per minute per IP (property listings, detail pages)
    options.AddPolicy("PublicApi", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));
});

builder.Services.AddResponseCaching();

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddDeliveryApi()
    .AddComposers()
    .Build();

WebApplication app = builder.Build();

app.UseForwardedHeaders();

await app.BootUmbracoAsync();


app.UseUmbraco()
    .WithMiddleware(u =>
    {
        u.UseBackOffice();
        u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();
    });

// Global exception handler — catch unhandled exceptions, return JSON, log
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger("Rebraco.GlobalExceptionHandler");
        logger.LogError(exception, "Unhandled exception on {Method} {Path}",
            context.Request.Method, context.Request.Path);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new { error = "An unexpected error occurred." });
    });
});

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "0";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});

app.UseAuthentication();
app.UseAuthorization();
app.UseCors("AllowAll");
app.UseRateLimiter();
app.UseResponseCaching();
app.MapControllers();

await app.RunAsync();
