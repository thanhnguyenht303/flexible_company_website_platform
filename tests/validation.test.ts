import { describe, expect, it } from "vitest";
import { contactInquirySchema } from "../lib/validation";
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
});
