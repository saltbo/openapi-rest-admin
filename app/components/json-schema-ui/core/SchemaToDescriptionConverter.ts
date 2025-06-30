// 用于描述渲染器的接口
export interface DescriptionRenderer {
  render: (props: { items: DescriptionItem[]; column?: number }) => React.ReactElement;
}

export interface DescriptionItem {
  key: string;
  label: string;
  value: any;
}

export class SchemaToDescriptionConverter {
  static convert(schema: any, data: Record<string, any>): DescriptionItem[] {
    if (!schema || typeof schema !== 'object') return [];
    const properties = schema.properties || {};
    return Object.keys(properties).map((key) => ({
      key,
      label: properties[key].title || key,
      value: data[key],
    }));
  }
} 