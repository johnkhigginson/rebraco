using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Services;
using Stripe;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/stripe/webhook")]
public class StripeWebhookController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ApplicationService _applicationService;
    private readonly IStripeConfigService _stripeConfig;
    private readonly ILogger<StripeWebhookController> _logger;

    public StripeWebhookController(
        IPaymentService paymentService,
        ApplicationService applicationService,
        IStripeConfigService stripeConfig,
        ILogger<StripeWebhookController> logger)
    {
        _paymentService = paymentService;
        _applicationService = applicationService;
        _stripeConfig = stripeConfig;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> HandleWebhook()
    {
        var webhookSecret = _stripeConfig.GetWebhookSecret();
        if (string.IsNullOrEmpty(webhookSecret))
        {
            _logger.LogWarning("Rebraco: Stripe webhook secret not configured");
            return BadRequest(new { error = "Webhook not configured" });
        }

        string json;
        using (var reader = new StreamReader(HttpContext.Request.Body))
        {
            json = await reader.ReadToEndAsync();
        }

        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();
        if (string.IsNullOrEmpty(signature))
            return BadRequest(new { error = "Missing Stripe-Signature header" });

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json, signature, webhookSecret);

            await _paymentService.HandleWebhookAsync(stripeEvent);

            // Handle application fee checkout completion
            if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted)
            {
                await _applicationService.HandleCheckoutCompletedAsync(stripeEvent);
            }

            return Ok();
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Rebraco: Stripe webhook signature verification failed");
            return BadRequest(new { error = "Invalid signature" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rebraco: Error processing Stripe webhook");
            return StatusCode(500);
        }
    }
}
