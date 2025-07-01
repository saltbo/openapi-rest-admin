import React from 'react';
import type { JSONSchema7 } from 'json-schema';
import type { DescriptionsRenderer } from '../../core';
import { SchemaToDescriptionsConverter } from '../../core';
import { AntdDescriptionRenderer } from './AntdDescriptionRenderer';

export interface JsonSchemaDescriptionsProps {
  schema: JSONSchema7;
  data: Record<string, any>;
  column?: number;
  renderer?: DescriptionsRenderer;
}

export const Descriptions: React.FC<JsonSchemaDescriptionsProps> = ({ schema, data, column = 2, renderer }) => {
  const items = SchemaToDescriptionsConverter.convert(schema, data);
  const descRenderer = renderer || new AntdDescriptionRenderer();
  return descRenderer.render({ items, column });
};

