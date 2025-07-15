import React, { useRef, useEffect, useState } from 'react';
import { Play, Copy, Download, Maximize2, Minimize2 } from 'lucide-react';

/**
 * Interactive code editor component
 */
const CodeEditor = ({ 
  initialCode = '', 
  language = 'javascript', 
  readOnly = false,
  onCodeChange,
  title = 'Code Editor'
}) => {
  const editorRef = useRef(null);
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Load Monaco Editor from CDN
    if (!window.monaco) {
      loadMonacoEditor();
    } else {
      initializeEditor();
    }
  }, []);

  const loadMonacoEditor = () => {
    // Add Monaco Editor CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.css';
    document.head.appendChild(link);

    // Add Monaco Editor JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
    script.onload = () => {
      window.require.config({ 
        paths: { 
          vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' 
        } 
      });
      
      window.require(['vs/editor/editor.main'], () => {
        initializeEditor();
      });
    };
    document.head.appendChild(script);
  };

  const initializeEditor = () => {
    if (editorRef.current && window.monaco) {
      const editor = window.monaco.editor.create(editorRef.current, {
        value: code,
        language: language,
        theme: 'vs-dark',
        readOnly: readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        automaticLayout: true,
        wordWrap: 'on',
        contextmenu: true,
        selectOnLineNumbers: true
      });

      editor.onDidChangeModelContent(() => {
        const newCode = editor.getValue();
        setCode(newCode);
        if (onCodeChange) {
          onCodeChange(newCode);
        }
      });

      // Store editor instance for cleanup
      editorRef.current.editor = editor;
    }
  };

  const runCode = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setOutput('Running...');

    try {
      if (language === 'javascript') {
        await runJavaScript(code);
      } else if (language === 'python') {
        await runPython(code);
      } else {
        setOutput('Code execution not supported for this language');
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runJavaScript = async (jsCode) => {
    try {
      // Create a safe execution context
      const originalConsoleLog = console.log;
      let capturedOutput = '';

      // Override console.log to capture output
      console.log = (...args) => {
        capturedOutput += args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n';
      };

      // Execute the code
      const result = eval(jsCode);
      
      // Restore original console.log
      console.log = originalConsoleLog;

      // Set output
      let finalOutput = capturedOutput;
      if (result !== undefined) {
        finalOutput += `Result: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`;
      }
      
      setOutput(finalOutput || 'Code executed successfully (no output)');
    } catch (error) {
      console.log = console.log; // Restore console.log
      throw error;
    }
  };

  const runPython = async (pythonCode) => {
    // For Python, we would need Pyodide or similar
    // This is a placeholder implementation
    setOutput('Python execution requires Pyodide library. Feature coming soon!');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const downloadCode = () => {
    const extension = language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    // Cleanup editor on unmount
    return () => {
      if (editorRef.current?.editor) {
        editorRef.current.editor.dispose();
      }
    };
  }, []);

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4'
    : 'glass-panel rounded-lg my-4';

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-white font-medium">{title}</h3>
        <div className="flex items-center space-x-2">
          {!readOnly && language === 'javascript' && (
            <button
              onClick={runCode}
              disabled={isRunning}
              className="glass-button px-3 py-1 rounded text-sm text-white flex items-center space-x-1 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              <span>{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          )}
          <button
            onClick={copyCode}
            className="glass-button p-2 rounded text-white hover:bg-white/20"
            title="Copy code"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={downloadCode}
            className="glass-button p-2 rounded text-white hover:bg-white/20"
            title="Download code"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="glass-button p-2 rounded text-white hover:bg-white/20"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <div className={`flex ${isFullscreen ? 'h-full' : 'h-96'}`}>
        <div className="flex-1">
          <div 
            ref={editorRef} 
            className="h-full w-full"
            style={{ minHeight: isFullscreen ? 'calc(100% - 120px)' : '300px' }}
          />
        </div>
        
        {output && (
          <div className="w-1/3 border-l border-white/10 flex flex-col">
            <div className="p-2 border-b border-white/10 text-white text-sm font-medium">
              Output
            </div>
            <div className="flex-1 p-3 text-white text-sm font-mono bg-black/20 overflow-auto custom-scrollbar">
              <pre className="whitespace-pre-wrap">{output}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Extract code blocks from markdown text
 * @param {string} text - Markdown text
 * @returns {Array} Array of code blocks
 */
export const extractCodeBlocks = (text) => {
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
      fullMatch: match[0]
    });
  }

  return blocks;
};

/**
 * Simple code editor for inline code snippets
 */
export const InlineCodeEditor = ({ code, language, onSave }) => {
  const [editedCode, setEditedCode] = useState(code);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave(editedCode);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="relative group">
        <pre className="bg-black/30 p-3 rounded text-white text-sm overflow-x-auto">
          <code>{code}</code>
        </pre>
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 glass-button px-2 py-1 text-xs text-white rounded transition-opacity"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-3 rounded">
      <textarea
        value={editedCode}
        onChange={(e) => setEditedCode(e.target.value)}
        className="w-full h-32 bg-black/30 text-white p-2 rounded text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Enter your code here..."
      />
      <div className="flex justify-end space-x-2 mt-2">
        <button
          onClick={() => setIsEditing(false)}
          className="glass-button px-3 py-1 text-sm text-white rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-blue-500/80 hover:bg-blue-500 px-3 py-1 text-sm text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default CodeEditor;

