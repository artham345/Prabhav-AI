import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Sparkles, LogOut, Compass, Briefcase, MessageSquare, User as UserIcon, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const role = api.getRole();
  const isAuthenticated = api.isAuthenticated();

  const handleLogout = () => {
    api.logout();
    navigate('/auth');
  };

  return (
    <nav className="sticky top-0 z-50 glassmorphism border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-tr from-primaryColor to-secondaryColor p-2 rounded-xl shadow-glow">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <Link to="/" className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-whiteText to-slateText bg-clip-text text-transparent">
          PRABHAV AI
        </Link>
        {isAuthenticated && (
          <span className="ml-2 text-xs uppercase px-2.5 py-0.5 rounded-full border border-accentColor/30 bg-accentColor/10 text-accentColor font-semibold tracking-wider">
            {role} portal
          </span>
        )}
      </div>

      {isAuthenticated && (
        <div className="flex items-center gap-6">
          {role === 'brand' ? (
            <>
              <Link to="/brand/dashboard" className="flex items-center gap-2 text-sm text-slateText hover:text-whiteText transition">
                <Briefcase className="h-4 w-4" /> Campaigns
              </Link>
              <Link to="/brand/discover" className="flex items-center gap-2 text-sm text-slateText hover:text-whiteText transition">
                <Compass className="h-4 w-4" /> Discovery
              </Link>
              <Link to="/marketplace" className="flex items-center gap-2 text-sm text-slateText hover:text-whiteText transition">
                <MessageSquare className="h-4 w-4" /> Offers Inbox
              </Link>
            </>
          ) : (
            <>
              <Link to="/influencer/dashboard" className="flex items-center gap-2 text-sm text-slateText hover:text-whiteText transition">
                <UserIcon className="h-4 w-4" /> Media Kit
              </Link>
              <Link to="/marketplace" className="flex items-center gap-2 text-sm text-slateText hover:text-whiteText transition">
                <MessageSquare className="h-4 w-4" /> Offers Board
              </Link>
            </>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 font-medium transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      )}
    </nav>
  );
}
