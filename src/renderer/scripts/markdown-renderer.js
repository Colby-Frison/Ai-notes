/**
 * Markdown Renderer
 * 
 * Provides utilities for rendering markdown content with proper formatting
 * using the marked library.
 */

// Import required libraries - use require for Electron compatibility
const marked = require('marked');
const hljs = require('highlight.js');

/**
 * Configure and initialize the marked parser
 */
function initializeMarked() {
  // Create custom renderer
  const renderer = {
    heading(text, level, raw) {
      const id = raw.toLowerCase().replace(/[^\w]+/g, '-');
      return `
        <h${level} id="${id}" class="md-heading md-heading-${level}">
          ${text}
        </h${level}>
      `;
    },
    
    paragraph(text) {
      return `<p>${text}</p>`;
    },
    
    list(body, ordered, start) {
      const type = ordered ? 'ol' : 'ul';
      const startAttr = (ordered && start !== 1) ? ` start="${start}"` : '';
      return `<${type}${startAttr} class="md-list">${body}</${type}>`;
    },
    
    listitem(text, task, checked) {
      if (task) {
        return `<li class="task-list-item"><input type="checkbox" ${checked ? 'checked' : ''} disabled> ${text}</li>`;
      }
      return `<li>${text}</li>`;
    },
    
    codespan(code) {
      return `<code class="inline-code">${code}</code>`;
    },
    
    code(code, language) {
      const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
      const highlightedCode = hljs.highlight(code, { language: validLanguage }).value;
      
      return `
        <pre><code class="hljs language-${validLanguage}">${highlightedCode}</code></pre>
      `;
    },
    
    blockquote(quote) {
      return `<blockquote class="md-blockquote">${quote}</blockquote>`;
    },
    
    link(href, title, text) {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    
    image(href, title, text) {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}" alt="${text}"${titleAttr} class="md-image">`;
    },
    
    strong(text) {
      return `<strong>${text}</strong>`;
    },
    
    em(text) {
      return `<em>${text}</em>`;
    },
    
    table(header, body) {
      return `
        <table class="md-table">
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      `;
    },
    
    tablerow(content) {
      return `<tr>${content}</tr>`;
    },
    
    tablecell(content, { header, align }) {
      const tag = header ? 'th' : 'td';
      const alignAttr = align ? ` style="text-align: ${align}"` : '';
      return `<${tag}${alignAttr}>${content}</${tag}>`;
    },
    
    hr() {
      return `<hr class="md-hr">`;
    },
    
    checkbox(checked) {
      return `<input type="checkbox" ${checked ? 'checked' : ''} disabled>`;
    }
  };

  // Set marked options
  marked.use({
    renderer,
    headerIds: true,
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    mangle: false,
    headerPrefix: '',
    xhtml: false,
    baseUrl: null,
    highlight: function(code, lang) {
      try {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        } else {
          return hljs.highlightAuto(code).value;
        }
      } catch (e) {
        console.error('Error highlighting code:', e);
        return code;
      }
    }
  });
}

// Initialize marked when this module is imported
initializeMarked();

/**
 * Preprocess markdown to fix common issues
 * @param {string} text - Raw markdown text
 * @returns {string} - Preprocessed markdown text
 */
function preprocessMarkdown(text) {
  if (!text) return '';
  
  // Normalize line endings
  let processed = text.replace(/\r\n/g, '\n');
  
  // Ensure proper spacing for list items
  processed = processed.replace(/^( *)([*+-])\s+/gm, (match, spaces, bullet) => {
    // Calculate the correct indentation
    const indentLevel = Math.floor(spaces.length / 2);
    return `${' '.repeat(indentLevel * 2)}${bullet} `;
  });
  
  // Add spacing before headers
  processed = processed.replace(/^(#{1,6})\s+/gm, (match, hashes) => {
    if (!/\n$/.test(processed)) {
      return `\n${hashes} `;
    }
    return match;
  });
  
  return processed;
}

/**
 * Render markdown content to HTML
 * @param {string} markdownContent - The markdown content to render
 * @returns {string} The rendered HTML
 */
export function renderMarkdown(markdownContent) {
  if (!markdownContent) {
    return '';
  }
  
  try {
    // Preprocess the markdown
    const processedMarkdown = preprocessMarkdown(markdownContent);
    
    // Parse the markdown
    const html = marked.parse(processedMarkdown);
    
    return html;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return `<div class="markdown-error">Error rendering markdown: ${error.message}</div>`;
  }
}

/**
 * Update the content of a markdown preview element
 * @param {HTMLElement} previewElement - The element to update
 * @param {string} markdownContent - The markdown content to render
 */
export function updateMarkdownPreview(previewElement, markdownContent) {
  if (!previewElement) {
    console.error('No preview element provided');
    return;
  }
  
  try {
    const html = renderMarkdown(markdownContent);
    previewElement.innerHTML = html;
  } catch (error) {
    console.error('Error updating markdown preview:', error);
    previewElement.innerHTML = `<div class="markdown-error">Error rendering markdown: ${error.message}</div>`;
  }
}

export default {
  renderMarkdown,
  updateMarkdownPreview
}; 