import React, { useEffect, useState } from 'react';
import {
  LexicalComposer,
  InitialConfigType,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $getRoot, TextNode, $createParagraphNode, $createTextNode } from 'lexical';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import ToolbarPlugin from './ToolbarPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import './LexicalEditor.css';

interface LexicalEditorProps {
  onChange: (html: string) => void;
  initialValue?: string;
}

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
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
    nodes: [HeadingNode, TextNode, QuoteNode],
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
        <OnChangePlugin onChange={handleChange} />
      </div>
    </LexicalComposer>
  );
};

export default LexicalEditor;
