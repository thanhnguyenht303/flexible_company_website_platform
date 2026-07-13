"use client";

import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/public/LanguageProvider";
import {
  EMAIL_TEMPLATE_CATEGORIES,
  getMissingValueFallback,
  getSampleTemplateValues,
  getTemplateVariables,
  normalizeCustomTemplateVariables,
  renderRegisteredTemplate,
  suggestTemplateVariable,
  validateTemplateContent,
  type CustomEmailTemplateVariable
} from "@/modules/email/email.variables";

type Template = { id: string; name: string; key: string; category: string; language: string; subject: string; body: string; isActive: boolean; variables: unknown; customVariables: unknown; updatedAt: string | Date };
type EditingTemplate = Omit<Template, "variables" | "customVariables"> & { variables: string[]; customVariables: CustomEmailTemplateVariable[] };
const empty: EditingTemplate = { id: "", name: "", key: "", category: "general", language: "en", subject: "", body: "", isActive: true, variables: [], customVariables: [], updatedAt: "" };

export function EmailTemplateManager({ initialTemplates }: { initialTemplates: Template[] }) {
  const { language, t } = useLanguage();
  const [templates, setTemplates] = useState(initialTemplates);
  const [editing, setEditing] = useState<EditingTemplate>({ ...empty, variables: registryKeys("general", []) });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeEditor, setActiveEditor] = useState<"subject" | "body">("body");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const registeredVariables = useMemo(() => getTemplateVariables(editing.category), [editing.category]);
  const unknownVariables = useMemo(() => validateTemplateContent(editing.subject, editing.body, editing.category, editing.customVariables), [editing.subject, editing.body, editing.category, editing.customVariables]);
  const previewLanguage = editing.language === "vi" ? "vi" : "en";
  const sampleValues = useMemo(() => getSampleTemplateValues(editing.category, previewLanguage, editing.customVariables), [editing.category, previewLanguage, editing.customVariables]);
  const previewFallback = getMissingValueFallback(previewLanguage);
  const previewSubject = renderRegisteredTemplate(editing.subject, editing.category, sampleValues, previewFallback, editing.customVariables);
  const previewBody = renderRegisteredTemplate(editing.body, editing.category, sampleValues, previewFallback, editing.customVariables);

  function edit(template?: Template) {
    const customVariables = normalizeCustomTemplateVariables(template?.customVariables);
    const next: EditingTemplate = template
      ? { ...template, variables: registryKeys(template.category, customVariables), customVariables }
      : { ...empty, variables: registryKeys("general", []) };
    setEditing(next);
    setMessage("");
    setPreviewOpen(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (unknownVariables.length && !window.confirm(t("admin.email.guide.saveWithWarnings"))) return;
    setBusy(true); setMessage("");
    const response = await fetch(editing.id ? `/api/admin/email/templates/${editing.id}` : "/api/admin/email/templates", {
      method: editing.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, variables: registryKeys(editing.category, editing.customVariables) })
    });
    const result = await response.json();
    if (response.ok) {
      const saved = result.data;
      setTemplates((items) => editing.id ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved]);
      const savedCustomVariables = normalizeCustomTemplateVariables(saved.customVariables);
      setEditing({ ...saved, variables: registryKeys(saved.category, savedCustomVariables), customVariables: savedCustomVariables });
      setMessage(t("admin.email.guide.templateSaved"));
    } else setMessage(result.error?.message || t("admin.email.guide.templateSaveFailed"));
    setBusy(false);
  }

  async function remove(id: string) {
    if (!window.confirm(t("admin.email.guide.deleteConfirm"))) return;
    const response = await fetch(`/api/admin/email/templates/${id}`, { method: "DELETE" });
    if (response.ok) { setTemplates((items) => items.filter((item) => item.id !== id)); if (editing.id === id) edit(); }
  }

  function insertVariable(key: string) {
    const syntax = `{{${key}}}`;
    const ref = activeEditor === "subject" ? subjectRef.current : bodyRef.current;
    const current = activeEditor === "subject" ? editing.subject : editing.body;
    const start = ref?.selectionStart ?? current.length;
    const end = ref?.selectionEnd ?? current.length;
    const next = `${current.slice(0, start)}${syntax}${current.slice(end)}`;
    setEditing((value) => ({ ...value, [activeEditor]: next }));
    requestAnimationFrame(() => { ref?.focus(); ref?.setSelectionRange(start + syntax.length, start + syntax.length); });
  }

  async function copyVariable(key: string) {
    await navigator.clipboard.writeText(`{{${key}}}`);
    setMessage(t("admin.email.guide.variableCopied", { variable: `{{${key}}}` }));
  }

  function changeCategory(category: string) {
    const available = getTemplateVariables(category);
    const firstSource = available[0]?.key || "";
    const customVariables = editing.customVariables.map((item) => item.sourceType === "registered" ? { ...item, sourceKey: firstSource } : item);
    setEditing({ ...editing, category, customVariables, variables: registryKeys(category, customVariables) });
  }

  function setCustomVariables(customVariables: CustomEmailTemplateVariable[]) {
    setEditing({ ...editing, customVariables, variables: registryKeys(editing.category, customVariables) });
  }

  return <div className="email-template-workspace">
    <section className="admin-panel">
      <div className="admin-page-header"><h2>{t("admin.email.templates")}</h2><button className="button" type="button" onClick={() => edit()}>{t("admin.email.newTemplate")}</button></div>
      <div className="table-scroll"><table className="table"><thead><tr><th>{t("admin.email.templateName")}</th><th>{t("admin.email.category")}</th><th>{t("admin.email.language")}</th><th>{t("admin.common.status")}</th><th>{t("admin.common.actions")}</th></tr></thead><tbody>
        {templates.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><span className="table-secondary-line">{item.key}</span></td><td>{item.category}</td><td>{item.language.toUpperCase()}</td><td><span className={`badge ${item.isActive ? "badge--success" : "badge--muted"}`}>{item.isActive ? t("admin.email.active") : t("admin.email.guide.inactive")}</span></td><td><div className="table-actions"><button className="button secondary" type="button" onClick={() => edit(item)}>{t("admin.common.edit")}</button><button className="button danger" type="button" onClick={() => remove(item.id)}>{t("admin.common.delete")}</button></div></td></tr>)}
      </tbody></table></div>
    </section>

    <div className="email-template-editor-layout">
      <form className="admin-panel email-template-editor" onSubmit={submit}>
        <div className="admin-page-header"><div><h2>{editing.id ? t("admin.common.edit") : t("admin.email.newTemplate")}</h2><p className="message">{t("admin.email.guide.editorIntro")}</p></div><button className="button secondary" type="button" onClick={() => setPreviewOpen((value) => !value)}>{t("admin.email.guide.previewSample")}</button></div>
        <div className="form-grid">
          <label><span>{t("admin.email.templateName")}</span><input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required /></label>
          <label><span>{t("admin.email.templateKey")}</span><input value={editing.key} onChange={(event) => setEditing({ ...editing, key: event.target.value })} pattern="[a-z0-9][a-z0-9._-]*" required /></label>
          <label><span>{t("admin.email.category")}</span><select value={editing.category} onChange={(event) => changeCategory(event.target.value)}>{EMAIL_TEMPLATE_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>{t("admin.email.language")}</span><select value={editing.language} onChange={(event) => setEditing({ ...editing, language: event.target.value })}><option value="en">English</option><option value="vi">Tiếng Việt</option></select></label>
          <label className="checkbox-row"><input type="checkbox" checked={editing.isActive} onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })} /> {t("admin.email.active")}</label>
          <div className="form-grid__wide"><CustomVariableBuilder category={editing.category} language={language} variables={editing.customVariables} onChange={setCustomVariables} t={t} /></div>
          <label className="form-grid__wide"><span>{t("admin.email.subject")}</span><input ref={subjectRef} value={editing.subject} onFocus={() => setActiveEditor("subject")} onChange={(event) => setEditing({ ...editing, subject: event.target.value })} required /></label>
          <label className="form-grid__wide"><span>{t("admin.email.body")}</span><textarea ref={bodyRef} rows={16} value={editing.body} onFocus={() => setActiveEditor("body")} onChange={(event) => setEditing({ ...editing, body: event.target.value })} required /></label>
        </div>

        {unknownVariables.length ? <div className="email-variable-warnings" role="alert"><strong>{t("admin.email.guide.fixWarnings")}</strong>{unknownVariables.map((item) => { const suggestion = suggestTemplateVariable(item.key, editing.category, editing.customVariables); return <p key={item.syntax}>{t("admin.email.guide.unknownMessage", { variable: item.syntax })}{suggestion ? ` ${t("admin.email.guide.didYouMean", { variable: `{{${suggestion}}}` })}` : ""}</p>; })}</div> : <p className="email-variable-valid" role="status">{t("admin.email.guide.allVariablesValid")}</p>}

        {previewOpen ? <section className="email-template-preview" aria-live="polite"><h3>{t("admin.email.guide.previewSample")}</h3><div className="email-preview-grid"><div><strong>{t("admin.email.guide.originalTemplate")}</strong><h4>{editing.subject || t("admin.email.guide.noSubject")}</h4><pre>{editing.body || t("admin.email.guide.noBody")}</pre></div><div><strong>{t("admin.email.guide.renderedEmail")}</strong><h4>{previewSubject || t("admin.email.guide.noSubject")}</h4><pre>{previewBody || t("admin.email.guide.noBody")}</pre></div></div></section> : null}

        <div className="form-actions"><button className="button" disabled={busy}>{busy ? t("admin.common.saving") : t("admin.common.save")}</button></div>{message ? <p className="message" role="status">{message}</p> : null}
      </form>

      <aside className="email-template-help">
        <section className="admin-panel"><h2>{t("admin.email.guide.availableVariables")}</h2><p className="message">{t("admin.email.guide.insertTarget", { target: activeEditor === "subject" ? t("admin.email.subject") : t("admin.email.body") })}</p><div className="email-variable-list">{registeredVariables.map((item) => <div className="email-variable-card" key={item.key}><div><code>{`{{${item.key}}}`}</code><strong>{item.label[language]}</strong><small>{item.description[language]}</small><span>{`→ ${item.resolverPath}`}</span></div><VariableActions variableKey={item.key} insertVariable={insertVariable} copyVariable={copyVariable} t={t} /></div>)}{editing.customVariables.map((item) => <div className="email-variable-card email-variable-card--custom" key={item.key}><div><code>{`{{${item.key}}}`}</code><strong>{item.label}</strong><small>{t("admin.email.guide.customVariable")}</small><span>{item.sourceType === "fixed" ? `→ ${t("admin.email.guide.fixedText")}` : `→ {{${item.sourceKey}}}`}</span></div><VariableActions variableKey={item.key} insertVariable={insertVariable} copyVariable={copyVariable} t={t} /></div>)}</div></section>
        <TemplateWritingGuide t={t} />
      </aside>
    </div>
  </div>;
}

