import React, { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

const Editor = ({ language, code, onCodeChange, lockedBy }) => {
    const { theme } = useTheme();
    const editorRef = useRef(null);

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    return (
        <MonacoEditor
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            language={language || 'javascript'}
            value={code || ''}
            onChange={(value) => onCodeChange(value)}
            onMount={handleEditorDidMount}
            options={{
                minimap: { enabled: false },
                fontSize: 16,
                wordWrap: 'on',
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,
                readOnly: !!lockedBy,
            }}
        />
    );
};

export default Editor;
