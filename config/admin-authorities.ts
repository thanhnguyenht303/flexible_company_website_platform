export const ADMIN_MENU_AUTHORITIES = [
  { key: "dashboard.view", name: "Dashboard", group: "Workspace", menuPath: "/admin/dashboard", description: "Access the admin dashboard" },
  { key: "siteSettings.manage", name: "Site Settings", group: "Workspace", menuPath: "/admin/settings/site", description: "Manage site settings" },
  { key: "theme.manage", name: "Theme", group: "Workspace", menuPath: "/admin/settings/theme", description: "Manage the website theme" },
  { key: "pages.manage", name: "Pages", group: "Workspace", menuPath: "/admin/pages", description: "Manage website pages and the page builder" },
  { key: "services.manage", name: "Services", group: "Content", menuPath: "/admin/services", description: "Manage services" },
  { key: "products.manage", name: "Products", group: "Content", menuPath: "/admin/products", description: "Manage products" },
  { key: "posts.manage", name: "Posts", group: "Content", menuPath: "/admin/posts", description: "Manage blog posts" },
  { key: "careers.manage", name: "Careers", group: "Content", menuPath: "/admin/careers", description: "Manage careers and job applications" },
  { key: "forms.manage", name: "Forms", group: "Content", menuPath: "/admin/forms", description: "Manage forms" },
  { key: "leads.manage", name: "Leads", group: "Content", menuPath: "/admin/leads", description: "Manage leads" },
  { key: "qa.manage", name: "Q&A", group: "Content", menuPath: "/admin/qa", description: "Manage questions and answers" },
  { key: "team.manage", name: "Team", group: "Content", menuPath: "/admin/team", description: "Manage team members" },
  { key: "footer.manage", name: "Footer", group: "Content", menuPath: "/admin/footer", description: "Manage footer content" },
  { key: "media.manage", name: "Media", group: "Admin", menuPath: "/admin/media", description: "Manage the media library" },
  { key: "inquiries.manage", name: "Inquiries", group: "Admin", menuPath: "/admin/inquiries", description: "Manage inquiries" },
  { key: "email.manage", name: "Email Center", group: "Admin", menuPath: "/admin/email", description: "Manage email settings, templates, messages, and workflow notifications" },
  { key: "users.manage", name: "Users", group: "Admin", menuPath: "/admin/users", description: "Manage admin users" },
  { key: "roles.manage", name: "Roles", group: "Admin", menuPath: "/admin/roles", description: "Manage roles and authorities" }
] as const;

export type AuthorityKey = (typeof ADMIN_MENU_AUTHORITIES)[number]["key"];

export const ALL_AUTHORITY_KEYS = ADMIN_MENU_AUTHORITIES.map((authority) => authority.key);

export const SUPER_ADMIN_NAME = "Super Admin";
export const SUPER_ADMIN_SLUG = "super-admin";
