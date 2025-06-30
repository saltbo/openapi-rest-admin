import React from 'react';
import type { JSONSchema7 } from 'json-schema';
import type { DescriptionRenderer } from '../../core';
import { SchemaToDescriptionConverter } from '../../core';
import { AntdDescriptionRenderer } from './AntdDescriptionRenderer';

export interface JsonSchemaDescriptionProps {
  schema: JSONSchema7;
  data: Record<string, any>;
  column?: number;
  renderer?: DescriptionRenderer;
}

export const Description: React.FC<JsonSchemaDescriptionProps> = ({ schema, data, column = 2, renderer }) => {
  const items = SchemaToDescriptionConverter.convert(schema, data);
  const descRenderer = renderer || new AntdDescriptionRenderer();
  return descRenderer.render({ items, column });
};

