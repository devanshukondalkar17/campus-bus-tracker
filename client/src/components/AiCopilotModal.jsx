import React, { useState } from 'react';
import { Terminal, Send, Sparkles, X, CheckCircle2, AlertCircle, CornerDownLeft } from 'lucide-react';
import { playAlertChime } from '../utils/geoHelpers';

export default function AiCopilotModal({ isOpen, onClose, onExecuteCommand }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([
    {
      type: 'system',
      text: '[SYS-INIT] CampusPulse AI Dispatch Copilot v2.4 initialized. Ready for operations commands.'
    },
    {
      type: 'ai',
      text: 'AI Agent standing by. You can ask me to reroute buses, mobilize standby reserves, or audit telemetry anomalies.'
    }
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    "Dispatch standby bus to Route 101 due to Sayajigunj crowd surge",
    "Report Navrachana fleet health and safety anomalies",
    "Flag breakdown on NUV-Titan-101 and trigger relief re-routing",
    "How many active Vadodara students are currently on NUV corridors?"
  ];

  const handleSend = async (commandText) => {
    const textToSend = commandText || prompt;
    if (!textToSend.trim()) return;

    // Add user command to terminal
    setLogs(prev => [...prev, { type: 'user', text: `> ${textToSend}` }]);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await onExecuteCommand(textToSend);
      playAlertChime('DISPATCH');

      setLogs(prev => [
        ...prev,
        {
          type: response.success ? 'success' : 'error',
          text: response.response || 'Action processed by AI operations kernel.'
        }
      ]);
    } catch (err) {
      setLogs(prev => [
        ...prev,
        { type: 'error', text: `[ERR] Failed to execute dispatch command: ${err.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="copilot-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(16,24,44,0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Terminal size={17} color="#fff" />
            </div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>AI Dispatch Copilot Kernel</span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid #38bdf8', padding: '1px 6px', borderRadius: '999px' }}>
                  Gemini Active
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                Powered by Google Gemini 1.5 Flash • Navrachana University
              </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px' }}>
          {/* Terminal Console View */}
          <div className="copilot-terminal">
            {logs.map((log, i) => (
              <div key={i} className={`terminal-line ${log.type}`}>
                {log.text}
              </div>
            ))}
            {isLoading && (
              <div className="terminal-line ai" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} className="spin-slow" />
                <span>AI evaluating corridor demand and synthesizing fleet instructions...</span>
              </div>
            )}
          </div>

          {/* Quick Command Suggestions */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: 600 }}>
            RECOMMENDED DISPATCH PROMPTS:
          </div>
          <div className="prompt-chips-container">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                className="prompt-chip"
                onClick={() => handleSend(p)}
                disabled={isLoading}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Row */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="copilot-input-row"
          >
            <input
              type="text"
              className="copilot-text-input"
              placeholder="e.g., 'Reroute bus 1 to North Campus due to heavy rain'..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="btn-primary btn-ai-glow"
              disabled={isLoading || !prompt.trim()}
              style={{ padding: '0 20px' }}
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
