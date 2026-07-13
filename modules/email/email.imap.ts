import "server-only";

import { ImapFlow } from "imapflow";
import { simpleParser, type AddressObject } from "mailparser";
import { EmailDirection, EmailStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptEmailSecret } from "@/lib/email-crypto";
import { resolvePublicHost } from "@/lib/outbound-host";
import { getEmailSettings } from "@/modules/email/email.service";

export async function testImapConnection() {
  const settings = await getEmailSettings();
  const client = await createImapClient(settings);
  await client.connect();
  try {
    await client.noop();
  } finally {
    await client.logout().catch(() => client.close());
  }
}

export async function syncImapInbox() {
  const settings = await getEmailSettings();
  const client = await createImapClient(settings);
  await client.connect();
  let imported = 0;
  let skipped = 0;

  try {
    const mailbox = await client.mailboxOpen("INBOX", { readOnly: true });
    const since = settings?.imapLastSyncAt
      ? new Date(settings.imapLastSyncAt.getTime() - 5 * 60_000)
      : new Date(Date.now() - 30 * 24 * 60 * 60_000);
    const found = await client.search({ since }, { uid: true });
    const uids = (found || []).slice(-100);

    for await (const item of client.fetch(uids, { uid: true, source: true, envelope: true, flags: true, internalDate: true }, { uid: true })) {
      if (!item.source) continue;
      const parsed = await simpleParser(item.source);
      const providerMessageId = parsed.messageId || item.envelope?.messageId || `imap:${settings?.imapHost}:${String(mailbox.uidValidity)}:${item.uid}`;
      const existing = await prisma.emailMessage.findFirst({ where: { providerMessageId }, select: { id: true } });
      if (existing) { skipped += 1; continue; }

      const references = Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [];
      const referenceIds = [parsed.inReplyTo, ...references].filter((value): value is string => Boolean(value));
      const related = referenceIds.length
        ? await prisma.emailMessage.findFirst({
            where: { direction: EmailDirection.OUTBOUND, providerMessageId: { in: referenceIds } },
            select: { relatedType: true, relatedId: true }
          })
        : null;
      const receivedAt = item.internalDate || parsed.date || new Date();

      await prisma.emailMessage.create({
        data: {
          direction: EmailDirection.INBOUND,
          status: EmailStatus.RECEIVED,
          fromEmail: firstAddress(parsed.from)?.address || null,
          fromName: firstAddress(parsed.from)?.name || null,
          toEmails: addresses(parsed.to),
          ccEmails: addresses(parsed.cc),
          subject: parsed.subject || "(No subject)",
          body: parsed.text || htmlToText(typeof parsed.html === "string" ? parsed.html : ""),
          bodyHtml: typeof parsed.html === "string" ? parsed.html : null,
          providerMessageId,
          inReplyTo: parsed.inReplyTo || null,
          referencesHeader: references.join(" ") || null,
          relatedType: related?.relatedType || null,
          relatedId: related?.relatedId || null,
          readAt: item.flags?.has("\\Seen") ? receivedAt : null,
          receivedAt,
          attachments: parsed.attachments.length
            ? parsed.attachments.map((attachment) => ({ filename: attachment.filename || "attachment", contentType: attachment.contentType, size: attachment.size, contentId: attachment.contentId }))
            : undefined,
          metadata: { source: "imap", uid: item.uid, mailbox: "INBOX" }
        }
      });
      imported += 1;
    }

    await prisma.emailSettings.update({ where: { id: "default" }, data: { imapLastSyncAt: new Date() } });
    return { imported, skipped, scanned: uids.length };
  } finally {
    await client.logout().catch(() => client.close());
  }
}

async function createImapClient(settings: Awaited<ReturnType<typeof getEmailSettings>>) {
  const host = settings?.imapHost;
  const port = settings?.imapPort || 993;
  const user = settings?.imapUsername;
  const password = decryptEmailSecret(settings?.imapPasswordEncrypted) || decryptEmailSecret(settings?.smtpPasswordEncrypted);
  if (!host || !user || !password) throw new Error("IMAP host, username, and password are required.");
  const endpoint = await resolvePublicHost(host);
  return new ImapFlow({
    host: endpoint.address,
    port,
    secure: settings?.imapSecure ?? true,
    servername: endpoint.hostname,
    auth: { user, pass: password },
    logger: false,
    socketTimeout: 30_000
  });
}

function addressObjects(value: AddressObject | AddressObject[] | undefined) {
  return value ? (Array.isArray(value) ? value : [value]) : [];
}

function firstAddress(value: AddressObject | AddressObject[] | undefined) {
  return addressObjects(value).flatMap((item) => item.value)[0];
}

function addresses(value: AddressObject | AddressObject[] | undefined) {
  return [...new Set(addressObjects(value).flatMap((item) => item.value.map((address) => address.address?.trim().toLowerCase())).filter((address): address is string => Boolean(address)))];
}

function htmlToText(value: string) {
  return value.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}
