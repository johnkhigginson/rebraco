import type { ApiContentResponseModel } from '../api/umbraco';
import BlockRenderer from '../components/BlockRenderer';
import PageLayout from '../components/layout/PageLayout';

interface StandardPageProps {
  data: ApiContentResponseModel;
}

export default function StandardPage({ data }: StandardPageProps) {
  const props = data.properties;
  const gridContent = props?.mainContent;
  const pageLayout = props?.pageLayout?.[0] || props?.pageLayout || 'fullWidth';
  const sidebarContent = props?.sidebarContent;

  return (
    <PageLayout
      layout={pageLayout}
      sidebar={sidebarContent ? <BlockRenderer content={sidebarContent} /> : undefined}
    >
      {gridContent ? (
        <BlockRenderer content={gridContent} />
      ) : (
        <div className="py-20 text-center text-slate-400">
          This page is empty. Go to Umbraco and add some blocks!
        </div>
      )}
    </PageLayout>
  );
}
