import type { BlockContentProps } from '../../types/blocks';

interface DataListItemData {
  content: {
    properties: {
      label?: string;
      value?: string;
      description?: string;
      highlighted?: boolean;
    };
  };
}

interface DataListData {
  heading?: string;
  layout?: string;
  items?: {
    items: DataListItemData[];
  };
}

export default function DataList({ data }: BlockContentProps<DataListData>) {
  const items = data.items?.items || [];
  if (items.length === 0) return null;

  const layout = data.layout || 'table';

  return (
    <div className="max-w-4xl mx-auto">
        {data.heading && (
          <h2 className="text-3xl font-bold text-heading mb-8">{data.heading}</h2>
        )}

        {layout === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => {
              const props = item.content.properties;
              return (
                <div
                  key={i}
                  className={`p-6 rounded-xl border ${
                    props.highlighted
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-bg'
                  }`}
                >
                  <div className="text-sm text-text-muted mb-1">{props.label}</div>
                  <div className="text-2xl font-bold text-heading">{props.value}</div>
                  {props.description && (
                    <div className="text-sm text-text-muted mt-2">{props.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : layout === 'definition-list' ? (
          <dl className="space-y-4">
            {items.map((item, i) => {
              const props = item.content.properties;
              return (
                <div key={i} className={`py-3 ${props.highlighted ? 'bg-primary/5 px-4 rounded-lg' : ''}`}>
                  <dt className="text-sm font-semibold text-heading">{props.label}</dt>
                  <dd className="text-lg text-text">{props.value}</dd>
                  {props.description && (
                    <dd className="text-sm text-text-muted mt-1">{props.description}</dd>
                  )}
                </div>
              );
            })}
          </dl>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full">
              <tbody className="divide-y divide-border">
                {items.map((item, i) => {
                  const props = item.content.properties;
                  return (
                    <tr
                      key={i}
                      className={props.highlighted ? 'bg-primary/5' : 'bg-bg'}
                    >
                      <td className="px-6 py-4 font-medium text-heading">{props.label}</td>
                      <td className="px-6 py-4 text-text">{props.value}</td>
                      <td className="px-6 py-4 text-sm text-text-muted hidden md:table-cell">
                        {props.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
