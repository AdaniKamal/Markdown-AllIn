const sampleMarkdown = `# Markdown Studio

Use this space to preview Markdown.

## What you can do

- Upload a Markdown file
- Paste Markdown text
- Write with live preview
- Generate a heading tree

## Example Table

| Syntax | Output |
| --- | --- |
| **bold** | Bold text |
| *italic* | Italic text |

> A good README is a map, not just decoration.
`;

const wikiItems = [
  {
    title: "Heading",
    description: "Use # for headings. More # means smaller heading.",
    example: "# H1 Title\n## H2 Section\n### H3 Detail"
  },
  {
    title: "Bold",
    description: "Wrap words with two asterisks.",
    example: "**important text**"
  },
  {
    title: "Italic",
    description: "Wrap words with one asterisk.",
    example: "*soft emphasis*"
  },
  {
    title: "Point Form",
    description: "Use dash for bullet points.",
    example: "- First point\n- Second point\n- Third point"
  },
  {
    title: "Numbering",
    description: "Use numbers when order matters.",
    example: "1. Plan\n2. Build\n3. Review"
  },
  {
    title: "Quote",
    description: "Use > for quotes or callouts.",
    example: "> This is a quote."
  },
  {
    title: "Inline Code",
    description: "Use backticks for commands, filenames, or code terms.",
    example: "`npm run build`"
  },
  {
    title: "Code Block",
    description: "Use triple backticks for longer code.",
    example: "```js\nconsole.log('hello');\n```"
  },
  {
    title: "Table",
    description: "Use pipes and a separator row.",
    example: "| Name | Role |\n| --- | --- |\n| Dani | Analyst |"
  },
  {
    title: "Link",
    description: "Use square brackets for text and parentheses for URL.",
    example: "[GitHub](https://github.com/)"
  },
  {
    title: "Checklist",
    description: "Use brackets to show task progress.",
    example: "- [x] Draft\n- [ ] Review"
  },
  {
    title: "Divider",
    description: "Use three dashes to separate sections.",
    example: "---"
  }
];

const viewerInput = document.querySelector("#viewerInput");
const viewerPreview = document.querySelector("#viewerPreview");
const viewerStatus = document.querySelector("#viewerStatus");
const editorInput = document.querySelector("#editorInput");
const editorPreview = document.querySelector("#editorPreview");
const treeInput = document.querySelector("#treeInput");
const treeOutput = document.querySelector("#treeOutput");
const wordCount = document.querySelector("#wordCount");
const wikiGrid = document.querySelector("#wikiGrid");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return text;
}

function isTableStart(lines, index) {
  const current = lines[index] || "";
  const next = lines[index + 1] || "";
  return current.includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(next);
}

