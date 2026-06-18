import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Sparkles, Send } from 'lucide-react';

export default function CampaignCreator() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [goal, setGoal] = useState('Conversions');
  const [audience, setAudience] = useState('');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('United States');
  const [platform, setPlatform] = useState('Instagram');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        product_name: productName,
        product_description: description,
        budget: parseFloat(budget),
        campaign_goal: goal,
        target_audience: audience,
        campaign_duration_days: parseInt(duration),
        target_location: location,
        preferred_platform: platform,
      };
      await api.createCampaign(payload);
      navigate('/brand/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create campaign. Verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-darkBg min-h-screen text-white max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/brand/dashboard')}
        className="flex items-center gap-2 text-sm text-slateText hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="p-8 rounded-3xl glassmorphism border border-white/5 space-y-6 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-[60px]"></div>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" /> Create Campaign Brief
          </h1>
          <p className="text-xs text-slateText mt-1">
            Specify goals, product briefs, and budget. Prabhav AI recommendation modules will match creators instantly.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slateText block mb-1">Product Name</label>
              <input
                type="text" required value={productName} onChange={e => setProductName(e.target.value)}
                placeholder="e.g. Ergonomic Standing Desk"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slateText block mb-1">Product Description</label>
              <textarea
                required value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe product highlights, target features, and brand tone..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slateText block mb-1">Budget Allocation ($)</label>
                <input
                  type="number" required value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slateText block mb-1">Preferred Platform</label>
                <select
                  value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                >
                  <option value="Instagram" className="bg-darkBg">Instagram</option>
                  <option value="YouTube" className="bg-darkBg">YouTube</option>
                  <option value="LinkedIn" className="bg-darkBg">LinkedIn</option>
                  <option value="Twitter" className="bg-darkBg">Twitter (X)</option>
                  <option value="Cross-Platform" className="bg-darkBg">Cross-Platform</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slateText block mb-1">Campaign Goal</label>
                <select
                  value={goal} onChange={e => setGoal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                >
                  <option value="Conversions" className="bg-darkBg">Conversions (Sales/KPI)</option>
                  <option value="Reach" className="bg-darkBg">Reach & Impressions</option>
                  <option value="Engagement" className="bg-darkBg">Audience Engagement</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slateText block mb-1">Target Location</label>
                <input
                  type="text" required value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slateText block mb-1">Campaign Duration (days)</label>
                <input
                  type="number" required value={duration} onChange={e => setDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slateText block mb-1">Target Audience Profile</label>
                <input
                  type="text" required value={audience} onChange={e => setAudience(e.target.value)}
                  placeholder="e.g. Young professionals age 22-35 interested in ergonomics"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-white font-semibold flex items-center justify-center gap-2 hover:shadow-glow transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Submitting Brief...' : 'Publish Campaign Brief'} <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
