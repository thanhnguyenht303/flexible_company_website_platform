export const enabledModules = [
  "company-profile",
  "theme-builder",
  "products",
  "services",
  "blog",
  "team",
  "media",
  "inquiries",
  "users"
] as const;

export type EnabledModule = (typeof enabledModules)[number];
