'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { 
  Search, Bot, Settings, LayoutDashboard, 
  MessageCircle, PlaySquare, Plus, X, Lock, KeyRound, Loader2, Save 
} from 'lucide-react';

export default function IDMDashboard() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('reels');

  // --- DASHBOARD STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [reels, setReels] = useState<any[]>([]);
  const [isLoadingReels, setIsLoadingReels] = useState(false);

  // --- GLOBAL SETTINGS STATES (Kill Switch & DM Prompt) ---
  const [isBotActive, setIsBotActive] = useState(true);
  const [dmMasterPrompt, setDmMasterPrompt] = useState('');
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // --- FORMS STATES ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [reelId, setReelId] = useState('');
  const [triggerWords, setTriggerWords] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Session Check
  useEffect(() => {
    const loggedIn = sessionStorage.getItem('idm_admin_auth');
    if (loggedIn === 'true') setIsAuthenticated(true);
  }, []);

  // 2. Fetch Data upon Login
  useEffect(() => {
    if (isAuthenticated) {
      fetchRealReels();
      fetchGlobalSettings();
    }
  }, [isAuthenticated]);

  // --- FETCH FUNCTIONS ---
  const fetchRealReels = async () => {
    setIsLoadingReels(true);
    try {
      const res = await fetch('/api/reels');
      const data = await res.json();
      if (data.success) setReels(data.reels);
    } catch (error) {
      console.error("Error fetching reels:", error);
    }
    setIsLoadingReels(false);
  };

  const fetchGlobalSettings = async () => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      setIsBotActive(data.is_bot_active);
      setDmMasterPrompt(data.dm_master_prompt || '');
    }
  };

  // --- UPDATE SETTINGS FUNCTIONS ---
  const handleToggleBot = async () => {
    const newState = !isBotActive;
    setIsBotActive(newState); // UI immediately update karo
    
    // Database mein upsert (agar row nahi hai toh bana dega, hai toh update kar dega)
    await supabase.from('global_settings').upsert({ 
      id: 1, 
      is_bot_active: newState 
    });
  };

  const handleSaveDMPrompt = async () => {
    setLoading(true);
    const { error } = await supabase.from('global_settings').upsert({ 
      id: 1, 
      dm_master_prompt: dmMasterPrompt 
    });

    if (error) {
      alert("Error saving prompt: " + error.message);
    } else {
      alert("✅ Master DM Prompt safely updated in Database!");
    }
    setLoading(false);
  };

  // --- LOGIN & REELS FUNCTIONS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        sessionStorage.setItem('idm_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setAuthError('Incorrect Password. Access Denied 🚫');
      }
    } catch (error) {
      setAuthError('Something went wrong!');
    }
    setIsLoggingIn(false);
  };

  const handleSaveAutomation = async () => {
    if(!reelId || !triggerWords || !aiPrompt) {
      alert("Bhai pehle saari details toh bhar do!");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('automations').insert([
      { reel_id: reelId, trigger_words: triggerWords, ai_prompt: aiPrompt, is_active: true }
    ]);
    if (error) alert("Error saving automation: " + error.message);
    else {
      alert("✅ Automation successfully saved!");
      setReelId(''); setTriggerWords(''); setAiPrompt(''); setShowAddForm(false);
    }
    setLoading(false);
  };

  const handleConfigureReel = (selectedReelId: string) => {
    setReelId(selectedReelId);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredReels = reels.filter(reel => 
    reel.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============================================================================
  // 🔒 LOGIN SCREEN
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center">
              <Lock size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">IDM Controller</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="password" placeholder="Enter Master Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" autoFocus />
            </div>
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <button type="submit" disabled={isLoggingIn || !passwordInput} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold">
              {isLoggingIn ? "Verifying..." : "Unlock Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 🔓 DASHBOARD SCREEN
  // ============================================================================
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* 📱 SIDEBAR */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">IDM</div>
          <h1 className="text-xl font-bold tracking-wide">Controller</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={<PlaySquare size={20}/>} text="Reels Automations" active={activeTab === 'reels'} onClick={() => setActiveTab('reels')} />
          <NavItem icon={<MessageCircle size={20}/>} text="DM Chatbot" active={activeTab === 'dm'} onClick={() => setActiveTab('dm')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => { sessionStorage.removeItem('idm_admin_auth'); setIsAuthenticated(false); }} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white py-2 rounded transition-colors">
            <Lock size={16} /> Lock System
          </button>
        </div>
      </aside>

      {/* 🖥️ MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center z-10 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'reels' ? 'Reels Automations' : 'DM Chatbot Core'}
            </h2>
          </div>
          <div className="flex gap-4">
            
            {/* 🚀 TRUE GLOBAL KILL SWITCH */}
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Bot size={20} className={isBotActive ? "text-blue-600" : "text-slate-400"} />
                <span className="font-semibold text-sm">Bot Status</span>
              </div>
              <button 
                onClick={handleToggleBot} 
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isBotActive ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBotActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Add Button Sirf Reels tab mein dikhega */}
            {activeTab === 'reels' && (
              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold shadow-sm">
                {showAddForm ? <X size={20} /> : <Plus size={20} />} {showAddForm ? "Cancel" : "Add Automation"}
              </button>
            )}
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: REELS AUTOMATION UI */}
          {activeTab === 'reels' && (
            <>
              {/* Form Logic */}
              {showAddForm && (
                <div className="bg-white p-6 rounded-2xl shadow-md border border-blue-100 mb-8 max-w-3xl animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800"><Bot className="text-blue-600" /> Configure AI Rule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input value={reelId} readOnly type="text" placeholder="Select a post below ->" className="border border-slate-300 p-3 rounded-xl bg-slate-50 text-slate-500 outline-none" />
                    <input value={triggerWords} onChange={(e) => setTriggerWords(e.target.value)} type="text" placeholder="Trigger Words (e.g., run, price)" className="border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                  <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Write Groq AI System Prompt here..." className="w-full border border-slate-300 p-3 rounded-xl h-24 mb-4 focus:ring-2 focus:ring-blue-600 outline-none"></textarea>
                  <button onClick={handleSaveAutomation} disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-400">
                    {loading ? "Saving..." : "Save Automation Rule"}
                  </button>
                </div>
              )}

              {/* Grid Logic */}
              <div className="flex gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" placeholder="Search your Instagram content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none shadow-sm" />
                </div>
              </div>

              {isLoadingReels ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Loader2 className="animate-spin mb-4" size={40} />
                  <p className="font-semibold">Fetching your Instagram content...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                  {filteredReels.map((reel) => (
                    <div key={reel.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                      <div className="h-56 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                        <img src={reel.thumbnail_url || reel.media_url} alt="Post thumbnail" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x400?text=No+Image'} />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button onClick={() => handleConfigureReel(reel.id)} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                            Add AI Rule
                          </button>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-slate-800 font-medium line-clamp-2 text-sm">{reel.caption || "No caption provided"}</p>
                        <p className="text-xs text-slate-400 mt-2">ID: {reel.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: DM CHATBOT UI */}
          {activeTab === 'dm' && (
            <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
                  <MessageCircle size={28} className="text-blue-400" />
                  <div>
                    <h3 className="text-xl font-bold">General DM Assistant</h3>
                    <p className="text-slate-400 text-sm">Configure how the AI responds to normal DMs when it's not a reel reply.</p>
                  </div>
                </div>
                
                <div className="p-8">
                  <label className="block text-slate-800 font-bold mb-2">Master System Prompt</label>
                  <p className="text-sm text-slate-500 mb-4">
                    Give your bot a personality. Tell it what your agency does, your pricing, and how to talk to clients.
                  </p>
                  <textarea 
                    value={dmMasterPrompt}
                    onChange={(e) => setDmMasterPrompt(e.target.value)}
                    className="w-full border border-slate-300 p-4 rounded-xl h-64 focus:ring-2 focus:ring-blue-600 outline-none text-slate-800 resize-none"
                    placeholder="Enter the IDM Master Prompt here..."
                  ></textarea>

                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleSaveDMPrompt}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:bg-slate-400"
                    >
                      <Save size={20} />
                      {loading ? "Saving..." : "Save Configuration"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, text, active = false, onClick }: { icon: React.ReactNode, text: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-blue-600/10 text-blue-500 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
      {icon} <span>{text}</span>
    </button>
  );
}