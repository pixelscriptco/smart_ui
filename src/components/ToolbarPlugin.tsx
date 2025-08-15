import React,{ useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, $createParagraphNode } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode} from '@lexical/rich-text';
import { $wrapNodes } from '@lexical/selection';
import { $patchStyleText } from '@lexical/selection';

const ToolbarPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [blockType, setBlockType] = useState<string>('');

  const updateToolbar = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const formats: string[] = [];
        if (selection.hasFormat('bold')) formats.push('bold');
        if (selection.hasFormat('italic')) formats.push('italic');
        if (selection.hasFormat('underline')) formats.push('underline');
        
        setActiveFormats(formats);
        
        const anchorNode = selection.anchor.getNode();
        const topNode = anchorNode.getTopLevelElementOrThrow();
        setBlockType(topNode.getType());
      }
    });
  };

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      updateToolbar();
    });
  }, [editor]);

  const isActive = (format: string) => activeFormats.includes(format);

  const formatText = (formatType: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatType);
  };

  const applyHeading = (tag: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };
  
  const formatHeading = (headingLevel: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () =>
          $createHeadingNode(headingLevel)
        );
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  return (
    <div className="toolbar">
      <div className='toolset'>
        <button onClick={() => formatText('bold')} className={isActive('bold') ? 'active' : ''}><strong>B</strong></button>
        <button onClick={() => formatText('italic')} className={isActive('italic') ? 'active' : ''}><strong><i>I</i></strong></button>
        <button onClick={() => formatText('underline')} className={isActive('underline') ? 'active' : ''}><strong><u>U</u></strong></button>
      </div>
      <div className='toolset'>
        <button onClick={() => formatHeading('h1')} className={blockType === 'heading' ? 'active' : ''}><strong>H1</strong></ button>
        <button onClick={() => formatHeading('h2')} className={blockType === 'heading' ? 'active' : ''}><strong>H2</strong></button>
        <button onClick={() => formatHeading('h3')} className={blockType === 'heading' ? 'active' : ''}><strong>H3</strong></button>
        <button onClick={formatParagraph} className={blockType === 'paragraph' ? 'active' : ''}><strong>p</strong></button>
      </div>
    </div>
  );
};

export default ToolbarPlugin;
