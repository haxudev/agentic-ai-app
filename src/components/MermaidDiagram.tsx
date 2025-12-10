'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// 标记是否已初始化
let isInitialized = false;

// 初始化 mermaid 配置 (只执行一次)
const initMermaid = () => {
  if (isInitialized) return;
  
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
    },
    sequence: {
      diagramMarginX: 15,
      diagramMarginY: 15,
      actorMargin: 60,
    },
    themeVariables: {
      primaryColor: '#818cf8',
      primaryTextColor: '#1e293b',
      primaryBorderColor: '#6366f1',
      lineColor: '#94a3b8',
      secondaryColor: '#c7d2fe',
      tertiaryColor: '#e0e7ff',
    },
  });
  
  isInitialized = true;
};

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const uniqueId = useId().replace(/:/g, '-');

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart) {
        setIsLoading(false);
        setError('No chart content provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 确保 mermaid 已初始化
        initMermaid();
        
        // 清理 chart 内容
        let cleanedChart = chart
          .trim()
          .replace(/\\n/g, '\n')  // 处理转义的换行符
          .replace(/^\s*```mermaid\s*/i, '')  // 移除可能的 markdown 代码块标记
          .replace(/\s*```\s*$/, '')
          .trim();

        if (!cleanedChart) {
          setIsLoading(false);
          setError('Empty chart content');
          return;
        }

        // 修复常见的语法问题
        // 1. 确保图表类型声明在第一行
        const lines = cleanedChart.split('\n').filter(line => line.trim());
        const firstLine = lines[0]?.trim().toLowerCase() || '';
        
        // 检测图表类型
        const validTypes = ['graph', 'flowchart', 'sequencediagram', 'sequence', 'classDiagram', 'class', 
                          'stateDiagram', 'state', 'erDiagram', 'er', 'gantt', 'pie', 'journey',
                          'gitgraph', 'mindmap', 'timeline', 'sankey', 'quadrantchart', 'xychart'];
        
        const hasValidType = validTypes.some(type => 
          firstLine.startsWith(type.toLowerCase()) || 
          firstLine.startsWith(type)
        );
        
        // 如果没有有效的图表类型，尝试添加 flowchart TD
        if (!hasValidType) {
          // 检查是否看起来像流程图语法
          if (cleanedChart.includes('-->') || cleanedChart.includes('---') || cleanedChart.includes('==>')) {
            cleanedChart = 'flowchart TD\n' + cleanedChart;
          }
        }
        
        // 2. 标准化图表类型声明
        cleanedChart = cleanedChart
          .replace(/^graph\s+(TB|TD|BT|RL|LR)\s*/im, 'flowchart $1\n')
          .replace(/^sequenceDiagram\s*/im, 'sequenceDiagram\n')
          .replace(/^classDiagram\s*/im, 'classDiagram\n')
          .replace(/^stateDiagram(-v2)?\s*/im, 'stateDiagram-v2\n')
          .replace(/^erDiagram\s*/im, 'erDiagram\n');

        const id = `mermaid-${uniqueId}-${Date.now()}`;
        
        // 渲染图表
        const { svg: renderedSvg } = await mermaid.render(id, cleanedChart);
        setSvg(renderedSvg);
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
        setError(errorMessage);
        setSvg('');
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [chart, uniqueId]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-200 ${className}`}>
        <div className="flex items-center gap-2 text-slate-500">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">渲染图表中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-amber-50 rounded-xl border border-amber-200 ${className}`}>
        <div className="flex items-start gap-2 text-amber-700">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">图表语法需要修正</p>
            <details className="mt-2">
              <summary className="text-xs cursor-pointer hover:text-amber-800">查看详情</summary>
              <p className="text-xs text-amber-600 mt-1 break-words">{error}</p>
              <pre className="mt-2 p-2 bg-amber-100 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono">{chart}</pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`mermaid-container overflow-x-auto p-4 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-indigo-100 shadow-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
