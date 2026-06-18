import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  MessageSquare, DollarSign, Calendar, Sparkles, CheckCircle, 
  XCircle, Clock, ChevronRight, ArrowLeft, ArrowUpRight 
} from 'lucide-react';

export default function Marketplace() {
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCollab, setSelectedCollab] = useState(null);
  
  // Negotiation form inputs
  const [counterBudget, setCounterBudget] = useState('');
  const [negotiationMsg, setNegotiationMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const role = api.getRole();

  async function loadCollaborations() {
    try {
      const list = await api.getCollaborations();
      setCollabs(list);
      if (list.length > 0 && !selectedCollab) {
        setSelectedCollab(list[0]);
      } else if (list.length > 0 && selectedCollab) {
        // Refresh selected collab
        const updated = list.find(x => x.id === selectedCollab.id);
        setSelectedCollab(updated || list[0]);
      }
    } catch (err) {
      setError('Failed to fetch marketplace data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCollaborations();
  }, []);

  const handleUpdateStatus = async (collabId, status) => {
    setActionLoading(true);
    try {
      await api.updateCollaboration(collabId, {
        status,
        sender_role: role
      });
      loadCollaborations();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCounter = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.updateCollaboration(selectedCollab.id, {
        status: 'negotiating',
        offer_budget: parseFloat(counterBudget),
        sender_role: role,
        brand_message: role === 'brand' ? negotiationMsg : undefined,
        influencer_message: role === 'influencer' ? negotiationMsg : undefined
      });
      setCounterBudget('');
      setNegotiationMsg('');
      loadCollaborations();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg text-white">
        <div className="h-8 w-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-darkBg min-h-screen text-white space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-indigo-400" /> Collaboration Marketplace
        </h1>
        <p className="text-sm text-slateText mt-1">
          Review, negotiate, and finalize active marketing campaign contracts.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {collabs.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
          <MessageSquare className="h-10 w-10 text-slateText mx-auto mb-3" />
          <h3 className="font-semibold text-base mb-1">No Active Negotiations</h3>
          <p className="text-xs text-slateText">Offers sent or received will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SIDEBAR: CONTRACTS LIST */}
          <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {collabs.map(collab => {
              const isSelected = selectedCollab?.id === collab.id;
              const otherParty = role === 'brand' ? collab.influencer?.full_name : 'Brand Partner';
              return (
                <div
                  key={collab.id}
                  onClick={() => setSelectedCollab(collab)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected ? 'border-indigo-500 bg-indigo-500/5 shadow-glow' : 'border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">{collab.campaign?.product_name}</h4>
                      <p className="text-xs text-slateText mt-1">Partner: {otherParty}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                      collab.status === 'accepted' ? 'bg-emerald-500/15 text-accentColor' :
                      collab.status === 'rejected' ? 'bg-rose-500/15 text-rose-300' :
                      collab.status === 'negotiating' ? 'bg-amber-500/15 text-amber-300' :
                      'bg-white/5 text-white/70'
                    }`}>
                      {collab.status}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-xs text-slateText">
                    <span>Active Deal</span>
                    <span className="font-bold text-white">${collab.offer_budget.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT VIEW: NEGOTIATION HUB */}
          {selectedCollab && (
            <div className="lg:col-span-2 p-6 rounded-2xl glassmorphism border border-white/5 space-y-6">
              
              {/* Header Info */}
              <div className="pb-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg">{selectedCollab.campaign?.product_name}</h3>
                  <p className="text-xs text-slateText mt-1">
                    Contract Deal ID: <span className="font-mono text-white/80">{selectedCollab.id}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slateText block">Active Offer Price</span>
                  <span className="text-2xl font-black text-indigo-400">${selectedCollab.offer_budget.toLocaleString()}</span>
                </div>
              </div>

              {/* Messages timeline details */}
              <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs text-slateText">
                  <span className="font-bold text-white/90 block mb-1">Brand Proposal Brief:</span>
                  {selectedCollab.brand_message || 'Brief details not added.'}
                </div>

                {selectedCollab.influencer_message && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-slateText">
                    <span className="font-bold text-emerald-400 block mb-1">Creator Response terms:</span>
                    {selectedCollab.influencer_message}
                  </div>
                )}
              </div>

              {/* Negotiations state updater */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                {selectedCollab.status !== 'accepted' && selectedCollab.status !== 'rejected' ? (
                  <div className="space-y-6">
                    {/* Primary actions if offer was sent by other party */}
                    {selectedCollab.sender_role !== role ? (
                      <div className="flex flex-wrap items-center gap-4">
                        <button
                          onClick={() => handleUpdateStatus(selectedCollab.id, 'accepted')}
                          disabled={actionLoading}
                          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <CheckCircle className="h-4.5 w-4.5" /> Sign Contract Agreement
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedCollab.id, 'rejected')}
                          disabled={actionLoading}
                          className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <XCircle className="h-4.5 w-4.5" /> Decline Offer
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 text-xs text-slateText flex items-center gap-2">
                        <Clock className="h-4.5 w-4.5 text-indigo-400 animate-spin" /> Pending other party review. You can still counter offer below.
                      </div>
                    )}

                    {/* Counter proposal form */}
                    <form onSubmit={handleSendCounter} className="space-y-4 p-4 rounded-xl border border-white/5 bg-white/5">
                      <h4 className="font-semibold text-sm">Send Counter Proposal</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="text-[10px] text-slateText block mb-1">New Counter Price ($)</label>
                          <input
                            type="number"
                            required
                            value={counterBudget}
                            onChange={e => setCounterBudget(e.target.value)}
                            placeholder={selectedCollab.offer_budget}
                            className="w-full px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] text-slateText block mb-1">Update Message / Terms</label>
                          <input
                            type="text"
                            required
                            value={negotiationMsg}
                            onChange={e => setNegotiationMsg(e.target.value)}
                            placeholder="Detail reasoning for pricing updates..."
                            className="w-full px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-primaryColor hover:bg-primaryColor/80 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        Send Counter Proposal <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl text-center border border-white/5 bg-white/5 text-sm font-semibold flex items-center justify-center gap-2">
                    {selectedCollab.status === 'accepted' ? (
                      <span className="text-emerald-400 flex items-center gap-2">✓ Contract Active & Finalized! Campaign in motion.</span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-2">✗ Contract offer was declined or rejected.</span>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
