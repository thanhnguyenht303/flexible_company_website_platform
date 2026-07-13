type Primitive = string | number | boolean | null | undefined;

export function renderTemplate(value: string, variables: Record<string, Primitive> = {}) {
  return value.replace(/{{\s*([A-Za-z][A-Za-z0-9]*)\s*}}/g, (_match, name: string) => {
    const replacement = variables[name];
    return replacement === null || replacement === undefined ? "" : String(replacement);
  });
}
