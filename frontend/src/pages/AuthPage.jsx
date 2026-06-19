import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Sparkles, Building, User, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('brand'); // 'brand' or 'influencer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: auth, 2: profile details
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Brand profile fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessReg, setBusinessReg] = useState('');
  const [budgetMin, setBudgetMin] = useState(1000);
  const [budgetMax, setBudgetMax] = useState(10000);
  const [goals, setGoals] = useState('');
  const [markets, setMarkets] = useState('');

  // Influencer profile fields
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [igHandle, setIgHandle] = useState('');
  const [ytHandle, setYtHandle] = useState('');
  const [lnHandle, setLnHandle] = useState('');
  const [twHandle, setTwHandle] = useState('');
  const [category, setCategory] = useState('Fitness');
  const [niches, setNiches] = useState('');
  const [charge, setCharge] = useState(500);
  const [portfolio, setPortfolio] = useState('');
  const [prevBrands, setPrevBrands] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await api.login(email, password);
        const userRole = api.getRole();
        if (userRole === 'brand') {
          navigate('/brand/dashboard');
        } else {
          navigate('/influencer/dashboard');
        }
      } else {
        await api.register(email, password, role);
        // Automatically login
        await api.login(email, password);
        setSuccess('Account created! Let\'s set up your profile details.');
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (role === 'brand') {
        const payload = {
          company_name: companyName,
          industry,
          website,
          location,
          gst_number: gstNumber || null,
          business_reg_number: businessReg || null,
          budget_range_min: parseFloat(budgetMin),
          budget_range_max: parseFloat(budgetMax),
          marketing_goals: goals.split(',').map(s => s.trim()).filter(Boolean),
          target_markets: markets.split(',').map(s => s.trim()).filter(Boolean),
        };
        await api.createBrandProfile(payload);
        navigate('/brand/dashboard');
      } else {
        const payload = {
          full_name: fullName,
          bio,
          instagram_handle: igHandle || null,
          youtube_handle: ytHandle || null,
          linkedin_handle: lnHandle || null,
          twitter_handle: twHandle || null,
          creator_category: category,
          niches: niches.split(',').map(s => s.trim()).filter(Boolean),
          expected_charge: parseFloat(charge),
          portfolio_urls: portfolio.split(',').map(s => s.trim()).filter(Boolean),
          previous_brands: prevBrands.split(',').map(s => s.trim()).filter(Boolean),
        };
        await api.createInfluencerProfile(payload);
        // Automatically run ingestion
        await api.ingestIntelligence();
        navigate('/influencer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to create profile details.');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-6 bg-darkBg text-white">
      <div className="w-full max-w-xl p-8 rounded-3xl glassmorphism border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-primaryColor/20 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-secondaryColor/20 rounded-full blur-[80px]"></div>

        <div className="text-center mb-8 relative">
          <div className="inline-flex p-3 rounded-2xl bg-white/5 mb-3 border border-white/10">
            <Sparkles className="h-6 w-6 text-accentColor animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-whiteText via-slateText to-whiteText bg-clip-text text-transparent">
            {step === 1 ? (isLogin ? 'Welcome Back' : 'Create Account') : 'Setup Your Profile'}
          </h1>
          <p className="text-sm text-slateText mt-2">
            {step === 1 
              ? (isLogin ? 'Sign in to access campaign matches and AI forecasts.' : 'Sign up to start tracking or promoting brand campaigns.')
              : 'Complete details to power Prabhav AI recommendation and matching engines.'
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl border border-accentColor/20 bg-accentColor/10 text-accentColor text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleAuthSubmit} className="space-y-6 relative">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('brand')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border text-center transition cursor-pointer ${
                    role === 'brand' 
                      ? 'border-primaryColor bg-primaryColor/10 text-white shadow-glow' 
                      : 'border-white/5 bg-white/5 text-slateText hover:bg-white/10'
                  }`}
                >
                  <Building className="h-6 w-6" />
                  <span className="text-sm font-semibold">I am a Brand</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('influencer')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border text-center transition cursor-pointer ${
                    role === 'influencer' 
                      ? 'border-secondaryColor bg-secondaryColor/10 text-white shadow-glow' 
                      : 'border-white/5 bg-white/5 text-slateText hover:bg-white/10'
                  }`}
                >
                  <User className="h-6 w-6" />
                  <span className="text-sm font-semibold">I am a Creator</span>
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slateText" />
                <input
                  type="email"
                  required
                  placeholder="Business Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slateText focus:outline-none focus:border-primaryColor transition"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slateText" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slateText focus:outline-none focus:border-primaryColor transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-white font-semibold flex items-center justify-center gap-2 hover:shadow-glow transition cursor-pointer"
            >
              {isLogin ? 'Login Dashboard' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-slateText hover:text-white transition cursor-pointer"
              >
                {isLogin ? "New to Prabhav AI? Sign up here" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {role === 'brand' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slateText block mb-1">Company Name</label>
                  <input
                    type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Vedic Wellness"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primaryColor"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slateText block mb-1">Industry Category</label>
                    <input
                      type="text" required value={industry} onChange={e => setIndustry(e.target.value)}
                      placeholder="e.g. Health & Fitness"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primaryColor"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slateText block mb-1">Location</label>
                    <input
                      type="text" required value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Mumbai, IN"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primaryColor"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slateText block mb-1">Website URL</label>
                  <input
                    type="url" value={website} onChange={e => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primaryColor"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slateText block mb-1">GST Number (Optional)</label>
                    <input
                      type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)}
                      placeholder="27AAACV..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slateText block mb-1">Registration No. (Optional)</label>
                    <input
                      type="text" value={businessReg} onChange={e => setBusinessReg(e.target.value)}
                      placeholder="U72200MH..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slateText block mb-1">Min Budget (₹)</label>
                    <input
                      type="number" required value={budgetMin} onChange={e => setBudgetMin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slateText block mb-1">Max Budget (₹)</label>
                    <input
                      type="number" required value={budgetMax} onChange={e => setBudgetMax(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slateText block mb-1">Marketing Goals (comma separated)</label>
                  <input
                    type="text" value={goals} onChange={e => setGoals(e.target.value)}
                    placeholder="Brand Awareness, Drive Conversions, Lead Gen"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slateText block mb-1">Target Markets (comma separated)</label>
                  <input
                    type="text" value={markets} onChange={e => setMarkets(e.target.value)}
                    placeholder="United States, India, Europe"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slateText block mb-1">Full Name</label>
                  <input
                    type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-secondaryColor"
                  />
                </div>
                <div>
                  <label className="text-xs text-slateText block mb-1">Bio / Profile Description</label>
                  <textarea
                    value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Describe your content niche and style..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-secondaryColor resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slateText block mb-1">Creator Category</label>
                    <select
                       value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-secondaryColor"
                    >
                      <option value="Fitness" className="bg-darkBg">Fitness</option>
                      <option value="Technology" className="bg-darkBg">Technology</option>
                      <option value="Finance" className="bg-darkBg">Finance</option>
                      <option value="Education" className="bg-darkBg">Education</option>
                      <option value="Gaming" className="bg-darkBg">Gaming</option>
                      <option value="Fashion" className="bg-darkBg">Fashion</option>
                      <option value="Travel" className="bg-darkBg">Travel</option>
                      <option value="Food" className="bg-darkBg">Food</option>
                      <option value="Beauty" className="bg-darkBg">Beauty</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slateText block mb-1">Expected Charge per Collab (₹)</label>
                    <input
                      type="number" required value={charge} onChange={e => setCharge(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slateText block mb-1">Instagram Handle</label>
                    <input
                      type="text" placeholder="@rahul_fit" value={igHandle} onChange={e => setIgHandle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slateText block mb-1">YouTube Channel Handle</label>
                    <input
                      type="text" placeholder="RahulFitness" value={ytHandle} onChange={e => setYtHandle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slateText block mb-1">LinkedIn Profile</label>
                    <input
                      type="text" placeholder="rahul-sharma" value={lnHandle} onChange={e => setLnHandle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slateText block mb-1">Twitter (X) Handle</label>
                    <input
                      type="text" placeholder="rahul_codes" value={twHandle} onChange={e => setTwHandle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slateText block mb-1">Niches / Specializations (comma separated)</label>
                  <input
                    type="text" value={niches} onChange={e => setNiches(e.target.value)}
                    placeholder="Weight Lifting, Yoga, Clean Eating"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slateText block mb-1">Portfolio Links (comma separated URLs)</label>
                  <input
                    type="text" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                    placeholder="https://youtube.com/my-video, https://instagram.com/my-reel"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slateText block mb-1">Previous Brand Collaborations (comma separated)</label>
                  <input
                    type="text" value={prevBrands} onChange={e => setPrevBrands(e.target.value)}
                    placeholder="Gymshark, Nike, MyProtein"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor text-white font-semibold flex items-center justify-center gap-2 hover:shadow-glow transition cursor-pointer"
            >
              Complete Profile Ingestion <CheckCircle className="h-4.5 w-4.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
