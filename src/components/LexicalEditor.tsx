import React, { useEffect, useState } from 'react';
import {
  LexicalComposer,
  InitialConfigType,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { $generateHtmlFromNodes } from '@lexical/html';
import { TextNode } from 'lexical';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import ToolbarPlugin from './ToolbarPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import './LexicalEditor.css';

interface LexicalEditorProps {
  onChange: (html: string) => void;
  initialValue?: string;
}

// Full Lexical Theme Configuration
const theme = {
  // Root element
  root: "lex-root",
  
  // Text formatting
  text: {
    bold: "lex-text-bold",
    italic: "lex-text-italic",
    underline: "lex-text-underline",
    strikethrough: "lex-text-strikethrough",
    underlineStrikethrough: "lex-text-underline-strikethrough",
    subscript: "lex-text-subscript",
    superscript: "lex-text-superscript",
    code: "lex-text-code",
    highlight: "lex-text-highlight",
  },
  
  // Paragraph
  paragraph: "lex-paragraph",
  
  // Headings
  heading: {
    h1: "lex-heading-h1",
    h2: "lex-heading-h2",
    h3: "lex-heading-h3",
    h4: "lex-heading-h4",
    h5: "lex-heading-h5",
    h6: "lex-heading-h6",
  },
  
  // Quote/Blockquote
  quote: "lex-quote",
  
  // Lists
  list: {
    nested: {
      listitem: "lex-nested-listitem",
    },
    ol: "lex-list-ol",
    ul: "lex-list-ul",
    listitem: "lex-listitem",
    listitemChecked: "lex-listitem-checked",
    listitemUnchecked: "lex-listitem-unchecked",
  },
  
  // Code
  code: "lex-code",
  codeHighlight: {
    atrule: "lex-tokenAttr",
    attr: "lex-tokenAttr",
    boolean: "lex-tokenProperty",
    builtin: "lex-tokenSelector",
    cdata: "lex-tokenComment",
    char: "lex-tokenSelector",
    class: "lex-tokenFunction",
    "class-name": "lex-tokenFunction",
    comment: "lex-tokenComment",
    constant: "lex-tokenProperty",
    deleted: "lex-tokenProperty",
    doctype: "lex-tokenComment",
    entity: "lex-tokenOperator",
    function: "lex-tokenFunction",
    important: "lex-tokenVariable",
    inserted: "lex-tokenSelector",
    keyword: "lex-tokenAttr",
    namespace: "lex-tokenVariable",
    number: "lex-tokenProperty",
    operator: "lex-tokenOperator",
    prolog: "lex-tokenComment",
    property: "lex-tokenProperty",
    punctuation: "lex-tokenPunctuation",
    regex: "lex-tokenVariable",
    selector: "lex-tokenSelector",
    string: "lex-tokenSelector",
    symbol: "lex-tokenProperty",
    tag: "lex-tokenProperty",
    url: "lex-tokenOperator",
    variable: "lex-tokenVariable",
  },
  
  // Links
  link: "lex-link",
  
  // Tables
  table: "lex-table",
  tableCell: "lex-table-cell",
  tableCellHeader: "lex-table-cell-header",
  tableRow: "lex-table-row",
  tableAddColumns: "lex-table-add-columns",
  tableAddRows: "lex-table-add-rows",
  tableCellResizer: "lex-table-cell-resizer",
  tableCellSelected: "lex-table-cell-selected",
  tableCellPrimarySelected: "lex-table-cell-primary-selected",
  tableSelected: "lex-table-selected",
  
  // Image
  image: "lex-image",
  
  // Horizontal Rule
  hr: "lex-hr",
  
  // Layout
  layoutContainer: "lex-layout-container",
  layoutItem: "lex-layout-item",
  
  // Indent
  indent: "lex-indent",
  
  // Hashtag
  hashtag: "lex-hashtag",
  
  // Mark/Highlight
  mark: "lex-mark",
  markOverlap: "lex-mark-overlap",
  
  // Embeds
  embedBlock: {
    base: "lex-embed-block",
    focus: "lex-embed-block-focus",
  },
  
  // Character limit
  characterLimit: "lex-character-limit",
  
  // Autocomplete
  autocomplete: "lex-autocomplete",
};


const LexicalEditor: React.FC<LexicalEditorProps> = ({ onChange, initialValue }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  const handleChange = (editorState: any, editor: any) => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      onChange(htmlString);
    });
  };

  // Extract text content from HTML
  const getTextFromHtml = (html: string): string => {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const editorConfig: InitialConfigType = {
    namespace: 'MyEditor',
    theme,
    onError(error: Error) {
      throw error;
    },
    nodes: [
      HeadingNode,
      TextNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
    ],
    editorState: initialValue ? JSON.stringify({
      root: {
        children: [{
          children: [{
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: getTextFromHtml(initialValue),
            type: "text",
            version: 1
          }],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        }],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1
      }
    }) : undefined,
  };

  useEffect(() => {
    if (initialValue && !isInitialized) {
      // This will be handled by the editor's initial state
      setIsInitialized(true);
    }
  }, [initialValue, isInitialized]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          // placeholder={<div className="editor-placeholder">Enter some text...</div>}
          ErrorBoundary={LexicalErrorBoundary as any} // Type workaround
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleChange} />
      </div>
    </LexicalComposer>
  );
};

export default LexicalEditor;
