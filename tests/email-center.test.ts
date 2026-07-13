import { describe, expect, it } from "vitest";
import { renderTemplate } from "../modules/email/email.render";
import { emailSettingsSchema, emailTemplateSchema, inboundEmailSchema, sendEmailSchema } from "../modules/email/email.validation";
import { extractTemplateVariables, getSampleTemplateValues, getTemplateVariables, normalizeCustomTemplateVariables, renderRegisteredTemplate, suggestTemplateVariable, validateTemplateContent } from "../modules/email/email.variables";

describe("Email Center", () => {
  it("renders known variables and safely blanks missing variables", () => {
    expect(renderTemplate("Hi {{ name }}: {{count}} / {{missing}}", { name: "Ava", count: 2 })).toBe("Hi Ava: 2 / ");
  });

  it("validates settings email lists and SMTP port", () => {
    expect(emailSettingsSchema.safeParse({
      notificationEmails: ["admin@example.com"], ccEmails: [], bccEmails: [],
      emailNotificationsEnabled: true, smtpPort: 587, smtpSecure: false,
      imapHost: "imap.gmail.com", imapPort: 993, imapUsername: "admin@example.com", imapSecure: true
    }).success).toBe(true);
    expect(emailSettingsSchema.safeParse({ notificationEmails: ["not-an-email"], ccEmails: [], bccEmails: [], emailNotificationsEnabled: true, smtpSecure: false }).success).toBe(false);
  });

  it("requires recipients and validates template keys", () => {
    expect(sendEmailSchema.safeParse({ to: [], subject: "Hello", body: "Body" }).success).toBe(false);
    expect(emailTemplateSchema.safeParse({ name: "Reply", key: "career.reply", category: "career", language: "en", subject: "Hello", body: "Body", isActive: true, variables: [] }).success).toBe(true);
    expect(emailTemplateSchema.safeParse({ name: "Reply", key: "Bad Key", category: "career", language: "en", subject: "Hello", body: "Body", isActive: true, variables: [] }).success).toBe(false);
  });

  it("validates provider inbound payloads", () => {
    expect(inboundEmailSchema.safeParse({ fromEmail: "reply@example.com", toEmails: ["inbox@example.com"], subject: "Re: Quote", body: "Thanks" }).success).toBe(true);
    expect(inboundEmailSchema.safeParse({ fromEmail: "bad", toEmails: [], body: "x" }).success).toBe(false);
  });

  it("uses one category registry for exact variable validation and sample rendering", () => {
    expect(getTemplateVariables("career").some((item) => item.key === "applicantName" && item.resolverPath === "application.name")).toBe(true);
    expect(validateTemplateContent("Hi {{applicantName}}", "Role: {{positionTitle}}", "career")).toEqual([]);
    expect(validateTemplateContent("Hi {{NameofApplicant}}", "Hi {{ applicantName }}", "career").map((item) => item.syntax)).toEqual(["{{NameofApplicant}}", "{{ applicantName }}"]);
    expect(suggestTemplateVariable("NameofApplicant", "career")).toBe("applicantName");
  });

  it("keeps unknown variables visible and uses a safe fallback for missing known values", () => {
    expect(extractTemplateVariables("{{applicantName}} {{NameofApplicant}}").map((item) => item.key)).toEqual(["applicantName", "NameofApplicant"]);
    expect(renderRegisteredTemplate("Hi {{applicantName}} / {{applicantPhone}} / {{NameofApplicant}}", "career", { applicantName: "John Smith", applicantPhone: "" })).toBe("Hi John Smith / Not provided / {{NameofApplicant}}");
  });

  it("supports template-specific variables mapped to approved data or fixed text", () => {
    const custom = normalizeCustomTemplateVariables([
      { key: "NameofApplicant", label: "Preferred applicant label", sourceType: "registered", sourceKey: "applicantName", sampleValue: "Sample Applicant" },
      { key: "supportPhone", label: "Support phone", sourceType: "fixed", fixedValue: "312-555-0100" }
    ]);
    expect(validateTemplateContent("Hi {{NameofApplicant}}", "Call {{supportPhone}}", "career", custom)).toEqual([]);
    expect(renderRegisteredTemplate("Hi {{NameofApplicant}}. Call {{supportPhone}}.", "career", { applicantName: "John Smith" }, "Not provided", custom)).toBe("Hi John Smith. Call 312-555-0100.");
    expect(getSampleTemplateValues("career", "en", custom).NameofApplicant).toBe("Sample Applicant");
  });

  it("rejects unsafe or invalid custom variable assignments", () => {
    const base = { name: "Custom", key: "career.custom", category: "career", language: "en", subject: "Hi", body: "Body", isActive: true, variables: [] };
    expect(emailTemplateSchema.safeParse({ ...base, customVariables: [{ key: "NameofApplicant", label: "Name", sourceType: "registered", sourceKey: "applicantName" }] }).success).toBe(true);
    expect(emailTemplateSchema.safeParse({ ...base, customVariables: [{ key: "bad key", label: "Bad", sourceType: "registered", sourceKey: "application.secret" }] }).success).toBe(false);
    expect(emailTemplateSchema.safeParse({ ...base, customVariables: [{ key: "applicantName", label: "Collision", sourceType: "fixed", fixedValue: "Override" }] }).success).toBe(false);
  });
});
