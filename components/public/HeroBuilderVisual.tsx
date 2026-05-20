import { Blocks, Eye, Palette, ToggleRight } from "lucide-react";

const rows = [
  { icon: Blocks, title: "Homepage sections", text: "Hero, services, products, posts, contact CTA" },
  { icon: Palette, title: "Theme controls", text: "Colors, typography, header, footer, radius" },
  { icon: ToggleRight, title: "Publish workflow", text: "Draft, preview, publish, archive" },
  { icon: Eye, title: "Public rendering", text: "Only published content reaches visitors" }
];

export function HeroBuilderVisual() {
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
          return (
            <div className="builder-row" key={row.title}>
              <div className="builder-icon">
                <Icon size={20} />
              </div>
              <div>
                <strong>{row.title}</strong>
                <span>{row.text}</span>
              </div>
              <span className="badge">On</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
