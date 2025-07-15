import React, { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, Minimize2 } from 'lucide-react';

/**
 * Diagram renderer component using Mermaid.js
 */
const DiagramRenderer = ({ 
  diagramText, 
  title = 'Diagram',
  type = 'auto' // auto, flowchart, sequence, gantt, pie, etc.
}) => {
  const diagramRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!window.mermaid) {
      loadMermaid();
    } else {
      renderDiagram();
    }
  }, [diagramText]);

  const loadMermaid = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
    script.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#1e40af',
          lineColor: '#6b7280',
          sectionBkgColor: '#1f2937',
          altSectionBkgColor: '#374151',
          gridColor: '#4b5563',
          secondaryColor: '#8b5cf6',
          tertiaryColor: '#10b981'
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis'
        },
        sequence: {
          diagramMarginX: 50,
          diagramMarginY: 10,
          actorMargin: 50,
          width: 150,
          height: 65,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35
        }
      });
      renderDiagram();
    };
    script.onerror = () => {
      setError('Failed to load Mermaid library');
      setIsLoading(false);
    };
    document.head.appendChild(script);
  };

  const renderDiagram = async () => {
    if (!diagramRef.current || !window.mermaid || !diagramText) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Clear previous content
      diagramRef.current.innerHTML = '';

      // Generate unique ID for this diagram
      const diagramId = `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Validate and render the diagram
      const { svg } = await window.mermaid.render(diagramId, diagramText);
      
      diagramRef.current.innerHTML = svg;
      setIsLoading(false);
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError(`Failed to render diagram: ${err.message}`);
      setIsLoading(false);
    }
  };

  const downloadDiagram = () => {
    if (!diagramRef.current) return;

    const svg = diagramRef.current.querySelector('svg');
    if (!svg) return;

    // Convert SVG to blob
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    
    // Create download link
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4'
    : 'glass-panel rounded-lg my-4';

  if (isLoading) {
    return (
      <div className="glass-panel p-6 rounded-lg my-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p className="text-white/70">Rendering diagram...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-4 rounded-lg my-4 border border-red-500/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-red-400 font-medium">Diagram Error</h3>
        </div>
        <p className="text-red-300 text-sm">{error}</p>
        <details className="mt-2">
          <summary className="text-white/70 text-sm cursor-pointer">Show diagram source</summary>
          <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-white/80 overflow-x-auto">
            {diagramText}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-white font-medium">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadDiagram}
            className="glass-button p-2 rounded text-white hover:bg-white/20"
            title="Download diagram"
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
      
      <div className={`p-4 overflow-auto custom-scrollbar ${isFullscreen ? 'h-full' : 'max-h-96'}`}>
        <div 
          ref={diagramRef} 
          className="flex justify-center items-center min-h-[200px]"
        />
      </div>
    </div>
  );
};

/**
 * Extract diagram definitions from text
 * @param {string} text - Text containing diagram definitions
 * @returns {Array} Array of diagram objects
 */
export const extractDiagrams = (text) => {
  const patterns = [
    // Mermaid code blocks
    /```mermaid\n([\s\S]*?)```/gi,
    // Generic diagram blocks
    /```diagram\n([\s\S]*?)```/gi,
    // Flowchart blocks
    /```flowchart\n([\s\S]*?)```/gi,
    // Sequence diagram blocks
    /```sequence\n([\s\S]*?)```/gi
  ];

  const diagrams = [];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      diagrams.push({
        type: 'mermaid',
        content: match[1].trim(),
        fullMatch: match[0]
      });
    }
  }

  return diagrams;
};

/**
 * Auto-detect diagram type from content
 * @param {string} content - Diagram content
 * @returns {string} Detected diagram type
 */
export const detectDiagramType = (content) => {
  const trimmed = content.trim().toLowerCase();
  
  if (trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) {
    return 'flowchart';
  } else if (trimmed.startsWith('sequencediagram') || trimmed.includes('participant')) {
    return 'sequence';
  } else if (trimmed.startsWith('gantt')) {
    return 'gantt';
  } else if (trimmed.startsWith('pie')) {
    return 'pie';
  } else if (trimmed.startsWith('classDiagram')) {
    return 'class';
  } else if (trimmed.startsWith('stateDiagram')) {
    return 'state';
  } else if (trimmed.startsWith('erDiagram')) {
    return 'er';
  } else if (trimmed.startsWith('journey')) {
    return 'journey';
  }
  
  return 'flowchart'; // default
};

/**
 * Generate sample diagrams for different types
 */
export const getSampleDiagrams = () => {
  return {
    flowchart: `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`,
    
    sequence: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob, how are you?
    B-->>A: Great thanks!
    A->>B: See you later!`,
    
    gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Research    :done, research, 2024-01-01, 2024-01-15
    Design      :active, design, 2024-01-10, 2024-01-25
    section Development
    Frontend    :frontend, 2024-01-20, 2024-02-15
    Backend     :backend, 2024-01-25, 2024-02-20
    Testing     :testing, 2024-02-10, 2024-02-25`,
    
    pie: `pie title Favorite Programming Languages
    "JavaScript" : 35
    "Python" : 25
    "Java" : 20
    "C++" : 15
    "Other" : 5`,
    
    class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`
  };
};

export default DiagramRenderer;

