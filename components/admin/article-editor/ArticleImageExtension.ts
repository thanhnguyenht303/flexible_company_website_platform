import { mergeAttributes, Node } from "@tiptap/core";

export const ArticleImageExtension = Node.create({
  name: "articleImage",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" }
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-article-image]",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const image = element.querySelector("img");
          return {
            src: image?.getAttribute("src") ?? "",
            alt: image?.getAttribute("alt") ?? "",
            caption: element.querySelector("figcaption")?.textContent ?? ""
          };
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const caption = typeof HTMLAttributes.caption === "string" ? HTMLAttributes.caption : "";
    const figureChildren: unknown[] = [
      [
        "img",
        mergeAttributes({
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt ?? "",
          draggable: "false"
        })
      ]
    ];

    if (caption) figureChildren.push(["figcaption", {}, caption]);

    return ["figure", { "data-article-image": "" }, ...figureChildren] as never;
  }
});
