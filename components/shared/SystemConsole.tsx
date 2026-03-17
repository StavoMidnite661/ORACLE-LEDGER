
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Trash2, RefreshCcw, Search, Filter } from 'lucide-react';
import { loggingService } from '../../services/loggingService.js';
import { SystemLog } from '../../shared/schema.js';
import { ConsulCreditsConfig } from '../../types.js';

interface SystemConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  config?: ConsulCreditsConfig | null;
  walletAddress?: string | null;
}

export const SystemConsole: React.FC<SystemConsoleProps> = ({ isOpen, onClose, config, walletAddress }) => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchLogs = async () => {
    const history = await loggingService.getHistory();
    setLogs(history);
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(filter.toLowerCase()) || 
                          log.source.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-sov-red';
      case 'warn': return 'text-amber-400';
      case 'debug': return 'text-sov-blue';
      default: return 'text-sov-light/70';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-80 bg-sov-dark/95 border-t border-sov-light/10 shadow-2xl z-50 flex flex-col backdrop-blur-md animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-sov-light/10 bg-sov-dark/50">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-sov-blue" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-sov-light">System Memory & Diagnostics</h3>
          <span className="text-[10px] bg-sov-blue/20 text-sov-blue px-2 py-0.5 rounded-full border border-sov-blue/30 font-mono">
            PERSISTENT MODE ACTIVE
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 relative">
            <Search className="w-3 h-3 absolute left-2 text-sov-light/40" />
            <input 
              type="text" 
              placeholder="Filter logs..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-sov-dark border border-sov-light/10 rounded px-7 py-1 text-xs focus:outline-none focus:border-sov-blue/50 w-48 transition-all"
            />
          </div>

          <select 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-sov-dark border border-sov-light/10 rounded px-2 py-1 text-[10px] text-sov-light/70 focus:outline-none focus:border-sov-blue/50"
          >
            <option value="all">ALL LEVELS</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
            <option value="debug">DEBUG</option>
          </select>

          <button onClick={fetchLogs} className="p-1.5 hover:bg-sov-light/5 rounded text-sov-light/50 hover:text-sov-blue transition-colors">
            <RefreshCcw className="w-3 h-3" />
          </button>
          
          <button onClick={onClose} className="p-1.5 hover:bg-sov-red/10 rounded text-sov-light/50 hover:text-sov-red transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed custom-scrollbar selection:bg-sov-blue/30"
        onScroll={(e) => {
          const target = e.currentTarget;
          const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
          setAutoScroll(isAtBottom);
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sov-light/20 gap-2">
            <Terminal className="w-8 h-8 opacity-10" />
            <p className="italic">No diagnostics data found for the current filter</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="group flex gap-3 py-0.5 hover:bg-sov-light/5 rounded px-2 transition-colors border-l-2 border-transparent hover:border-sov-blue/30">
              <span className="text-sov-light/30 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`uppercase font-bold w-12 text-[9px] ${getLevelColor(log.level)} mr-2`}>
                [{log.level}]
              </span>
              <span className="text-sov-blue/70 font-bold shrink-0">
                {log.source}:
              </span>
              <span className="text-sov-light break-all group-hover:text-white transition-colors">
                {log.message}
                {log.metadata && log.metadata !== '[]' && (
                  <span className="text-sov-light/40 ml-2 italic text-[10px]">
                    {log.metadata}
                  </span>
                )}
              </span>
            </div>
          )).reverse()
        )}
      </div>

      {/* Footer / Stats */}
      <div className="px-4 py-1.5 border-t border-sov-light/10 bg-sov-dark text-[9px] text-sov-light/30 flex justify-between items-center">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full ${walletAddress ? 'bg-sov-accent' : 'bg-sov-light/20'}`} />
            LEDGER STATUS: {walletAddress ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
          <span className="flex items-center gap-1.5 uppercase">
            UPSTREAM: {config?.networkName || 'Base Mainnet'} ({config?.chainId || 8453})
          </span>
          <span className="flex items-center gap-1.5 uppercase">
            WRAPPER: {config?.contractAddress ? `${config.contractAddress.slice(0, 6)}...${config.contractAddress.slice(-4)}` : 'usdSOVR'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sov-green animate-pulse" />
          <span className="uppercase tracking-tighter">System Health: Nominal</span>
        </div>
      </div>
    </div>
  );
};
