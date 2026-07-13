import { describe, expect, it } from "vitest";
import { isSafeCssColor } from "../lib/css-color";
import { contactInquirySchema, themeSettingsSchema } from "../lib/validation";
import { slugify } from "../lib/slug";

describe("validation helpers", () => {
  it("accepts a valid contact inquiry", () => {
    const parsed = contactInquirySchema.parse({
      name: "Jane Doe",
      email: "jane@example.com",
      message: "Please contact me about services."
    });

    expect(parsed.email).toBe("jane@example.com");
  });

  it("slugifies titles", () => {
    expect(slugify("CMS Starter: Company Website!")).toBe("cms-starter-company-website");
  });

  it.each(["#2563eb", "#fff", "rgb(37 99 235)", "rgba(37, 99, 235, 0.8)", "hsl(217 91% 60%)", "transparent"])(
    "accepts the supported CSS color %s",
    (color) => {
      expect(isSafeCssColor(color)).toBe(true);
    }
  );

  it.each(["bluee", "#12", "url(https://example.com)", "red; background: white", "var(--unknown)"])(
    "rejects the invalid or unsafe CSS color %s",
    (color) => {
      expect(isSafeCssColor(color)).toBe(false);
    }
  );

  it("validates functional theme colors without allowing inherited values", () => {
    const theme = {
      primaryColor: "rgb(37 99 235)",
      secondaryColor: "#1e293b",
      accentColor: "hsl(21 90% 48%)",
      backgroundColor: "#0f172a",
      textColor: "#fff",
      fontFamily: "Inter",
      borderRadius: "medium",
      headerLayout: "classic",
      footerLayout: "standard"
    };

    expect(themeSettingsSchema.safeParse(theme).success).toBe(true);
    expect(themeSettingsSchema.safeParse({ ...theme, backgroundColor: "inherit" }).success).toBe(false);
  });
});
