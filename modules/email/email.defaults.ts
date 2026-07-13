export const defaultEmailTemplates = [
  {
    name: "Career application received notification",
    key: "career.application.received",
    category: "career",
    language: "en",
    subject: "New application for {{positionTitle}}",
    body: "A new application was received.\n\nApplicant: {{applicantName}}\nEmail: {{applicantEmail}}\nPhone: {{applicantPhone}}\nPosition: {{positionTitle}}\nSubmitted: {{applicationDate}}\n\n{{coverMessage}}\n\nReview: {{adminLink}}",
    variables: ["applicantName", "applicantEmail", "applicantPhone", "positionTitle", "applicationDate", "coverMessage", "adminLink"]
  },
  {
    name: "Career applicant accepted",
    key: "career.applicant.accepted",
    category: "career",
    language: "en",
    subject: "Next step for your {{positionTitle}} application",
    body: "Hi {{applicantName}},\n\nThank you for applying for the {{positionTitle}} position. We would like to move forward with your application. Please reply with your availability.\n\nBest regards,\n{{siteName}}",
    variables: ["applicantName", "positionTitle", "siteName"]
  },
  {
    name: "Career applicant rejected",
    key: "career.applicant.rejected",
    category: "career",
    language: "en",
    subject: "Update on your application for {{positionTitle}}",
    body: "Hi {{applicantName}},\n\nThank you for applying for the {{positionTitle}} position. After reviewing your application, we have decided not to move forward at this time.\n\nWe appreciate your interest and wish you success.\n\nBest regards,\n{{siteName}}",
    variables: ["applicantName", "positionTitle", "siteName"]
  },
  {
    name: "Interview invitation",
    key: "career.interview.invitation",
    category: "career",
    language: "en",
    subject: "Interview invitation for {{positionTitle}}",
    body: "Hi {{applicantName}},\n\nWe would like to invite you to interview for the {{positionTitle}} position. Please reply with your availability.\n\nBest regards,\n{{siteName}}",
    variables: ["applicantName", "positionTitle", "siteName"]
  },
  {
    name: "Request more information",
    key: "career.request.more-information",
    category: "career",
    language: "en",
    subject: "More information for your {{positionTitle}} application",
    body: "Hi {{applicantName}},\n\nWe are reviewing your application for {{positionTitle}} and need some additional information. Please reply to this email.\n\nBest regards,\n{{siteName}}",
    variables: ["applicantName", "positionTitle", "siteName"]
  },
  {
    name: "New form or lead notification",
    key: "form.submission.received",
    category: "form",
    language: "en",
    subject: "New {{sourceForm}} submission",
    body: "A new submission was received from {{sourceForm}}.\n\n{{submittedValues}}\n\nReview: {{adminLink}}",
    variables: ["sourceForm", "submittedValues", "adminLink"]
  },
  {
    name: "Contact message received",
    key: "contact.message.received",
    category: "contact",
    language: "en",
    subject: "New contact message from {{senderName}}",
    body: "Name: {{senderName}}\nEmail: {{senderEmail}}\nPhone: {{senderPhone}}\n\n{{message}}\n\nReview: {{adminLink}}",
    variables: ["senderName", "senderEmail", "senderPhone", "message", "adminLink"]
  },
  {
    name: "Q&A question received",
    key: "qa.question.received",
    category: "qa",
    language: "en",
    subject: "New question: {{questionTitle}}",
    body: "{{senderName}} submitted a question.\n\n{{question}}\n\nReview: {{adminLink}}",
    variables: ["senderName", "questionTitle", "question", "adminLink"]
  }
] as const;
