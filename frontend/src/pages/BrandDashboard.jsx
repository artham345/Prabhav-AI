import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, BarChart3, TrendingUp, Sparkles, UserCheck, DollarSign, Calendar, MessageSquare, ArrowUpRight } from 'lucide-react';

export default function BrandDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Market Intelligence States
  const [intelCategory, setIntelCategory] = useState('Fitness');
  const [intelData, setIntelData] = useState(null);
  const [intelLoading, setIntelLoading] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const brandProfile = await api.getBrandProfile();
        setProfile(brandProfile);
        
        const campaignsList = await api.getCampaigns();
        setCampaigns(campaignsList);
        
        const collabList = await api.getCollaborations();
        setCollaborations(collabList);
      } catch (err) {
        // If profile doesn't exist, redirect to Auth/Profile Setup
        if (err.message.includes('not found')) {
          navigate('/auth');
        } else {
          setError(err.message || 'Failed to load brand data.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [navigate]);

  useEffect(() => {
    async function loadMarketIntelligence() {
      setIntelLoading(true);
      try {
        const data = await api.getMarketIntelligence(intelCategory);
        setIntelData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIntelLoading(false);
      }
    }
    loadMarketIntelligence();
  }, [intelCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primaryColor border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slateText text-sm">Processing Brand Analytics...</p>
        </div>
      </div>
    );
  }

  const totalBudget = campaigns.reduce((acc, curr) => acc + curr.budget, 0);
  const acceptedCollabs = collaborations.filter(c => c.status === 'accepted');
  const spentBudget = acceptedCollabs.reduce((acc, curr) => acc + curr.offer_budget, 0);

  return (
    <div className="p-8 bg-darkBg min-h-screen text-white space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hi, {profile?.company_name || 'Brand Partner'}
          </h1>
          <p className="text-slateText text-sm mt-1">
            Industry: {profile?.industry} | Location: {profile?.location}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/brand/discover"
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold flex items-center gap-2 transition"
          >
            Discover Creators
          </Link>
          <Link
            to="/brand/create-campaign"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-white text-sm font-semibold flex items-center gap-2 hover:shadow-glow transition"
          >
            <Plus className="h-4 w-4" /> Create Campaign
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slateText block">Total Allocated Budget</span>
            <span className="text-2xl font-bold">₹{totalBudget.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slateText block">Spent Budget (Contracts)</span>
            <span className="text-2xl font-bold">₹{spentBudget.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slateText block">Average Projected ROI</span>
            <span className="text-2xl font-bold">3.2x</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slateText block">Active Deals (Collabs)</span>
            <span className="text-2xl font-bold">{collaborations.length}</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: MARKET INTELLIGENCE NICHE ANALYSIS */}
        <div className="lg:col-span-2 p-6 rounded-2xl glassmorphism border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primaryColor" /> Industry Niche Analysis
            </h2>
            <select
              value={intelCategory}
              onChange={(e) => setIntelCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none cursor-pointer"
            >
              {['Fitness', 'Technology', 'Finance', 'Education', 'Gaming', 'Fashion', 'Travel', 'Food', 'Beauty'].map(cat => (
                <option key={cat} value={cat} className="bg-darkBg">{cat}</option>
              ))}
            </select>
          </div>

          {intelLoading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="h-8 w-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : intelData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <span className="text-xs text-slateText block">Average Industry ROI</span>
                  <span className="text-xl font-bold text-accentColor">{intelData.average_roi}</span>
                </div>
                <div className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <span className="text-xs text-slateText block">Benchmark CPM Range</span>
                  <span className="text-xl font-bold text-indigo-300">{intelData.cpm_range}</span>
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-4">
                <h3 className="text-sm font-semibold text-white/95">Trending Niche Products</h3>
                <div className="flex flex-wrap gap-2">
                  {intelData.trending_products?.map((prod, idx) => (
                    <span key={idx} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full font-medium">
                      {prod}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white/95">Recommended Creators</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {intelData.recommended_creators?.map((creator) => (
                    <div key={creator.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="truncate pr-2">
                            <h4 className="font-bold text-sm text-white/95 truncate">{creator.full_name}</h4>
                            <span className="text-[10px] text-slateText block truncate">{creator.handle}</span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-300 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded shrink-0">
                            {creator.trust_score}/10
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-slateText">
                          <div>
                            <span>Followers:</span>
                            <span className="block font-semibold text-white/90">{creator.followers_count?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span>ER:</span>
                            <span className="block font-semibold text-white/90">{creator.engagement_rate}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slateText block">Asking Fee</span>
                          <span className="text-xs font-bold text-white">₹{creator.expected_charge?.toLocaleString()}</span>
                        </div>
                        <Link to="/brand/discover" className="text-[10px] text-indigo-400 hover:underline font-semibold">
                          Send Offer
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slateText text-sm">Failed to load market intelligence data.</p>
          )}
        </div>

        {/* RIGHT COLUMN: PLATFORM SUMMARY & INSIGHTS */}
        <div className="p-6 rounded-2xl glassmorphism border border-white/5 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondaryColor" /> Platform Summary
            </h2>
            
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-sm text-slateText">Connected Brand Goals</span>
                <span className="text-sm font-semibold">{profile?.marketing_goals?.join(', ') || 'Awareness'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-sm text-slateText">Target Geographies</span>
                <span className="text-sm font-semibold">{profile?.target_markets?.join(', ') || 'Global'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-sm text-slateText">Verified GST Number</span>
                <span className="text-xs bg-emerald-500/15 text-accentColor px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {profile?.gst_number ? 'Yes' : 'Not Provided'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-sm text-slateText">Business Registration ID</span>
                <span className="text-sm font-mono text-white/80">{profile?.business_reg_number || 'Pending'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slateText">Open Campaigns</span>
                <span className="text-sm font-semibold">{campaigns.length} Active</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 border-t border-white/5 pt-6">
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-indigo-300 leading-relaxed">
              💡 <strong>Tip:</strong> Technology and Finance niches feature high CPM rates in India but offer exceptionally high intent-driven conversion rates for SaaS and fintech brands.
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns list table */}
      <div className="p-6 rounded-2xl glassmorphism border border-white/5 space-y-6">
        <h2 className="text-lg font-bold">Campaigns Inventory</h2>
        
        {campaigns.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <Calendar className="h-10 w-10 text-slateText mx-auto mb-3" />
            <p className="text-sm text-slateText mb-4">No marketing campaigns created yet.</p>
            <Link
              to="/brand/create-campaign"
              className="px-4 py-2 rounded-xl bg-primaryColor hover:bg-primaryColor/80 text-sm font-semibold transition"
            >
              Create First Campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs text-slateText uppercase tracking-wider">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Budget (₹)</th>
                  <th className="py-3 px-4">Main Goal</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Target Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map(camp => (
                  <tr key={camp.id} className="hover:bg-white/5 text-sm transition">
                    <td className="py-4 px-4 font-semibold text-white/95">{camp.product_name}</td>
                    <td className="py-4 px-4 font-mono font-medium">₹{camp.budget.toLocaleString()}</td>
                    <td className="py-4 px-4">{camp.campaign_goal}</td>
                    <td className="py-4 px-4 capitalize">{camp.preferred_platform}</td>
                    <td className="py-4 px-4 text-slateText">{camp.target_location}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-accentColor border border-emerald-500/20">
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => navigate(`/brand/simulate/${camp.id}`)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition cursor-pointer"
                      >
                        Simulate & Optimize <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
