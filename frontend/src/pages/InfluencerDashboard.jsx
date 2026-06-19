import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Sparkles, Radio, Users, Check, X, ShieldAlert, 
  HelpCircle, MessageSquare, RefreshCw, BarChart2, DollarSign, Calendar
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [error, setError] = useState('');

  // Negotiation states
  const [negotiatingCollabId, setNegotiatingCollabId] = useState(null);
  const [counterBudget, setCounterBudget] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function loadInfluencerData() {
    try {
      const creatorProfile = await api.getInfluencerProfile();
      setProfile(creatorProfile);
      
      const collabOffers = await api.getCollaborations();
      setOffers(collabOffers);
    } catch (err) {
      if (err.message.includes('not found')) {
        navigate('/auth');
      } else {
        setError(err.message || 'Failed to load influencer data.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInfluencerData();
  }, [navigate]);

  const handleRunIngestion = async () => {
    setIngestLoading(true);
    setError('');
    try {
      const updated = await api.ingestIntelligence();
      setProfile(updated);
    } catch (err) {
      setError(err.message || 'Scraping and ingestion failed.');
    } finally {
      setIngestLoading(false);
    }
  };

  const handleAcceptOffer = async (collabId) => {
    setActionLoading(true);
    try {
      await api.updateCollaboration(collabId, {
        status: 'accepted',
        sender_role: 'influencer'
      });
      loadInfluencerData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffer = async (collabId) => {
    setActionLoading(true);
    try {
      await api.updateCollaboration(collabId, {
        status: 'rejected',
        sender_role: 'influencer'
      });
      loadInfluencerData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNegotiateOffer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.updateCollaboration(negotiatingCollabId, {
        status: 'negotiating',
        offer_budget: parseFloat(counterBudget),
        influencer_message: counterMessage,
        sender_role: 'influencer'
      });
      setNegotiatingCollabId(null);
      setCounterBudget('');
      setCounterMessage('');
      loadInfluencerData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg text-white">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate stats
  const totalFollowers = profile?.social_data.reduce((acc, curr) => acc + curr.followers_count, 0) || 0;
  
  // Format data for niche distribution pie chart
  // Fetch niches from primary linked account
  let dominantNiches = {};
  if (profile?.social_data && profile.social_data.length > 0) {
    dominantNiches = profile.social_data[0].content_categories || {};
  }
  
  const pieData = Object.entries(dominantNiches).map(([name, val]) => ({
    name,
    value: Math.round(val * 100)
  }));

  const COLORS = ['#6366F1', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6'];

  return (
    <div className="p-8 bg-darkBg min-h-screen text-white space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {profile?.full_name}</h1>
          <p className="text-sm text-slateText mt-1">Bio: {profile?.bio || 'Creator Portfolio Active'}</p>
        </div>
        <div>
          <button
            onClick={handleRunIngestion}
            disabled={ingestLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-white text-sm font-semibold flex items-center gap-2 hover:shadow-glow transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${ingestLoading ? 'animate-spin' : ''}`} />
            {ingestLoading ? 'Ingesting Feeds...' : 'Sync Creator Profile Intelligence'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Creator KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slateText block">Aggregated Audience</span>
            <span className="text-2xl font-bold">{totalFollowers.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slateText block">Avg Engagement Rate</span>
            <span className="text-2xl font-bold">
              {profile?.social_data.length > 0
                ? (profile.social_data.reduce((acc, curr) => acc + curr.engagement_rate, 0) / profile.social_data.length).toFixed(1)
                : '3.5'}%
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slateText block">Asking Collab Rate</span>
            <span className="text-2xl font-bold">₹{profile?.expected_charge.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slateText block">Prabhav Trust Score</span>
            <span className="text-2xl font-bold">{profile?.trust_score}/10</span>
          </div>
        </div>
      </div>

      {/* Main Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dominant Content Niches Breakdown */}
        <div className="lg:col-span-1 p-6 rounded-2xl glassmorphism border border-white/5 space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-400" /> Unified Profile Intelligence
            </h2>
            <p className="text-xs text-slateText mt-0.5">SBERT content classification breakdown.</p>
          </div>

          {pieData.length === 0 ? (
            <div className="text-center py-12 text-slateText text-sm">
              No platform intelligence ingested. Please click "Sync Creator Profile" above.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress bars niches */}
              <div className="space-y-4">
                {pieData.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{item.name}</span>
                      <span className="text-indigo-400">{item.value}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-primaryColor to-secondaryColor rounded-full" 
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Brand Collab Deals Inbox */}
        <div className="lg:col-span-2 p-6 rounded-2xl glassmorphism border border-white/5 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400" /> Collab Offers Inbox
          </h2>

          {offers.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
              <MessageSquare className="h-8 w-8 text-slateText mx-auto mb-2" />
              <p className="text-slateText text-sm">Your offer board is empty. Brands will reach out here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {offers.map(off => (
                <div key={off.id} className="p-5 rounded-xl border border-white/5 bg-white/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-indigo-300">Campaign Product: {off.campaign?.product_name}</h3>
                      <p className="text-xs text-slateText mt-1">Goal: {off.campaign?.campaign_goal} • Duration: {off.campaign?.campaign_duration_days} days</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slateText block">Offer Fee</span>
                      <span className="text-base font-bold text-white">₹{off.offer_budget.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 text-xs text-slateText leading-relaxed">
                    <span className="font-semibold text-white/80 block mb-1">Brand Brief Message:</span>
                    {off.brand_message || 'No brand message brief attached.'}
                  </div>

                  {off.status === 'negotiating' && off.influencer_message && (
                    <div className="p-3.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs text-slateText leading-relaxed">
                      <span className="font-semibold text-indigo-300 block mb-1">Your Counter Proposal:</span>
                      ₹{off.offer_budget.toLocaleString()} — {off.influencer_message}
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Status: 
                      <span className={`ml-1.5 px-2 py-0.5 rounded text-[10px] ${
                        off.status === 'accepted' ? 'bg-emerald-500/15 text-accentColor' :
                        off.status === 'rejected' ? 'bg-rose-500/15 text-rose-300' :
                        off.status === 'negotiating' ? 'bg-amber-500/15 text-amber-300' :
                        'bg-white/5 text-white/70'
                      }`}>
                        {off.status}
                      </span>
                    </span>

                    {off.status === 'sent' && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAcceptOffer(off.id)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => handleRejectOffer(off.id)}
                          className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => setNegotiatingCollabId(off.id)}
                          className="px-3 py-1.5 rounded-lg border border-white/10 text-slateText hover:text-white hover:bg-white/5 text-xs font-semibold cursor-pointer transition"
                        >
                          Counter Offer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COUNTER OFFER MODAL */}
      {negotiatingCollabId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl glassmorphism border border-white/10 p-6 space-y-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">Send Counter Offer Proposal</h3>
                <p className="text-xs text-slateText font-medium">Negotiate contract prices or schedules.</p>
              </div>
              <button
                onClick={() => setNegotiatingCollabId(null)}
                className="text-slateText hover:text-white text-sm font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleNegotiateOffer} className="space-y-4">
              <div>
                <label className="text-xs text-slateText block mb-1">Counter Price (₹)</label>
                <input
                  type="number"
                  required
                  value={counterBudget}
                  onChange={e => setCounterBudget(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slateText block mb-1">Negotiation terms / message</label>
                <textarea
                  required
                  value={counterMessage}
                  onChange={e => setCounterMessage(e.target.value)}
                  rows={3}
                  placeholder="Describe your reasoning or schedule adjustments..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-white font-semibold flex items-center justify-center gap-1.5 hover:shadow-glow cursor-pointer transition"
              >
                Send Proposal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