function CustomVariableBuilder({ category, language, variables, onChange, t }: { category: string; language: "en" | "vi"; variables: CustomEmailTemplateVariable[]; onChange: (variables: CustomEmailTemplateVariable[]) => void; t: (key: string, values?: Record<string, string | number>) => string }) {
  const sources = getTemplateVariables(category);
  function addVariable() {
    const used = new Set([...sources.map((item) => item.key), ...variables.map((item) => item.key)]);
    let index = variables.length + 1;
    while (used.has(`customVariable${index}`)) index += 1;
    onChange([...variables, { key: `customVariable${index}`, label: t("admin.email.guide.customVariable"), sourceType: "registered", sourceKey: sources[0]?.key || "", sampleValue: "", fallback: "" }]);
  }
  function update(index: number, patch: Partial<CustomEmailTemplateVariable>) { onChange(variables.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }
  function remove(index: number) { onChange(variables.filter((_item, itemIndex) => itemIndex !== index)); }

  return <details className="email-custom-variables" open><summary><strong>{t("admin.email.guide.customVariablesTitle")}</strong><span className="badge badge--neutral">{variables.length}</span></summary><div>
    <p className="message">{t("admin.email.guide.customVariablesIntro")}</p>
    <div className="email-custom-variable-list">{variables.map((item, index) => <fieldset className="email-custom-variable" key={`${item.key}-${index}`}><legend>{`{{${item.key}}}`}</legend><div className="form-grid">
      <label><span>{t("admin.email.guide.variableKey")}</span><input value={item.key} pattern="[A-Za-z][A-Za-z0-9]*" onChange={(event) => update(index, { key: event.target.value })} required /><small className="message">{t("admin.email.guide.variableKeyHelp")}</small></label>
      <label><span>{t("admin.email.guide.variableLabel")}</span><input value={item.label} onChange={(event) => update(index, { label: event.target.value })} required /></label>
      <label><span>{t("admin.email.guide.assignmentType")}</span><select value={item.sourceType} onChange={(event) => update(index, event.target.value === "fixed" ? { sourceType: "fixed", sourceKey: "" } : { sourceType: "registered", sourceKey: sources[0]?.key || "", fixedValue: "" })}><option value="registered">{t("admin.email.guide.relatedRecordField")}</option><option value="fixed">{t("admin.email.guide.fixedText")}</option></select></label>
      {item.sourceType === "registered" ? <label><span>{t("admin.email.guide.assignFrom")}</span><select value={item.sourceKey || ""} onChange={(event) => update(index, { sourceKey: event.target.value })} required>{sources.map((source) => <option value={source.key} key={source.key}>{source.label[language]} — {`{{${source.key}}}`}</option>)}</select></label> : <label><span>{t("admin.email.guide.fixedValue")}</span><input value={item.fixedValue || ""} onChange={(event) => update(index, { fixedValue: event.target.value })} required /></label>}
      <label><span>{t("admin.email.guide.sampleValue")}</span><input value={item.sampleValue || ""} onChange={(event) => update(index, { sampleValue: event.target.value })} /></label>
      <label><span>{t("admin.email.guide.customFallback")}</span><input value={item.fallback || ""} onChange={(event) => update(index, { fallback: event.target.value })} /></label>
    </div><button className="button danger" type="button" onClick={() => remove(index)}>{t("admin.email.guide.removeVariable")}</button></fieldset>)}</div>
    <button className="button secondary" type="button" onClick={addVariable}>{t("admin.email.guide.addVariable")}</button>
  </div></details>;
}

function VariableActions({ variableKey, insertVariable, copyVariable, t }: { variableKey: string; insertVariable: (key: string) => void; copyVariable: (key: string) => Promise<void>; t: (key: string, values?: Record<string, string | number>) => string }) {
  return <div><button className="button secondary" type="button" onClick={() => insertVariable(variableKey)}>{t("admin.email.guide.insertVariable")}</button><button className="icon-button" type="button" aria-label={`${t("admin.email.guide.copyVariable")} {{${variableKey}}}`} title={t("admin.email.guide.copyVariable")} onClick={() => copyVariable(variableKey)}>⧉</button></div>;
}

function TemplateWritingGuide({ t }: { t: (key: string, values?: Record<string, string | number>) => string }) {
  return <details className="admin-panel email-template-guide" open><summary><strong>{t("admin.email.guide.title")}</strong></summary><div>
    <p>{t("admin.email.guide.whatVariablesAre")}</p>
    <div className="email-guide-example"><span>{t("admin.email.guide.templateExample")}</span><code>{"Hi {{applicantName}},"}</code><span>→</span><code>{t("admin.email.guide.renderedExample")}</code></div>
    <div className="email-guide-warning"><strong>{t("admin.email.guide.exactTitle")}</strong><p>{t("admin.email.guide.exactExplanation")}</p></div>
    <h3>{t("admin.email.guide.variableRules")}</h3><ul>{[1,2,3,4,5].map((step) => <li key={step}>{t(`admin.email.guide.rule${step}`)}</li>)}</ul>
    <div className="email-guide-validity"><div><strong>{t("admin.email.guide.valid")}</strong><code>{"{{applicantName}}"}</code><code>{"{{positionTitle}}"}</code></div><div><strong>{t("admin.email.guide.invalid")}</strong><code>{"{{NameofApplicant}}"}</code><code>{"{{ applicantName }}"}</code></div></div>
    <h3>{t("admin.email.guide.howValuesWork")}</h3><p>{t("admin.email.guide.mappingExplanation")}</p>
    <h3>{t("admin.email.guide.missingValue")}</h3><p>{t("admin.email.guide.missingExplanation")}</p>
    <h3>{t("admin.email.guide.customVariablesTitle")}</h3><p>{t("admin.email.guide.customGuideIntro")}</p><ol>{[1,2,3,4,5,6].map((step) => <li key={step}>{t(`admin.email.guide.customStep${step}`)}</li>)}</ol><div className="email-guide-example"><code>{"{{NameofApplicant}} → {{applicantName}}"}</code><code>{"{{supportPhone}} → 312-555-0100"}</code></div>
    <h3>{t("admin.email.guide.stepsTitle")}</h3><ol>{[1,2,3,4,5,6,7,8,9].map((step) => <li key={step}>{t(`admin.email.guide.step${step}`)}</li>)}</ol>
  </div></details>;
}

function registryKeys(category: string, customVariables: CustomEmailTemplateVariable[]) { return [...getTemplateVariables(category).map((item) => item.key), ...customVariables.map((item) => item.key)]; }
