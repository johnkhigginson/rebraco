using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;

namespace Rebraco.CMS.Setup;

public class RebracoComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddNotificationHandler<UmbracoApplicationStartedNotification, RebracoSetupHandler>();
        builder.AddNotificationHandler<UmbracoApplicationStartedNotification, MemberSetup>();
    }
}
