import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, SlidersHorizontal, Sparkles, Send, CheckCircle, ShieldAlert, Compass, UserCheck } from 'lucide-react';

export default function DiscoveryHub() {
  const [creators, setCreators] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxBudget, setMaxBudget] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');

  // Offer sending modal state
  const [activeOfferCreator, setActiveOfferCreator] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [offerBudget, setOfferBudget] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    async function loadHubData() {
      try {
        const creatorList = await api.getAllInfluencers();
        setCreators(creatorList);
        
        const campaignList = await api.getCampaigns();
        setCampaigns(campaignList);
        if (campaignList.length > 0) {
          setSelectedCampaignId(campaignList[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHubData();
  }, []);

  const handleSendOffer = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setModalLoading(true);
    try {
      const payload = {
        campaign_id: selectedCampaignId,
        influencer_profile_id: activeOfferCreator.id,
        offer_budget: parseFloat(offerBudget),
        brand_message: offerMessage,
      };
      await api.createCollaboration(payload);
      setModalSuccess(`Offer sent to ${activeOfferCreator.full_name}!`);
      setTimeout(() => {
        setActiveOfferCreator(null);
        setOfferBudget('');
        setOfferMessage('');
        setModalSuccess('');
      }, 1500);
    } catch (err) {
      setModalError(err.message || 'Failed to send collaboration offer.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg text-white">
        <div className="h-8 w-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter creator list
  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (creator.bio || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || creator.creator_category === selectedCategory;
    
    const matchesBudget = !maxBudget || creator.expected_charge <= parseFloat(maxBudget);
    
    let matchesPlatform = true;
    if (selectedPlatform !== 'All') {
      if (selectedPlatform === 'Instagram') matchesPlatform = !!creator.instagram_handle;
      if (selectedPlatform === 'YouTube') matchesPlatform = !!creator.youtube_handle;
      if (selectedPlatform === 'LinkedIn') matchesPlatform = !!creator.linkedin_handle;
      if (selectedPlatform === 'Twitter') matchesPlatform = !!creator.twitter_handle;
    }
    
    return matchesSearch && matchesCategory && matchesBudget && matchesPlatform;
  });

  return (
    <div className="p-8 bg-darkBg min-h-screen text-white space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Compass className="h-7 w-7 text-indigo-400" /> Creator Discovery Deck
        </h1>
        <p className="text-sm text-slateText mt-1">
          Explore and filter creators with SBERT content categorization and verified trust scores.
        </p>
      </div>

      {/* Filter panel */}
      <div className="p-6 rounded-2xl glassmorphism border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="text-xs text-slateText block mb-1.5">Search Creators</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slateText" />
            <input
              type="text"
              placeholder="Search by name or bio..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slateText block mb-1.5">Category Specialty</label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
          >
            <option value="All" className="bg-darkBg">All Specialities</option>
            <option value="Fitness" className="bg-darkBg">Fitness & Nutrition</option>
            <option value="Technology" className="bg-darkBg">Technology & Coding</option>
            <option value="Lifestyle" className="bg-darkBg">Lifestyle & Travel</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slateText block mb-1.5">Max Creator Fee ($)</label>
          <input
            type="number"
            placeholder="e.g. 1500"
            value={maxBudget}
            onChange={e => setMaxBudget(e.target.value)}
            className="w-full px-4 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-slateText block mb-1.5">Active Social Platform</label>
          <select
            value={selectedPlatform}
            onChange={e => setSelectedPlatform(e.target.value)}
            className="w-full px-4 py-2.5 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
          >
            <option value="All" className="bg-darkBg">All Channels</option>
            <option value="Instagram" className="bg-darkBg">Instagram</option>
            <option value="YouTube" className="bg-darkBg">YouTube</option>
            <option value="LinkedIn" className="bg-darkBg">LinkedIn</option>
            <option value="Twitter" className="bg-darkBg">Twitter (X)</option>
          </select>
        </div>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredCreators.length === 0 ? (
          <div className="md:col-span-3 text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <SlidersHorizontal className="h-10 w-10 text-slateText mx-auto mb-3" />
            <p className="text-slateText text-sm">No creators matching current filters found.</p>
          </div>
        ) : (
          filteredCreators.map(creator => (
            <div key={creator.id} className="p-6 rounded-2xl glassmorphism border border-white/5 flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{creator.full_name}</h3>
                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 font-semibold mt-1 inline-block">
                      {creator.creator_category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slateText block">Trust Score</span>
                    <span className="text-sm font-bold text-indigo-300 font-mono">{creator.trust_score}/10</span>
                  </div>
                </div>

                <p className="text-xs text-slateText leading-relaxed line-clamp-3">
                  {creator.bio || 'No biography details provided.'}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {creator.niches.map((niche, idx) => (
                    <span key={idx} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/80 border border-white/5">
                      #{niche}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slateText block">Asking Fee</span>
                  <span className="text-base font-extrabold text-white">${creator.expected_charge.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => setActiveOfferCreator(creator)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-xs font-semibold flex items-center gap-1.5 hover:shadow-glow cursor-pointer transition"
                >
                  <Send className="h-3.5 w-3.5" /> Send Offer
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* OFFER SENDING DIALOG/MODAL */}
      {activeOfferCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl glassmorphism border border-white/10 p-6 space-y-6 relative">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">Send Collab Offer to {activeOfferCreator.full_name}</h3>
                <p className="text-xs text-slateText">Define deal budgets and project message brief.</p>
              </div>
              <button
                onClick={() => setActiveOfferCreator(null)}
                className="text-slateText hover:text-white text-sm font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            {modalSuccess && (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-accentColor text-sm flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5" /> {modalSuccess}
              </div>
            )}

            {modalError && (
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
                {modalError}
              </div>
            )}

            {campaigns.length === 0 ? (
              <div className="py-6 text-center">
                <ShieldAlert className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                <p className="text-sm text-slateText mb-4">You must create a campaign brief first.</p>
              </div>
            ) : (
              <form onSubmit={handleSendOffer} className="space-y-4">
                <div>
                  <label className="text-xs text-slateText block mb-1">Select Campaign Brief</label>
                  <select
                    value={selectedCampaignId}
                    onChange={e => setSelectedCampaignId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none text-sm"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id} className="bg-darkBg">{c.product_name} (${c.budget.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slateText block mb-1">Offer Budget ($)</label>
                  <input
                    type="number"
                    required
                    value={offerBudget}
                    onChange={e => setOfferBudget(e.target.value)}
                    placeholder={activeOfferCreator.expected_charge}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slateText block mb-1">Direct Brand Message</label>
                  <textarea
                    required
                    value={offerMessage}
                    onChange={e => setOfferMessage(e.target.value)}
                    placeholder="Describe specific video deliverables or request details..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-white font-semibold flex items-center justify-center gap-2 hover:shadow-glow cursor-pointer transition disabled:opacity-50"
                >
                  {modalLoading ? 'Sending...' : 'Transmit Contract Offer'} <UserCheck className="h-4.5 w-4.5" />
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
