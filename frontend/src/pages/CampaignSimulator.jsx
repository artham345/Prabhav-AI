import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ArrowLeft, Cpu, Sparkles, Check, Play, UserCheck, 
  MessageSquare, HelpCircle, BarChart3, Users, DollarSign,
  AlertTriangle, ShieldCheck, ChevronRight, BarChart2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function CampaignSimulator() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState([]);
  const [activeTab, setActiveTab] = useState('simulate'); // 'simulate', 'sentiment', 'advisor'
  
  // Fit report modal state
  const [fitInfluencer, setFitInfluencer] = useState(null);
  const [fitReport, setFitReport] = useState(null);
  const [fitLoading, setFitLoading] = useState(false);
  
  // Simulator state
  const [simName, setSimName] = useState('Optimized Scenario A');
  const [simBudget, setSimBudget] = useState(5000);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  
  // Sentiment state
  const [commentsInput, setCommentsInput] = useState(
    "Wow this product looks awesome! Just ordered one.\n" +
    "Honestly overpriced. The shipping was slow.\n" +
    "Is it compatible with Mac computers? Let me know.\n" +
    "Best purchase of the year, absolute game changer!"
  );
  const [sentimentResult, setSentimentResult] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  
  // Advisor state
  const [adviceResult, setAdviceResult] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCampaignDetails() {
      try {
        const camp = await api.getCampaignById(campaignId);
        setCampaign(camp);
        setSimBudget(camp.budget);
        
        const recs = await api.getRecommendations(campaignId);
        setRecommendations(recs);
      } catch (err) {
        setError(err.message || 'Failed to load campaign data.');
      } finally {
        setLoading(false);
      }
    }
    loadCampaignDetails();
  }, [campaignId]);

  const toggleSelectInfluencer = (id) => {
    if (selectedInfluencers.includes(id)) {
      setSelectedInfluencers(selectedInfluencers.filter(x => x !== id));
    } else {
      setSelectedInfluencers([...selectedInfluencers, id]);
    }
  };

  const handleAudienceFitCheck = async (inf) => {
    setFitInfluencer(inf);
    setFitLoading(true);
    setFitReport(null);
    try {
      const report = await api.getAudienceFit(campaignId, inf.influencer_id);
      setFitReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setFitLoading(false);
    }
  };

  const runSimulation = async (e) => {
    e.preventDefault();
    if (selectedInfluencers.length === 0) {
      setError('Please select at least one influencer to include in the simulation.');
      return;
    }
    setError('');
    setSimLoading(true);
    try {
      const payload = {
        scenario_name: simName,
        budget: parseFloat(simBudget),
        influencer_ids: selectedInfluencers
      };
      const result = await api.simulateCampaign(campaignId, payload);
      setSimulationResult(result);
    } catch (err) {
      setError(err.message || 'Simulation failed.');
    } finally {
      setSimLoading(false);
    }
  };

  const runSentimentAnalysis = async () => {
    setSentimentLoading(true);
    setSentimentResult(null);
    try {
      const commentsArray = commentsInput.split('\n').map(s => s.trim()).filter(Boolean);
      const res = await api.getSentimentAnalysis(campaignId, commentsArray);
      setSentimentResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSentimentLoading(false);
    }
  };

  const fetchAdvisorAdvice = async () => {
    setAdviceLoading(true);
    setAdviceResult(null);
    try {
      const res = await api.getAdvisorSuggestions(campaignId);
      setAdviceResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAdviceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg text-white">
        <div className="h-10 w-10 border-4 border-primaryColor border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Pre-formatted data for chart comparison
  const simulationChartData = simulationResult ? [
    {
      name: 'Scenario Metrics',
      Conversions: simulationResult.expected_conversions * 10, // scaled for chart visibility
      Reach: simulationResult.expected_reach / 100,            // scaled
      Revenue: simulationResult.expected_revenue / 10,        // scaled
      ROI: simulationResult.expected_roi * 100                 // scaled
    }
  ] : [];

  return (
    <div className="p-8 bg-darkBg min-h-screen text-white space-y-8 max-w-7xl mx-auto relative">
      <button
        onClick={() => navigate('/brand/dashboard')}
        className="flex items-center gap-2 text-sm text-slateText hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Brand Dashboard
      </button>

      {/* Campaign Details Header */}
      <div className="p-6 rounded-2xl glassmorphism border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs text-primaryColor font-bold tracking-wider uppercase">Active Simulator Brief</span>
          <h1 className="text-2xl font-bold mt-1">{campaign?.product_name}</h1>
          <p className="text-xs text-slateText mt-1 max-w-2xl">{campaign?.product_description}</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-center">
            <span className="text-xs text-slateText block">Brief Budget</span>
            <span className="text-lg font-bold">${campaign?.budget.toLocaleString()}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-center">
            <span className="text-xs text-slateText block">Target Geo</span>
            <span className="text-lg font-bold">{campaign?.target_location}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RECOMMENDATION LIST DECK */}
        <div className="lg:col-span-1 p-6 rounded-2xl glassmorphism border border-white/5 space-y-6 max-h-[85vh] overflow-y-auto">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" /> Matches Recommended
            </h2>
            <p className="text-xs text-slateText mt-0.5">Select creators to simulate pre-campaign impact.</p>
          </div>

          <div className="space-y-4">
            {recommendations.map(rec => {
              const isSelected = selectedInfluencers.includes(rec.influencer_id);
              return (
                <div 
                  key={rec.influencer_id}
                  className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                    isSelected ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                  onClick={() => toggleSelectInfluencer(rec.influencer_id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        {rec.full_name} 
                        {isSelected && <span className="h-4 w-4 bg-primaryColor text-white rounded-full flex items-center justify-center p-0.5"><Check className="h-3 w-3" /></span>}
                      </h3>
                      <p className="text-xs text-slateText mt-0.5 capitalize">{rec.platform} • {rec.followers_count.toLocaleString()} fans</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-accentColor bg-accentColor/10 px-2 py-0.5 rounded border border-accentColor/25">
                        {rec.match_score}% Match
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs border-t border-white/5 pt-3">
                    <div>
                      <span className="text-slateText block">Charge</span>
                      <span className="font-semibold text-white/90">${rec.expected_charge.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slateText block">Engagement</span>
                      <span className="font-semibold text-white/90">{rec.engagement_rate}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAudienceFitCheck(rec);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Demographics
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIMULATION AND AI INTERFACES */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab('simulate')}
              className={`pb-4 px-6 font-semibold text-sm border-b-2 transition cursor-pointer ${
                activeTab === 'simulate' ? 'border-primaryColor text-white' : 'border-transparent text-slateText hover:text-white'
              }`}
            >
              <Cpu className="inline h-4 w-4 mr-1.5" /> XGBoost Scenario Simulator
            </button>
            <button
              onClick={() => setActiveTab('sentiment')}
              className={`pb-4 px-6 font-semibold text-sm border-b-2 transition cursor-pointer ${
                activeTab === 'sentiment' ? 'border-primaryColor text-white' : 'border-transparent text-slateText hover:text-white'
              }`}
            >
              <MessageSquare className="inline h-4 w-4 mr-1.5" /> Sentiment Analysis
            </button>
            <button
              onClick={() => setActiveTab('advisor')}
              className={`pb-4 px-6 font-semibold text-sm border-b-2 transition cursor-pointer ${
                activeTab === 'advisor' ? 'border-primaryColor text-white' : 'border-transparent text-slateText hover:text-white'
              }`}
            >
              <Sparkles className="inline h-4 w-4 mr-1.5" /> AI Campaign Advisor
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* TAB 1: SCENARIO SIMULATION */}
          {activeTab === 'simulate' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl glassmorphism border border-white/5 space-y-6">
                <h3 className="font-bold text-lg">Configure Simulation Model</h3>
                <form onSubmit={runSimulation} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="text-xs text-slateText block mb-1">Scenario Name</label>
                    <input 
                      type="text" value={simName} onChange={e => setSimName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs text-slateText block mb-1">Simulated Budget ($)</label>
                    <input 
                      type="number" value={simBudget} onChange={e => setSimBudget(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="submit"
                      disabled={simLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-white font-semibold flex items-center justify-center gap-2 hover:shadow-glow transition cursor-pointer disabled:opacity-50"
                    >
                      {simLoading ? 'Running XGBoost...' : 'Run Simulation'} <Play className="h-4 w-4 fill-white" />
                    </button>
                  </div>
                </form>
              </div>

              {simulationResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Results Box */}
                  <div className="p-6 rounded-2xl glassmorphism border border-white/5 space-y-6">
                    <h4 className="font-bold text-base flex items-center gap-2 text-accentColor">
                      <ShieldCheck className="h-5 w-5" /> Predictions Summary
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-xs text-slateText block">Expected Reach</span>
                        <span className="text-xl font-bold text-white/95">{simulationResult.expected_reach.toLocaleString()}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-xs text-slateText block">Conversions</span>
                        <span className="text-xl font-bold text-white/95">{simulationResult.expected_conversions.toLocaleString()}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-xs text-slateText block">Estimated Revenue</span>
                        <span className="text-xl font-bold text-white/95">${simulationResult.expected_revenue.toLocaleString()}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-xs text-slateText block">Projected ROI</span>
                        <span className="text-xl font-bold text-white/95">{simulationResult.expected_roi.toFixed(2)}x</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart representation */}
                  <div className="p-6 rounded-2xl glassmorphism border border-white/5 space-y-4">
                    <h4 className="font-bold text-base">Impact Index Visualizer</h4>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={simulationChartData}>
                          <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#161D30' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="Conversions" fill="#6366F1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="ROI" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SENTIMENT ANALYSIS */}
          {activeTab === 'sentiment' && (
            <div className="p-6 rounded-2xl glassmorphism border border-white/5 space-y-6">
              <div>
                <h3 className="font-bold text-lg">Perception & Comment Sentiment Engine</h3>
                <p className="text-xs text-slateText mt-1">Paste customer comments to runs RoBERTa analysis.</p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={commentsInput}
                  onChange={e => setCommentsInput(e.target.value)}
                  rows={6}
                  placeholder="Paste comments, one per line..."
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slateText focus:outline-none focus:border-indigo-500 font-mono text-sm resize-none"
                />

                <button
                  onClick={runSentimentAnalysis}
                  disabled={sentimentLoading}
                  className="px-6 py-2.5 rounded-xl bg-primaryColor hover:bg-primaryColor/80 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  {sentimentLoading ? 'Analyzing Feed...' : 'Analyze Sentiment Feed'} <BarChart2 className="h-4.5 w-4.5" />
                </button>
              </div>

              {sentimentResult && (
                <div className="p-6 rounded-xl border border-white/5 bg-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-4 flex flex-col justify-center">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-sm text-emerald-400 font-semibold">Positive</span>
                      <span className="text-lg font-bold">{sentimentResult.positive_pct}%</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-sm text-slateText font-semibold">Neutral</span>
                      <span className="text-lg font-bold">{sentimentResult.neutral_pct}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-rose-400 font-semibold">Negative</span>
                      <span className="text-lg font-bold">{sentimentResult.negative_pct}%</span>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="font-bold text-sm text-slateText">Perception Analysis Summary</h4>
                    <p className="text-sm text-white/90 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                      {sentimentResult.analysis_summary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI CAMPAIGN ADVISOR */}
          {activeTab === 'advisor' && (
            <div className="p-6 rounded-2xl glassmorphism border border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">AI Campaign Advisor</h3>
                  <p className="text-xs text-slateText mt-1">Generates custom advice using the Gemini API.</p>
                </div>
                <button
                  onClick={fetchAdvisorAdvice}
                  disabled={adviceLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition hover:shadow-glow disabled:opacity-50"
                >
                  {adviceLoading ? 'Consulting Gemini...' : 'Generate AI Advice'} <Sparkles className="h-4.5 w-4.5 text-accentColor animate-pulse" />
                </button>
              </div>

              {adviceResult && (
                <div className="space-y-6 pt-4 border-t border-white/5">
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-xs text-indigo-400 font-bold block mb-1">RECOMMENDED MATCH</span>
                    <span className="text-lg font-extrabold text-white">{adviceResult.best_influencer_recommendation}</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slateText flex items-center gap-1.5"><ChevronRight className="h-4 w-4 text-primaryColor" /> Selection Reasoning</h4>
                      <p className="text-sm text-white/90 mt-1 leading-relaxed pl-5">{adviceResult.detailed_reasoning}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slateText flex items-center gap-1.5"><ChevronRight className="h-4 w-4 text-primaryColor" /> Optimization Suggestions</h4>
                      <ul className="list-disc pl-10 text-sm text-white/90 space-y-2 mt-2">
                        {adviceResult.optimization_suggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
                        <h5 className="text-sm font-bold text-rose-300 flex items-center gap-2"><AlertTriangle className="h-4.5 w-4.5 text-rose-400" /> Risks Report</h5>
                        <p className="text-xs text-white/80 mt-2 leading-relaxed">{adviceResult.risk_analysis}</p>
                      </div>

                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <h5 className="text-sm font-bold text-emerald-300 flex items-center gap-2"><ShieldCheck className="h-4.5 w-4.5 text-emerald-400" /> Budget Allocation Advice</h5>
                        <p className="text-xs text-white/80 mt-2 leading-relaxed">{adviceResult.budget_allocation_advice}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* DEMOGRAPHICS MODAL POPUP */}
      {fitInfluencer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl glassmorphism border border-white/10 p-6 space-y-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{fitInfluencer.full_name}'s Audience</h3>
                <p className="text-xs text-slateText">SBERT Audience Intelligence Report</p>
              </div>
              <button
                onClick={() => setFitInfluencer(null)}
                className="text-slateText hover:text-white text-sm font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            {fitLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slateText">Generating Brand Alignment Report...</p>
              </div>
            ) : (
              fitReport && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-xs text-slateText block">Brand Compatibility Score</span>
                    <span className="text-2xl font-extrabold text-accentColor">{fitReport.audience_fit_score}%</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs text-slateText font-bold uppercase">Demographic Distribution</h4>
                      <p className="text-sm text-white/90 mt-1 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        {fitReport.demographic_report}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs text-slateText font-bold uppercase">Audience Affinity Report</h4>
                      <p className="text-sm text-white/90 mt-1 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        {fitReport.interest_compatibility_report}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
