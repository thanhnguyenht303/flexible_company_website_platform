import { Blocks, Eye, Palette, ToggleRight } from "lucide-react";
import { defaultLanguage, translate, type Language } from "@/lib/i18n/translations";

const rows = [
  { icon: Blocks, titleKey: "builder.visual.homepageSectionsTitle", textKey: "builder.visual.homepageSectionsText" },
  { icon: Palette, titleKey: "builder.visual.themeControlsTitle", textKey: "builder.visual.themeControlsText" },
  { icon: ToggleRight, titleKey: "builder.visual.publishWorkflowTitle", textKey: "builder.visual.publishWorkflowText" },
  { icon: Eye, titleKey: "builder.visual.publicRenderingTitle", textKey: "builder.visual.publicRenderingText" }
];

export function HeroBuilderVisual({ language = defaultLanguage }: { language?: Language }) {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-visual__bar">
        <span className="hero-visual__dot" />
        <span className="hero-visual__dot" />
        <span className="hero-visual__dot" />
      </div>
      <div className="hero-visual__body">
        {rows.map((row) => {
          const Icon = row.icon;
          const title = translate(language, row.titleKey);
          return (
            <div className="builder-row" key={row.titleKey}>
              <div className="builder-icon">
                <Icon size={20} />
              </div>
              <div>
                <strong>{title}</strong>
                <span>{translate(language, row.textKey)}</span>
              </div>
              <span className="badge">{translate(language, "builder.on")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
