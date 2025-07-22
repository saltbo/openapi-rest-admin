import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaRenderer } from "../SchemaRenderer";
import type { OpenAPIV3 } from "openapi-types";

describe("SchemaRenderer x-order support", () => {
  let renderer: SchemaRenderer;

  beforeEach(() => {
    renderer = new SchemaRenderer();
  });

  it("should respect x-order when defined in schema properties", () => {
    const openApiSchema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        email: {
          type: "string",
          format: "email",
          "x-order": 2,
        } as any,
        name: {
          type: "string",
          "x-order": 1,
        } as any,
        age: {
          type: "integer",
          "x-order": 3,
        } as any,
        description: {
          type: "string",
          // 没有定义 x-order，默认为 0
        },
      },
      required: ["name", "email"],
    };

    const result = renderer.getFormSchema(openApiSchema);
    const propertyKeys = Object.keys(result.schema.properties!);

    // 应该按照 x-order 排序：description(0), name(1), email(2), age(3)
    expect(propertyKeys).toEqual(["description", "name", "email", "age"]);
  });

  it("should handle mixed x-order and no x-order fields", () => {
    const openApiSchema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        id: {
          type: "string",
          // 没有 x-order，默认为 0
        },
        title: {
          type: "string",
          "x-order": 1,
        } as any,
        content: {
          type: "string",
          // 没有 x-order，默认为 0
        },
        priority: {
          type: "integer",
          "x-order": 2,
        } as any,
      },
    };

    const result = renderer.getFormSchema(openApiSchema);
    const propertyKeys = Object.keys(result.schema.properties!);

    // 没有 x-order 的字段默认为 0：id(0), content(0), title(1), priority(2)
    // 相同顺序值时保持原始顺序，所以是：id, content, title, priority
    expect(propertyKeys).toEqual(["id", "content", "title", "priority"]);
  });

  it("should prioritize fieldOrder option over x-order", () => {
    const openApiSchema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        name: {
          type: "string",
          "x-order": 2,
        } as any,
        email: {
          type: "string",
          "x-order": 1,
        } as any,
        age: {
          type: "integer",
          "x-order": 3,
        } as any,
      },
    };

    const result = renderer.getFormSchema(openApiSchema, {
      fieldOrder: ["age", "name", "email"],
    });
    const propertyKeys = Object.keys(result.schema.properties!);

    // fieldOrder 选项应该优先于 x-order
    expect(propertyKeys).toEqual(["age", "name", "email"]);
  });

  it("should work when no x-order is defined", () => {
    const openApiSchema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        email: {
          type: "string",
        },
        age: {
          type: "integer",
        },
      },
    };

    const result = renderer.getFormSchema(openApiSchema);
    const propertyKeys = Object.keys(result.schema.properties!);

    // 没有 x-order 时应该保持原始顺序
    expect(propertyKeys).toEqual(["name", "email", "age"]);
  });

  it("should handle negative x-order values", () => {
    const openApiSchema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        name: {
          type: "string",
          "x-order": -1,
        } as any,
        email: {
          type: "string",
          "x-order": 0,
        } as any,
        age: {
          type: "integer",
          "x-order": 1,
        } as any,
      },
    };

    const result = renderer.getFormSchema(openApiSchema);
    const propertyKeys = Object.keys(result.schema.properties!);

    // 应该正确处理负数排序
    expect(propertyKeys).toEqual(["name", "email", "age"]);
  });

  it("should treat fields without x-order as having x-order: 0", () => {
    const openApiSchema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        name: {
          type: "string",
          // 没有 x-order，默认为 0
        },
        email: {
          type: "string",
          "x-order": -1,
        } as any,
        age: {
          type: "integer",
          "x-order": 1,
        } as any,
        description: {
          type: "string",
          // 没有 x-order，默认为 0
        },
      },
    };

    const result = renderer.getFormSchema(openApiSchema);
    const propertyKeys = Object.keys(result.schema.properties!);

    // 排序应该是：email(-1), name(0), description(0), age(1)
    // 相同顺序值时保持原始顺序
    expect(propertyKeys).toEqual(["email", "name", "description", "age"]);
  });

  it("should handle duplicate x-order values", () => {
    const openApiSchema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {
        name: {
          type: "string",
          "x-order": 1,
        } as any,
        email: {
          type: "string",
          "x-order": 1, // 相同的顺序值
        } as any,
        age: {
          type: "integer",
          "x-order": 2,
        } as any,
      },
    };

    const result = renderer.getFormSchema(openApiSchema);
    const propertyKeys = Object.keys(result.schema.properties!);

    // 相同 x-order 值时应该保持稳定排序，age 应该在最后
    expect(propertyKeys[2]).toBe("age");
    expect(propertyKeys.slice(0, 2)).toContain("name");
    expect(propertyKeys.slice(0, 2)).toContain("email");
  });
});