function parseTable(lines, startIndex) {
  const rows = [];
  let index = startIndex;

  while (index < lines.length && lines[index].includes("|") && lines[index].trim() !== "") {
    rows.push(lines[index]);
    index += 1;
  }

  const header = rows[0];
  const body = rows.slice(2);
  const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => inlineMarkdown(cell.trim()));
  const headHtml = cells(header).map((cell) => `<th>${cell}</th>`).join("");
  const bodyHtml = body.map((row) => `<tr>${cells(row).map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");

  return {
    html: `<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`,
    nextIndex: index
  };
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed === "") {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      html.push(`<pre><code data-language="${escapeHtml(language)}">${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (isTableStart(lines, index)) {
      const table = parseTable(lines, index);
      html.push(table.html);
      index = table.nextIndex;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      html.push(`<blockquote>${quote.map(inlineMarkdown).join("<br>")}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^[-*]\s+\[[ xX]\]\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        const item = lines[index].trim().replace(/^[-*]\s+/, "");
        const checkbox = item.match(/^\[([ xX])\]\s+(.+)$/);
        if (checkbox) {
          const checked = checkbox[1].toLowerCase() === "x" ? " checked" : "";
          items.push(`<li><input type="checkbox" disabled${checked}> ${inlineMarkdown(checkbox[2])}</li>`);
        } else {
          items.push(`<li>${inlineMarkdown(item)}</li>`);
        }
        index += 1;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(`<li>${inlineMarkdown(lines[index].trim().replace(/^\d+\.\s+/, ""))}</li>`);
        index += 1;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      html.push("<hr>");
      index += 1;
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !/^(#{1,6})\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !/^>\s?/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith("```") &&
      !isTableStart(lines, index)
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
  }

  return html.join("");
}

function buildTree(markdown) {
  const headings = markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{1,6})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      level: match[1].length,
      title: match[2].replace(/[*_`]/g, "").trim()
    }));

  if (!headings.length) {
    return "No headings found yet.\n\nAdd headings like:\n# Main title\n## Section\n### Detail";
  }

  const roots = [];
  const stack = [];

  headings.forEach((heading) => {
    const node = { ...heading, children: [] };

    while (stack.length && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length) {
      stack[stack.length - 1].children.push(node);
    } else {
      roots.push(node);
    }

    stack.push(node);
  });

  function drawNode(node, prefix = "", isLast = true, isRoot = false) {
    const connector = isRoot ? "" : isLast ? "└── " : "├── ";
    const lines = [`${prefix}${connector}${node.title}`];
    const childPrefix = isRoot ? "" : `${prefix}${isLast ? "    " : "│   "}`;

    node.children.forEach((child, childIndex) => {
      lines.push(...drawNode(child, childPrefix, childIndex === node.children.length - 1));
    });

    return lines;
  }

  if (roots.length === 1) {
    return drawNode(roots[0], "", true, true).join("\n");
  }

  const lines = ["Markdown Document"];
  roots.forEach((root, rootIndex) => {
    lines.push(...drawNode(root, "", rootIndex === roots.length - 1));
  });
  return lines.join("\n");
}

function updateEditor() {
  const markdown = editorInput.value;
  editorPreview.innerHTML = renderMarkdown(markdown);
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
}

function updateTree() {
  treeOutput.textContent = buildTree(treeInput.value);
}

function insertAtCursor(textarea, before, after = "", placeholder = "text") {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;
  const replacement = `${before}${selected}${after}`;
  textarea.setRangeText(replacement, start, end, "end");
  textarea.focus();
  updateEditor();
}

function insertBlock(textarea, block) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const prefix = start > 0 && textarea.value[start - 1] !== "\n" ? "\n" : "";
  const suffix = end < textarea.value.length && textarea.value[end] !== "\n" ? "\n" : "";
  textarea.setRangeText(`${prefix}${block}${suffix}`, start, end, "end");
  textarea.focus();
  updateEditor();
}

editorInput.addEventListener("input", updateEditor);
treeInput.addEventListener("input", updateTree);

document.querySelector("#loadEditorTree").addEventListener("click", () => {
  treeInput.value = editorInput.value;
  updateTree();
  treeInput.focus();
});

document.querySelector("#renderViewer").addEventListener("click", () => {
  viewerPreview.innerHTML = renderMarkdown(viewerInput.value);
  viewerStatus.textContent = "Rendered";
});

document.querySelector("#clearViewer").addEventListener("click", () => {
  viewerInput.value = "";
  viewerPreview.innerHTML = "";
  viewerStatus.textContent = "Cleared";
});

document.querySelector("#fileInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    viewerInput.value = reader.result;
    viewerPreview.innerHTML = renderMarkdown(viewerInput.value);
    viewerStatus.textContent = file.name;
  });
  reader.readAsText(file);
});

document.querySelector(".toolbar").addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  if (!action) return;

  const actions = {
    heading1: () => insertBlock(editorInput, "# Heading 1\n"),
    heading2: () => insertBlock(editorInput, "## Heading 2\n"),
    heading3: () => insertBlock(editorInput, "### Heading 3\n"),
    bold: () => insertAtCursor(editorInput, "**", "**", "bold text"),
    italic: () => insertAtCursor(editorInput, "*", "*", "italic text"),
    quote: () => insertBlock(editorInput, "> Quote here\n"),
    bullet: () => insertBlock(editorInput, "- First point\n- Second point\n"),
    number: () => insertBlock(editorInput, "1. First item\n2. Second item\n"),
    code: () => insertAtCursor(editorInput, "`", "`", "code"),
    table: () => insertBlock(editorInput, "| Column A | Column B |\n| --- | --- |\n| Value | Value |\n"),
    link: () => insertAtCursor(editorInput, "[", "](https://example.com)", "link text")
  };

  actions[action]();
});

document.querySelector("#copyMarkdown").addEventListener("click", async () => {
  await navigator.clipboard.writeText(editorInput.value);
});

document.querySelector("#copyTree").addEventListener("click", async () => {
  await navigator.clipboard.writeText(treeOutput.textContent);
});

function renderWiki() {
  wikiGrid.innerHTML = wikiItems.map((item) => `
    <article class="wiki-card">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <pre><code>${escapeHtml(item.example)}</code></pre>
    </article>
  `).join("");
}

viewerInput.value = sampleMarkdown;
viewerPreview.innerHTML = renderMarkdown(sampleMarkdown);
editorInput.value = sampleMarkdown;
treeInput.value = sampleMarkdown;
renderWiki();
updateEditor();
updateTree();
