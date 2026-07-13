export const EMAIL_TEMPLATE_CATEGORIES = ["career", "lead", "contact", "form", "qa", "service", "product", "general"] as const;
export type EmailTemplateCategory = (typeof EMAIL_TEMPLATE_CATEGORIES)[number];
export type VariableLanguage = "en" | "vi";

export type EmailTemplateVariable = {
  key: string;
  label: Record<VariableLanguage, string>;
  description: Record<VariableLanguage, string>;
  sampleValue: Record<VariableLanguage, string>;
  resolverPath: string;
};

export type CustomEmailTemplateVariable = {
  key: string;
  label: string;
  sourceType: "registered" | "fixed";
  sourceKey?: string;
  fixedValue?: string;
  sampleValue?: string;
  fallback?: string;
};

const shared = {
  siteName: variable("siteName", "Website/company name", "Tên website/công ty", "The configured website or company name", "Tên website hoặc công ty đã cấu hình", "Acme Company", "Công ty Acme", "site.siteName"),
  adminLink: variable("adminLink", "Admin record link", "Liên kết bản ghi quản trị", "Link to the related record in admin", "Liên kết đến bản ghi liên quan trong trang quản trị", "https://example.com/admin/record", "https://example.com/admin/record", "context.adminLink")
};

export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateCategory, EmailTemplateVariable[]> = {
  career: [
    variable("applicantName", "Applicant name", "Tên ứng viên", "Name submitted by the applicant", "Tên do ứng viên cung cấp", "John Smith", "Nguyễn Văn A", "application.name"),
    variable("applicantEmail", "Applicant email", "Email ứng viên", "Applicant email address", "Địa chỉ email của ứng viên", "john@example.com", "nguyenvana@example.com", "application.email"),
    variable("applicantPhone", "Applicant phone", "Số điện thoại ứng viên", "Applicant phone number", "Số điện thoại của ứng viên", "+1 312 555 0100", "0901 234 567", "application.phone"),
    variable("positionTitle", "Position title", "Vị trí ứng tuyển", "Title of the job being applied for", "Tên vị trí ứng tuyển", "Marketing Manager", "Nhân viên Marketing", "job.title"),
    variable("applicationDate", "Application date", "Ngày ứng tuyển", "Date the application was received", "Ngày nhận hồ sơ ứng tuyển", "July 11, 2026", "11/07/2026", "application.createdAt"),
    variable("resumeLink", "Resume/CV link", "Liên kết CV", "Secure link to the submitted resume", "Liên kết bảo mật đến CV đã nộp", "https://example.com/resume", "https://example.com/resume", "application.resumeFile.url"),
    variable("coverMessage", "Cover message", "Thư giới thiệu", "Optional message submitted with the application", "Nội dung ứng viên gửi kèm hồ sơ", "I am excited to apply.", "Tôi rất mong được ứng tuyển.", "application.message"),
    shared.adminLink,
    shared.siteName
  ],
  lead: [
    variable("leadName", "Lead name", "Tên khách hàng tiềm năng", "Name captured for the lead", "Tên khách hàng tiềm năng", "Jane Cooper", "Trần Minh Anh", "lead.name"),
    variable("leadEmail", "Lead email", "Email khách hàng", "Lead email address", "Địa chỉ email khách hàng", "jane@example.com", "minhanh@example.com", "lead.email"),
    variable("leadPhone", "Lead phone", "Số điện thoại khách hàng", "Lead phone number", "Số điện thoại khách hàng", "+1 312 555 0199", "0912 345 678", "lead.phone"),
    variable("companyName", "Company name", "Tên công ty", "Company associated with the lead", "Công ty của khách hàng", "Northwind Ltd.", "Công ty Minh Anh", "lead.companyName"),
    variable("sourceForm", "Source form", "Biểu mẫu nguồn", "Form that created the lead", "Biểu mẫu đã tạo khách hàng tiềm năng", "Request a Quote", "Yêu cầu báo giá", "form.name"),
    variable("submittedValues", "Submitted values", "Dữ liệu đã gửi", "Formatted values submitted through the form", "Các giá trị đã gửi qua biểu mẫu", "Budget: $5,000", "Ngân sách: 120.000.000đ", "submission.values"),
    shared.adminLink,
    shared.siteName
  ],
  contact: [
    variable("senderName", "Sender name", "Tên người gửi", "Name submitted with the inquiry", "Tên người gửi yêu cầu", "Alex Morgan", "Lê Hoàng", "inquiry.name"),
    variable("senderEmail", "Sender email", "Email người gửi", "Reply address for the inquiry", "Địa chỉ email để trả lời", "alex@example.com", "lehoang@example.com", "inquiry.email"),
    variable("senderPhone", "Sender phone", "Số điện thoại người gửi", "Phone submitted with the inquiry", "Số điện thoại đã gửi", "+1 312 555 0175", "0987 654 321", "inquiry.phone"),
    variable("message", "Message", "Nội dung tin nhắn", "Inquiry message content", "Nội dung yêu cầu liên hệ", "Please contact me about your services.", "Vui lòng liên hệ với tôi về dịch vụ.", "inquiry.message"),
    variable("submittedAt", "Submission time", "Thời gian gửi", "Date and time the inquiry was received", "Ngày giờ nhận yêu cầu", "July 11, 2026 at 10:30 AM", "10:30, 11/07/2026", "inquiry.createdAt"),
    shared.adminLink,
    shared.siteName
  ],
  form: [
    variable("sourceForm", "Source form", "Biểu mẫu nguồn", "Name of the submitted form", "Tên biểu mẫu đã gửi", "Request a Quote", "Yêu cầu báo giá", "form.name"),
    variable("submittedValues", "Submitted values", "Dữ liệu đã gửi", "Formatted field labels and submitted values", "Nhãn trường và dữ liệu đã gửi", "Name: Jane Cooper\nBudget: $5,000", "Tên: Trần Minh Anh\nNgân sách: 120.000.000đ", "submission.values"),
    variable("submittedAt", "Submission time", "Thời gian gửi", "Date and time of submission", "Ngày giờ gửi biểu mẫu", "July 11, 2026 at 10:30 AM", "10:30, 11/07/2026", "submission.createdAt"),
    shared.adminLink,
    shared.siteName
  ],
  qa: [
    variable("questionTitle", "Question title", "Tiêu đề câu hỏi", "Title of the submitted question", "Tiêu đề câu hỏi đã gửi", "How long does delivery take?", "Thời gian giao hàng bao lâu?", "qa.title"),
    variable("question", "Question details", "Nội dung câu hỏi", "Full submitted question", "Nội dung đầy đủ của câu hỏi", "Do you deliver internationally?", "Công ty có giao hàng quốc tế không?", "qa.question"),
    variable("questionBody", "Question details", "Nội dung câu hỏi", "Full submitted question", "Nội dung đầy đủ của câu hỏi", "Do you deliver internationally?", "Công ty có giao hàng quốc tế không?", "qa.question"),
    variable("submitterName", "Submitter name", "Tên người gửi", "Name of the question submitter", "Tên người gửi câu hỏi", "Taylor Lee", "Phạm An", "qa.submitterName"),
    variable("submitterEmail", "Submitter email", "Email người gửi", "Email of the question submitter", "Email người gửi câu hỏi", "taylor@example.com", "phaman@example.com", "qa.submitterEmail"),
    variable("senderName", "Submitter name", "Tên người gửi", "Name of the question submitter", "Tên người gửi câu hỏi", "Taylor Lee", "Phạm An", "qa.submitterName"),
    variable("answer", "Official answer", "Câu trả lời chính thức", "Published answer to the question", "Câu trả lời đã xuất bản", "Delivery normally takes 3–5 business days.", "Thời gian giao hàng thường từ 3–5 ngày làm việc.", "qa.answer"),
    variable("qaLink", "Public Q&A link", "Liên kết Hỏi đáp", "Public link to the published answer", "Liên kết công khai đến câu trả lời", "https://example.com/qa/delivery", "https://example.com/qa/giao-hang", "qa.publicUrl"),
    shared.adminLink,
    shared.siteName
  ],
  service: [
    variable("serviceName", "Service name", "Tên dịch vụ", "Name of the related service", "Tên dịch vụ liên quan", "Consulting", "Tư vấn", "service.name"),
    variable("senderName", "Sender name", "Tên người gửi", "Name of the person asking about the service", "Tên người quan tâm đến dịch vụ", "Alex Morgan", "Lê Hoàng", "inquiry.name"),
    variable("senderEmail", "Sender email", "Email người gửi", "Email of the person asking about the service", "Email người quan tâm đến dịch vụ", "alex@example.com", "lehoang@example.com", "inquiry.email"),
    variable("message", "Message", "Nội dung tin nhắn", "Service inquiry message", "Nội dung yêu cầu dịch vụ", "Please send pricing details.", "Vui lòng gửi thông tin giá.", "inquiry.message"),
    shared.adminLink,
    shared.siteName
  ],
  product: [
    variable("productName", "Product name", "Tên sản phẩm", "Name of the related product", "Tên sản phẩm liên quan", "Industrial Controller", "Bộ điều khiển công nghiệp", "product.name"),
    variable("senderName", "Sender name", "Tên người gửi", "Name of the person asking about the product", "Tên người quan tâm đến sản phẩm", "Alex Morgan", "Lê Hoàng", "inquiry.name"),
    variable("senderEmail", "Sender email", "Email người gửi", "Email of the person asking about the product", "Email người quan tâm đến sản phẩm", "alex@example.com", "lehoang@example.com", "inquiry.email"),
    variable("message", "Message", "Nội dung tin nhắn", "Product inquiry message", "Nội dung yêu cầu sản phẩm", "Is this item in stock?", "Sản phẩm này còn hàng không?", "inquiry.message"),
    shared.adminLink,
    shared.siteName
  ],
  general: [
    variable("recipientName", "Recipient name", "Tên người nhận", "Name of the email recipient", "Tên người nhận email", "Jordan Kim", "Nguyễn Minh", "recipient.name"),
    variable("senderName", "Sender name", "Tên người gửi", "Configured sender name", "Tên người gửi đã cấu hình", "Acme Team", "Đội ngũ Acme", "sender.name"),
    variable("replyMessage", "Reply message", "Nội dung trả lời", "Custom reply content", "Nội dung trả lời tùy chỉnh", "Thank you for contacting us.", "Cảm ơn bạn đã liên hệ.", "message.reply"),
    shared.adminLink,
    shared.siteName
  ]
};

