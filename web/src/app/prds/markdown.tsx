const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; text: string };

export const parseMarkdown = (markdown: string): Block[] => {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "code", text: codeLines.join("\n") });
      i += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "heading", level: 3, text: line.slice(4).trim() });
      i += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", level: 2, text: line.slice(3).trim() });
      i += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ type: "heading", level: 1, text: line.slice(2).trim() });
      i += 1;
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = lines[i].trim();
        if (!(itemLine.startsWith("- ") || itemLine.startsWith("* "))) break;
        items.push(itemLine.replace(/^[-*]\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next) break;
      if (
        next.startsWith("# ") ||
        next.startsWith("## ") ||
        next.startsWith("### ") ||
        next.startsWith("- ") ||
        next.startsWith("* ") ||
        next.startsWith("```")
      ) {
        break;
      }
      paragraphLines.push(next);
      i += 1;
    }
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
    } else {
      i += 1;
    }
  }

  return blocks;
};

export const renderMarkdown = (markdown: string) => {
  const blocks = parseMarkdown(markdown);
  let counter = 0;

  return blocks.map((block) => {
    counter += 1;
    if (block.type === "heading") {
      const Heading = `h${block.level}` as "h1" | "h2" | "h3";
      return <Heading key={`h-${counter}`}>{block.text}</Heading>;
    }
    if (block.type === "list") {
      return (
        <ul key={`ul-${counter}`}>
          {block.items.map((item, index) => (
            <li key={`li-${counter}-${index}`}>{item}</li>
          ))}
        </ul>
      );
    }
    if (block.type === "code") {
      return (
        <pre key={`pre-${counter}`}>
          <code dangerouslySetInnerHTML={{ __html: escapeHtml(block.text) }} />
        </pre>
      );
    }
    return <p key={`p-${counter}`}>{block.text}</p>;
  });
};
