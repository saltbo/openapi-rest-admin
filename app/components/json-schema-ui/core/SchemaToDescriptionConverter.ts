// 用于描述渲染器的接口
export interface DescriptionsRenderer {
  render: (props: { items: DescriptionsItem[]; column?: number }) => React.ReactElement;
}

export interface DescriptionsItem {
  key: string;
  label: string;
  value: any;
}

export class SchemaToDescriptionsConverter {
  static convert(schema: any, data: Record<string, any>): DescriptionsItem[] {
    if (!schema || typeof schema !== 'object') return [];
    const properties = schema.properties || {};
    return Object.keys(properties).map((key) => ({
      key,
      label: properties[key].title || key,
      value: data[key],
    }));
  }
} 