export function normalizeTemplateCategory(value: string): EmailTemplateCategory {
  return EMAIL_TEMPLATE_CATEGORIES.includes(value as EmailTemplateCategory) ? value as EmailTemplateCategory : "general";
}

export function getTemplateVariables(category: string) {
  return EMAIL_TEMPLATE_VARIABLES[normalizeTemplateCategory(category)];
}

export function getSampleTemplateValues(category: string, language: VariableLanguage, customVariables: CustomEmailTemplateVariable[] = []) {
  const standard = Object.fromEntries(getTemplateVariables(category).map((item) => [item.key, item.sampleValue[language]]));
  const custom = Object.fromEntries(customVariables.map((item) => [item.key, item.sampleValue || (item.sourceType === "fixed" ? item.fixedValue : standard[item.sourceKey || ""]) || item.fallback || getMissingValueFallback(language)]));
  return { ...standard, ...custom };
}

export function getMissingValueFallback(language: VariableLanguage) {
  return language === "vi" ? "Chưa cung cấp" : "Not provided";
}

export function extractTemplateVariables(value: string) {
  return [...value.matchAll(/{{([^{}]+)}}/g)].map((match) => ({ key: match[1], syntax: match[0] }));
}

export function validateTemplateVariables(value: string, category: string, customVariables: CustomEmailTemplateVariable[] = []) {
  const allowed = new Set([...getTemplateVariables(category).map((item) => item.key), ...customVariables.map((item) => item.key)]);
  return extractTemplateVariables(value).filter((item, index, all) =>
    (!allowed.has(item.key) || !/^[A-Za-z][A-Za-z0-9]*$/.test(item.key)) && all.findIndex((candidate) => candidate.syntax === item.syntax) === index
  );
}

