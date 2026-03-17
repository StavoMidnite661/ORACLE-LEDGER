import React, { useState } from 'react';

type Section = 'protocol' | 'ledger' | 'cards' | 'bridge' | 'banking' | 'ops' | 'audit';

export const UserManualContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Section>('protocol');

  const TabButton: React.FC<{ id: Section; label: string }> = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 flex-1 text-center whitespace-nowrap ${
        activeTab === id 
          ? 'border-sov-primary text-sov-primary bg-sov-primary/10 shadow-[0_4px_10px_-5px_rgba(45,212,191,0.5)]' 
          : 'border-white/5 text-sov-light-alt hover:text-sov-light hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-sov-dark text-sov-light font-sans selection:bg-sov-primary/30">
      {/* Dynamic Header */}
      <div className="flex bg-sov-dark-alt border-b border-white/10 sticky top-0 z-10 overflow-x-auto no-scrollbar">
        <TabButton id="protocol" label="Protocol" />
        <TabButton id="ledger" label="Ledger" />
        <TabButton id="cards" label="Cards" />
        <TabButton id="bridge" label="Bridge" />
        <TabButton id="banking" label="Rails" />
        <TabButton id="ops" label="Ops" />
        <TabButton id="audit" label="Audit" />
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-12 scroll-smooth">
        
        {/* SECTION 01: PROTOCOL */}
        {activeTab === 'protocol' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="mb-8">
              <span className="text-sov-primary font-mono text-xs tracking-widest uppercase">System Initialization</span>
              <h2 className="text-4xl font-black tracking-tighter mt-1">OPERATIONAL PROTOCOL</h2>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sov-secondary font-bold text-sm uppercase mb-3">Gateway Topology</h3>
                  <p className="text-sm opacity-80 leading-relaxed mb-4">
                    The Oracle Ledger console is a unified interface for five discrete microservices. All interactions are proxied through the <strong>Port 3002 Gateway</strong>.
                  </p>
                  <div className="bg-black/40 p-4 rounded-lg font-mono text-[11px] border border-white/5">
                    <div className="flex justify-between mb-1"><span className="text-sov-primary">/api/auth</span> <span>LEGACY_CORE_3001</span></div>
                    <div className="flex justify-between mb-1"><span className="text-sov-secondary">/api/stripe</span> <span>PMT_GATEWAY_3005</span></div>
                    <div className="flex justify-between mb-1"><span className="text-sov-accent">/api/consul</span> <span>BLOCKCHAIN_3004</span></div>
                    <div className="flex justify-between mb-1"><span className="text-sov-red">/api/audit</span> <span>RISK_SYNC_3003</span></div>
                  </div>
                </div>
                <div className="p-4 bg-sov-red/5 border-l-4 border-sov-red">
                  <h4 className="text-xs font-bold text-sov-red uppercase mb-1">State Alert: Mock vs Live</h4>
                  <p className="text-[11px] opacity-70">
                    The <strong>"Use Mock Data"</strong> toggle (Global Header) determines persistence. In <strong>Mock Mode</strong>, transactions are stored in volatile RAM. Disabling Mock Mode connects directly to the <strong>PostgreSQL Production Cluster</strong>.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sov-light font-bold text-sm uppercase">Standard Navigation Patterns</h3>
                <ul className="space-y-3">
                  <li className="flex gap-4 items-start">
                    <span className="bg-sov-primary/20 text-sov-primary p-1 rounded font-mono text-[10px]">CMD+S</span>
                    <p className="text-xs opacity-70 mt-0.5">Global Search protocol (Journal Entry finding).</p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="bg-sov-secondary/20 text-sov-secondary p-1 rounded font-mono text-[10px]">FILTER</span>
                    <p className="text-xs opacity-70 mt-0.5">Most views support multi-column sorting. Click table headers to toggle ASC/DESC.</p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="bg-sov-accent/20 text-sov-accent p-1 rounded font-mono text-[10px]">EXPORT</span>
                    <p className="text-xs opacity-70 mt-0.5">CSV exports are filtered to your current view state. What you see is what you download.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 02: LEDGER */}
        {activeTab === 'ledger' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="mb-8">
              <span className="text-sov-secondary font-mono text-xs tracking-widest uppercase">Master Schema</span>
              <h2 className="text-4xl font-black tracking-tighter mt-1">THE SOVEREIGN LEDGER</h2>
            </header>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-sov-dark-alt border border-white/5 rounded-xl">
                  <h4 className="text-sov-secondary font-bold text-xs uppercase mb-2">Account 1000</h4>
                  <p className="text-[11px] opacity-60">ODFI Cash. Used for Stripe ACH settlements and direct liquidity flows.</p>
                </div>
                <div className="p-5 bg-sov-dark-alt border border-white/5 rounded-xl">
                  <h4 className="text-sov-accent font-bold text-xs uppercase mb-2">Account 1010</h4>
                  <p className="text-[11px] opacity-60">Web3 Vault. Holds USDC/Consul Credits. Mints/Burns recorded here via Bridge.</p>
                </div>
                <div className="p-5 bg-sov-dark-alt border border-white/5 rounded-xl">
                  <h4 className="text-sov-red font-bold text-xs uppercase mb-2">Account 2200</h4>
                  <p className="text-[11px] opacity-60">Intercompany Payable. Debt owed by the LLC to the Parent Trust.</p>
                </div>
              </div>

              <div className="bg-black/40 p-6 rounded-lg border border-sov-secondary/20">
                <h3 className="text-sov-secondary font-bold text-sm uppercase mb-4">Manual Entry Protocol</h3>
                <div className="space-y-4 text-sm opacity-80">
                  <p>When entering a <strong>Journal Entry</strong>, you must define at least two lines. The status remains <span className="text-sov-yellow italic">"Draft"</span> until the sum of DEBITS equals the sum of CREDITS. </p>
                  <div className="flex items-center gap-4 bg-sov-secondary/5 p-4 rounded">
                    <div className="text-xs font-mono">
                      DEBIT (Asset &uarr; | Liability &darr;) <br />
                      CREDIT (Asset &darr; | Liability &uarr;)
                    </div>
                  </div>
                  <p className="text-xs border-l-2 border-sov-accent/50 pl-4 py-1">
                    <strong>Intercompany Settle:</strong> The Dashboard "Settle" button executes a Netting operation. It debits Account 2200 and credits 1200 automatically to zero out the internal balance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 03: CARDS */}
        {activeTab === 'cards' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="mb-8">
              <span className="text-sov-accent font-mono text-xs tracking-widest uppercase">Capital Orchestration</span>
              <h2 className="text-4xl font-black tracking-tighter mt-1">CARD MANAGEMENT</h2>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-sov-light font-bold text-sm uppercase mb-4">Issuance Lifecycle</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-sov-accent text-sov-dark flex items-center justify-center font-bold text-[10px]">1</div>
                      <p className="text-xs opacity-80 mt-1"><strong>Select Type:</strong> Virtual (Online Only), Physical (Mail Issued), Fleet (Auth for Fuel/Logistics).</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-sov-accent text-sov-dark flex items-center justify-center font-bold text-[10px]">2</div>
                      <p className="text-xs opacity-80 mt-1"><strong>Set Ceilings:</strong> Monthly Limit (Max Budget), Daily Limit (Rolling Cap), Transaction Limit (Per-Swipe Guardrail).</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-sov-accent text-sov-dark flex items-center justify-center font-bold text-[10px]">3</div>
                      <p className="text-xs opacity-80 mt-1"><strong>Category Lock:</strong> Restrict spending to specific MCC groups (e.g. Travel, Software, Medical).</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-sov-dark-alt p-8 rounded-2xl border-2 border-sov-accent/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                </div>
                <h3 className="text-sov-accent font-bold text-sm uppercase mb-4">SECURE REVEAL PROTOCOL</h3>
                <p className="text-xs opacity-80 leading-relaxed mb-6 italic">
                  "PCI-DSS mandates that full 16-digit numbers remain invisible until explicitly required for a transaction."
                </p>
                <div className="space-y-3 bg-black/40 p-4 rounded-lg">
                  <p className="text-[10px] text-sov-light">Trigger: <strong>Action Menu &rarr; Reveal</strong></p>
                  <p className="text-[10px] text-sov-light">Requirement: <strong>Audit Justification (Text Field)</strong></p>
                  <p className="text-[10px] text-sov-light">Persistence: <strong>60 Second TTL</strong></p>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <p className="text-[9px] text-sov-red font-bold">WARNING: All reveals are non-repudiable audit events.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 04: BRIDGE */}
        {activeTab === 'bridge' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="mb-8">
              <span className="text-sov-purple font-mono text-xs tracking-widest uppercase">Hyper-Liquidity</span>
              <h2 className="text-4xl font-black tracking-tighter mt-1">CONSUL CREDITS BRIDGE</h2>
            </header>
            
            <div className="space-y-8">
              <div className="bg-sov-purple/10 border border-sov-purple/30 p-6 rounded-xl">
                <h3 className="text-sov-purple font-black text-sm uppercase mb-4 tracking-widest">Bridging Asset Logic</h3>
                <p className="text-sm opacity-80 mb-6">
                  The Bridge virtualizes ERC-20 tokens into <strong>denominated credit units</strong>. When assets cross the bridge, the system performs a dual-state sync:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-sov-purple uppercase">On-Chain Event</p>
                    <p className="text-[11px] opacity-70">A smart contract event (Deposit/Withdraw) is emitted on the Base Mainnet RPC. The Blockchain Service (3004) monitors this in near real-time.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-sov-purple uppercase">Ledger Sync</p>
                    <p className="text-[11px] opacity-70">Upon confirmation, a Journal Entry is posted to <strong>Account 1010</strong>. Credits (Mint) or Debits (Burn) reflect the shifting liquidity.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-mono text-[10px]">
                <div className="p-4 bg-sov-dark-alt rounded border border-white/5">
                  <h4 className="text-sov-light-alt mb-2">BRIDGE STATUS INDICATORS:</h4>
                  <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-sov-green"></span> <span>CONFIRMED: Tx written to block & Ledger.</span></div>
                  <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-sov-yellow"></span> <span>PENDING: Awaiting 12 block confirmations.</span></div>
                  <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-sov-red"></span> <span>FAILED: Reverted by node or Oracle rejection.</span></div>
                </div>
                <div className="p-4 bg-sov-dark-alt rounded border border-white/5">
                  <h4 className="text-sov-light-alt mb-2">EXCHANGE RATE PROTOCOL:</h4>
                  <p className="opacity-70">1 USDC = 1.000000 CC</p>
                  <p className="opacity-70">1 SOVR = Dynamic based on UniSwap V3 TWAP Oracle</p>
                  <p className="opacity-40 italic mt-2">// Rate used in "Mint Amount" calculations.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 05: BANKING RAILS */}
        {activeTab === 'banking' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="mb-8">
              <span className="text-sov-primary font-mono text-xs tracking-widest uppercase">Global Settlement</span>
              <h2 className="text-4xl font-black tracking-tighter mt-1">STRIPE & BANKING RAILS</h2>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 lg:col-span-2 space-y-8">
                <div>
                  <h3 className="text-sov-primary font-bold text-sm uppercase mb-4">ACH Pipeline Operations</h3>
                  <div className="bg-sov-dark-alt p-6 rounded-xl border border-white/5 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-sov-light mb-1 italic">1. Verification (KYC/KYB)</h4>
                      <p className="text-xs opacity-70 leading-relaxed">Vendors must provide Routing & Account numbers. The "Manage Vendors" view tracks setup status. Direct Deposit is locked until the status is <span className="text-sov-green font-bold">"Setup Complete"</span>.</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-sov-light mb-1 italic">2. Execution (NACHA)</h4>
                      <p className="text-xs opacity-70 leading-relaxed">Paying an invoice via ACH creates a pending transfer. The Gateway coordinates with Stripe to bundle these into daily NACHA transmissions.</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-sov-light mb-1 italic">3. Reconciliation</h4>
                      <p className="text-xs opacity-70 leading-relaxed">Once Stripe confirms settlement, the Ledger automatically moves the funds from AP (2300) to Cash (1000).</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-sov-primary/5 p-6 rounded-2xl border border-sov-primary/20">
                <h3 className="text-sov-primary font-bold text-sm uppercase mb-4">Settlement Timeframes</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold uppercase">ACH Debit:</span>
                    <span className="text-[10px]">3-5 Business Days</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold uppercase">ACH Credit:</span>
                    <span className="text-[10px]">1-2 Business Days</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold uppercase">Wire:</span>
                    <span className="text-[10px]">Same Day (T+0)</span>
                  </div>
                  <div className="mt-6">
                    <p className="text-[9px] opacity-50 uppercase tracking-widest">Settlement happens at 21:00 UTC daily.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 06: OPS */}
        {activeTab === 'ops' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="mb-8">
              <span className="text-sov-gold font-mono text-xs tracking-widest uppercase">Business Intelligence</span>
              <h2 className="text-4xl font-black tracking-tighter mt-1">BACK-OFFICE OPERATIONS</h2>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-sov-dark-alt p-5 rounded-xl border border-sov-gold/20 shadow-[0_0_15px_-5px_rgba(255,215,0,0.2)]">
                  <h3 className="text-sov-gold font-bold text-sm uppercase mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/></svg>
                    Payroll Engine (Stripe Connect)
                  </h3>
                  <p className="text-xs opacity-80 leading-relaxed mb-4">
                    The system supports two payroll paths: <strong>Traditional ACH</strong> and <strong>Stripe Connect</strong>. Connect is prioritized for automated tax reporting and T+1 payouts.
                  </p>
                  <ul className="text-[10px] space-y-2 font-mono opacity-70">
                    <li>&rarr; <span className="text-sov-primary">Account 6000:</span> Payroll Expense (Debit)</li>
                    <li>&rarr; <span className="text-sov-secondary">Account 2400:</span> Payroll Accrued (Credit)</li>
                    <li>&rarr; <span className="text-sov-accent">Account 2110:</span> Connect Clearing (Credit upon payout)</li>
                  </ul>
                  <p className="text-[9px] mt-4 italic border-t border-white/5 pt-2">Tip: Use the "Stub" button to generate and print PDF pay statements.</p>
                </div>

                <div className="bg-sov-dark-alt p-5 rounded-xl border border-white/5">
                  <h3 className="text-sov-light font-bold text-sm uppercase mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
                    Purchase Orders (PO)
                  </h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    PO issuance creates a non-financial record until <strong>Fulfilled</strong>. Once fulfilled, it converts into a Bill (AP) for one-click payment execution via the Banking Rails.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-sov-dark-alt p-5 rounded-xl border border-white/5">
                  <h3 className="text-sov-light font-bold text-sm uppercase mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                    Vendor Custody (Vault)
                  </h3>
                  <p className="text-xs opacity-80 leading-relaxed mb-4">
                    Sensitive vendor data (Tax IDs, Routing Numbers) is encrypted at rest. 
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black/30 rounded text-[10px]">
                      <span className="font-bold text-sov-accent block mb-1">KYC Status:</span>
                      Verified vendor accounts can receive unlimited ACH volume.
                    </div>
                    <div className="p-3 bg-black/30 rounded text-[10px]">
                      <span className="font-bold text-sov-accent block mb-1">Terms:</span>
                      Net 15/30/60 auto-calculates Due Dates on bill entry.
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-sov-gold/5 border-l-4 border-sov-gold rounded-r-xl">
                  <h4 className="text-xs font-bold text-sov-gold uppercase mb-1">Workflow Integration</h4>
                  <p className="text-[11px] opacity-70">
                    Vendor Banking info is <strong>Sync'd Across Views</strong>. Update a vendor routing number in the "Vendor Management" tab, and it instantly enables "Pay via ACH" in the "Accounts Payable" view.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 07: AUDIT */}
        {activeTab === 'audit' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="mb-8">
              <span className="text-sov-red font-mono text-xs tracking-widest uppercase">System Integrity</span>
              <h2 className="text-4xl font-black tracking-tighter mt-1">COMPLIANCE & RISK</h2>
            </header>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sov-red font-bold text-sm uppercase mb-4">ACH Return Codes (Failure Analysis)</h3>
                  <p className="text-sm opacity-80 mb-4">When a payment fails, the system returns an industry-standard NACHA code. These must be acted upon within 48 hours.</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 bg-sov-red/10 border border-sov-red/20 rounded"><strong>R01:</strong> Insufficient Funds</div>
                    <div className="p-2 bg-sov-red/10 border border-sov-red/20 rounded"><strong>R03:</strong> Account Closed</div>
                    <div className="p-2 bg-sov-red/10 border border-sov-red/20 rounded"><strong>R04:</strong> Invalid Account #</div>
                    <div className="p-2 bg-sov-red/10 border border-sov-red/20 rounded"><strong>R10:</strong> User Disputed</div>
                  </div>
                </div>
                
                <div className="bg-sov-dark-alt p-6 rounded-xl border border-white/5">
                  <h3 className="text-sov-light font-bold text-sm uppercase mb-4">Compliance Checklist</h3>
                  <p className="text-xs opacity-70 mb-4">The Compliance view monitors real-time adherence to PCI-DSS, NACHA, and AML/KYC standards.</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-sov-green/20 rounded text-sov-green flex items-center justify-center text-[10px]">✓</div>
                      <span className="text-[10px]">PCI Assessment: <strong>Completed</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-sov-yellow/20 rounded text-sov-yellow flex items-center justify-center text-[10px]">!</div>
                      <span className="text-[10px]">KYC Verification: <strong>In Progress (Action Req)</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-sov-red/20 rounded text-sov-red flex items-center justify-center text-[10px]">✗</div>
                      <span className="text-[10px]">Audit Log Consistency: <strong>Deviation Detected</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-sov-red/5 border border-sov-red/20 rounded-2xl">
                <h3 className="text-sov-red font-black text-sm uppercase mb-3">AI RISK ASSESSMENT</h3>
                <p className="text-xs opacity-80 italic mb-4">
                  Powered by ORACLE-LEDGER Gemini Analysis.
                </p>
                <p className="text-xs opacity-70 leading-relaxed">
                  The <span className="text-sov-red font-bold italic">"Analyze"</span> button on the Dashboard doesn't just summarize data—it runs a risk heuristic engine. It cross-references current Card spend against historically anomalous patterns and flags potential PCI-DSS violations for manual review.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Persistent Footer */}
      <footer className="bg-sov-dark-alt border-t border-white/5 p-4 flex justify-between items-center text-[9px] font-mono font-bold tracking-[0.3em] uppercase opacity-40">
        <div>// SYSTEM_ID: ORACLE-VUI-CORE</div>
        <div>// SEC_CLEARANCE: ARCHITECT_LEVEL_1</div>
      </footer>
    </div>
  );
};
