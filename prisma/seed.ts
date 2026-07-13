import { PrismaClient, PublishStatus } from "@prisma/client";
import { defaultHomeSections, defaultPosts, defaultProducts, defaultServices, defaultSite, defaultTeam } from "../config/default-site";
import { publicPages } from "../config/public-pages";
import { defaultTheme } from "../config/default-theme";
import { syncAuthorities } from "../lib/authority-sync";
import { defaultEmailTemplates } from "../modules/email/email.defaults";
import { getTemplateVariables } from "../modules/email/email.variables";

const prisma = new PrismaClient();

async function main() {
  await syncAuthorities(prisma);

  await prisma.role.upsert({
    where: { name: "Editor" },
    create: {
      name: "Editor",
      slug: "editor",
      description: "Content editor access",
      permissions: {
        "products.manage": true,
        "services.manage": true,
        "posts.manage": true,
        "team.manage": true,
        "footer.manage": true,
        "careers.manage": true,
        "media.manage": true,
        "inquiries.manage": true,
        "forms.manage": true,
        "leads.manage": true,
        "qa.manage": true
      }
    },
    update: { slug: "editor" }
  });

  await syncAuthorities(prisma);

  if (!(await prisma.siteSetting.findFirst())) {
    await prisma.siteSetting.create({ data: defaultSite });
  }

  if (!(await prisma.themeSetting.findFirst())) {
    await prisma.themeSetting.create({ data: defaultTheme });
  }

  const home = await prisma.page.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      title: "Home",
      slug: "home",
      status: PublishStatus.PUBLISHED,
      sections: {
        create: defaultHomeSections.map((section) => ({
          type: section.type,
          enabled: section.enabled,
          sortOrder: section.sortOrder,
          settings: section.settings
        }))
      }
    }
  });

  const sectionCount = await prisma.pageSection.count({ where: { pageId: home.id } });
  if (sectionCount === 0) {
    await prisma.pageSection.createMany({
      data: defaultHomeSections.map((section) => ({
        pageId: home.id,
        type: section.type,
        enabled: section.enabled,
        sortOrder: section.sortOrder,
        settings: section.settings
      }))
    });
  }

  for (const page of publicPages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        title: page.title,
        slug: page.slug,
        status: PublishStatus.PUBLISHED
      }
    });
  }

  for (const service of defaultServices) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: { ...service, status: PublishStatus.PUBLISHED }
    });
  }

  for (const product of defaultProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: { ...product, status: PublishStatus.PUBLISHED }
    });
  }

  for (const post of defaultPosts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        tagNames: ["cms", "website"],
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });
  }

  for (const [index, member] of defaultTeam.entries()) {
    const existing = await prisma.teamMember.findFirst({ where: { name: member.name } });
    if (!existing) {
      await prisma.teamMember.create({
        data: {
          ...member,
          sortOrder: index + 1,
          isVisible: true
        }
      });
    }
  }

  await seedAskQuestionForm();
  await seedEmailCenter();
}

async function seedEmailCenter() {
  await prisma.emailSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  for (const template of defaultEmailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { key_language: { key: template.key, language: template.language } },
      update: { variables: getTemplateVariables(template.category).map((item) => item.key) },
      create: {
        ...template,
        variables: getTemplateVariables(template.category).map((item) => item.key)
      }
    });
  }
  const templates = await prisma.emailTemplate.findMany({ select: { id: true, category: true } });
  for (const template of templates) {
    await prisma.emailTemplate.update({
      where: { id: template.id },
      data: { variables: getTemplateVariables(template.category).map((item) => item.key) }
    });
  }
}

async function seedAskQuestionForm() {
  const form = await prisma.form.upsert({
    where: { slug: "ask-a-question" },
    update: {},
    create: {
      name: "Ask a Question",
      slug: "ask-a-question",
      description: "Submit a question for the company team to review and answer.",
      status: PublishStatus.PUBLISHED,
      successMessage: "Thanks. Your question has been received.",
      sourceType: "qa",
      fields: {
        create: [
          {
            type: "text",
            label: "Name",
            key: "name",
            required: true,
            sortOrder: 0
          },
          {
            type: "email",
            label: "Email",
            key: "email",
            required: true,
            sortOrder: 1
          },
          {
            type: "text",
            label: "Question title",
            key: "questionTitle",
            required: true,
            sortOrder: 2
          },
          {
            type: "textarea",
            label: "Question",
            key: "question",
            required: true,
            sortOrder: 3
          },
          {
            type: "text",
            label: "Category",
            key: "category",
            required: false,
            sortOrder: 4
          }
        ]
      }
    }
  });

  const fieldCount = await prisma.formField.count({ where: { formId: form.id } });
  if (fieldCount > 0) return;

  await prisma.formField.createMany({
    data: [
      { formId: form.id, type: "text", label: "Name", key: "name", required: true, sortOrder: 0 },
      { formId: form.id, type: "email", label: "Email", key: "email", required: true, sortOrder: 1 },
      { formId: form.id, type: "text", label: "Question title", key: "questionTitle", required: true, sortOrder: 2 },
      { formId: form.id, type: "textarea", label: "Question", key: "question", required: true, sortOrder: 3 },
      { formId: form.id, type: "text", label: "Category", key: "category", required: false, sortOrder: 4 }
    ]
  });
}

main()
  .then(async () => {
    console.log("Seed data created.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
