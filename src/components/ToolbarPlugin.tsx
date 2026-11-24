import React, { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $createParagraphNode,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  TextFormatType,
  ElementFormatType,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $getNearestNodeOfType } from '@lexical/utils';
import { $isHeadingNode } from '@lexical/rich-text';

// Icons as simple components
const IconBold = () => <strong>B</strong>;
const IconItalic = () => <em style={{ fontFamily: 'serif' }}>I</em>;
const IconUnderline = () => <span style={{ textDecoration: 'underline' }}>U</span>;
const IconStrikethrough = () => <span style={{ textDecoration: 'line-through' }}>S</span>;
const IconCode = () => <span style={{ fontFamily: 'monospace' }}>&lt;/&gt;</span>;
const IconSubscript = () => <span>X<sub>2</sub></span>;
const IconSuperscript = () => <span>X<sup>2</sup></span>;
const IconHighlight = () => <span style={{ backgroundColor: '#ffeb3b', padding: '0 2px' }}>H</span>;

const IconH1 = () => <span style={{ fontWeight: 'bold' }}>H1</span>;
const IconH2 = () => <span style={{ fontWeight: 'bold' }}>H2</span>;
const IconH3 = () => <span style={{ fontWeight: 'bold' }}>H3</span>;
const IconParagraph = () => <span>¶</span>;
const IconQuote = () => <span style={{ fontFamily: 'serif', fontSize: '1.2em' }}>"</span>;

const IconBulletList = () => <span>• ≡</span>;
const IconNumberList = () => <span>1. ≡</span>;

const IconAlignLeft = () => <span style={{ fontSize: '10px' }}>≡←</span>;
const IconAlignCenter = () => <span style={{ fontSize: '10px' }}>≡•</span>;
const IconAlignRight = () => <span style={{ fontSize: '10px' }}>→≡</span>;
const IconAlignJustify = () => <span style={{ fontSize: '10px' }}>≡≡</span>;

const IconLink = () => <span>🔗</span>;
const IconUndo = () => <span>↶</span>;
const IconRedo = () => <span>↷</span>;

const IconClear = () => <span>✕</span>;

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'quote' | 'ul' | 'ol';

const ToolbarPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  
  // Text format states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  
  // Block type state
  const [blockType, setBlockType] = useState<BlockType>('paragraph');
  
  // Link state
  const [isLink, setIsLink] = useState(false);
  
  // Undo/Redo states
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format states
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsHighlight(selection.hasFormat('highlight'));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type === 'bullet' ? 'ul' : 'ol');
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type as BlockType);
        }
      }

      // Update link state
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  // Text formatting
  const formatText = (formatType: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatType);
  };

  // Block formatting
  const formatHeading = (headingLevel: HeadingTagType) => {
    if (blockType !== headingLevel) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingLevel));
        }
      });
    }
  };

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  // Alignment
  const formatAlign = (alignment: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  // Link
  const insertLink = () => {
    if (!isLink) {
      const url = prompt('Enter URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  };

  // Clear formatting
  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.getType() === 'text') {
            (node as any).setFormat(0);
            (node as any).setStyle('');
          }
        });
      }
    });
  };

  return (
    <div className="toolbar">
      {/* Undo/Redo */}
      <div className="toolset">
        <button
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          disabled={!canUndo}
          className={!canUndo ? 'disabled' : ''}
          title="Undo"
        >
          <IconUndo />
        </button>
        <button
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          disabled={!canRedo}
          className={!canRedo ? 'disabled' : ''}
          title="Redo"
        >
          <IconRedo />
        </button>
      </div>

      {/* Text Formatting */}
      <div className="toolset">
        <button
          onClick={() => formatText('bold')}
          className={isBold ? 'active' : ''}
          title="Bold (Ctrl+B)"
        >
          <IconBold />
        </button>
        <button
          onClick={() => formatText('italic')}
          className={isItalic ? 'active' : ''}
          title="Italic (Ctrl+I)"
        >
          <IconItalic />
        </button>
        <button
          onClick={() => formatText('underline')}
          className={isUnderline ? 'active' : ''}
          title="Underline (Ctrl+U)"
        >
          <IconUnderline />
        </button>
        <button
          onClick={() => formatText('strikethrough')}
          className={isStrikethrough ? 'active' : ''}
          title="Strikethrough"
        >
          <IconStrikethrough />
        </button>
      </div>

      {/* Additional Text Formatting */}
      <div className="toolset">
        <button
          onClick={() => formatText('code')}
          className={isCode ? 'active' : ''}
          title="Inline Code"
        >
          <IconCode />
        </button>
        <button
          onClick={() => formatText('subscript')}
          className={isSubscript ? 'active' : ''}
          title="Subscript"
        >
          <IconSubscript />
        </button>
        <button
          onClick={() => formatText('superscript')}
          className={isSuperscript ? 'active' : ''}
          title="Superscript"
        >
          <IconSuperscript />
        </button>
        <button
          onClick={() => formatText('highlight')}
          className={isHighlight ? 'active' : ''}
          title="Highlight"
        >
          <IconHighlight />
        </button>
      </div>

      {/* Block Formatting */}
      <div className="toolset">
        <button
          onClick={formatParagraph}
          className={blockType === 'paragraph' ? 'active' : ''}
          title="Paragraph"
        >
          <IconParagraph />
        </button>
        <button
          onClick={() => formatHeading('h1')}
          className={blockType === 'h1' ? 'active' : ''}
          title="Heading 1"
        >
          <IconH1 />
        </button>
        <button
          onClick={() => formatHeading('h2')}
          className={blockType === 'h2' ? 'active' : ''}
          title="Heading 2"
        >
          <IconH2 />
        </button>
        <button
          onClick={() => formatHeading('h3')}
          className={blockType === 'h3' ? 'active' : ''}
          title="Heading 3"
        >
          <IconH3 />
        </button>
        <button
          onClick={formatQuote}
          className={blockType === 'quote' ? 'active' : ''}
          title="Block Quote"
        >
          <IconQuote />
        </button>
      </div>

      {/* Lists */}
      <div className="toolset">
        <button
          onClick={formatBulletList}
          className={blockType === 'ul' ? 'active' : ''}
          title="Bullet List"
        >
          <IconBulletList />
        </button>
        <button
          onClick={formatNumberedList}
          className={blockType === 'ol' ? 'active' : ''}
          title="Numbered List"
        >
          <IconNumberList />
        </button>
      </div>

      {/* Alignment */}
      <div className="toolset">
        <button onClick={() => formatAlign('left')} title="Align Left">
          <IconAlignLeft />
        </button>
        <button onClick={() => formatAlign('center')} title="Align Center">
          <IconAlignCenter />
        </button>
        <button onClick={() => formatAlign('right')} title="Align Right">
          <IconAlignRight />
        </button>
        <button onClick={() => formatAlign('justify')} title="Justify">
          <IconAlignJustify />
        </button>
      </div>

      {/* Link */}
      <div className="toolset">
        <button
          onClick={insertLink}
          className={isLink ? 'active' : ''}
          title="Insert Link"
        >
          <IconLink />
        </button>
      </div>

      {/* Clear Formatting */}
      <div className="toolset">
        <button onClick={clearFormatting} title="Clear Formatting">
          <IconClear />
        </button>
      </div>
    </div>
  );
};

export default ToolbarPlugin;