export function validateTemplateContent(subject: string, body: string, category: string, customVariables: CustomEmailTemplateVariable[] = []) {
  return validateTemplateVariables(`${subject}\n${body}`, category, customVariables);
}

export function renderRegisteredTemplate(value: string, category: string, values: Record<string, string | number | boolean | null | undefined>, fallback = "Not provided", customVariables: CustomEmailTemplateVariable[] = []) {
  const allowed = new Set(getTemplateVariables(category).map((item) => item.key));
  return value.replace(/{{([^{}]+)}}/g, (syntax, key: string) => {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(key)) return syntax;
    if (allowed.has(key)) {
      const resolved = values[key];
      return resolved === null || resolved === undefined || String(resolved).trim() === "" ? fallback : String(resolved);
    }
    const custom = customVariables.find((item) => item.key === key);
    if (!custom) return syntax;
    const resolved = custom.sourceType === "fixed" ? custom.fixedValue : values[custom.sourceKey || ""];
    return resolved === null || resolved === undefined || String(resolved).trim() === "" ? custom.fallback || fallback : String(resolved);
  });
}

export function suggestTemplateVariable(unknownKey: string, category: string, customVariables: CustomEmailTemplateVariable[] = []) {
  const normalized = unknownKey.trim();
  return [...getTemplateVariables(category).map((item) => item.key), ...customVariables.map((item) => item.key)]
    .map((key) => ({ key, distance: levenshtein(normalized.toLowerCase(), key.toLowerCase()) }))
    .sort((a, b) => a.distance - b.distance)[0]?.key ?? null;
}

export function normalizeCustomTemplateVariables(value: unknown): CustomEmailTemplateVariable[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    if (typeof source.key !== "string" || typeof source.label !== "string" || (source.sourceType !== "registered" && source.sourceType !== "fixed")) return [];
    return [{
      key: source.key,
      label: source.label,
      sourceType: source.sourceType,
      ...(typeof source.sourceKey === "string" ? { sourceKey: source.sourceKey } : {}),
      ...(typeof source.fixedValue === "string" ? { fixedValue: source.fixedValue } : {}),
      ...(typeof source.sampleValue === "string" ? { sampleValue: source.sampleValue } : {}),
      ...(typeof source.fallback === "string" ? { fallback: source.fallback } : {})
    }];
  });
}

function variable(key: string, labelEn: string, labelVi: string, descriptionEn: string, descriptionVi: string, sampleEn: string, sampleVi: string, resolverPath: string): EmailTemplateVariable {
  return { key, label: { en: labelEn, vi: labelVi }, description: { en: descriptionEn, vi: descriptionVi }, sampleValue: { en: sampleEn, vi: sampleVi }, resolverPath };
}

function levenshtein(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}
