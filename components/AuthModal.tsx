
import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, AlertCircle, Info, Eye, EyeOff, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { StorageService } from '../services/storageService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Researcher);
  const [userType, setUserType] = useState<'individual' | 'entity'>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; type: 'general' | 'rate-limit' | 'signup-disabled' } | null>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
      } else {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;

        if (authData.user) {
          // Create profile in profiles table
          await StorageService.updateProfile({
            id: authData.user.id,
            email,
            name: name || 'Anonymous User',
            role: role,
            user_type: (role === UserRole.Investor || role === UserRole.IndustryPartner) ? userType : 'individual'
          });
        }
      }
      onClose();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('rate limit')) {
        setError({
          message: "Email rate limit exceeded. Supabase only allows 3 emails per hour by default.",
          type: 'rate-limit'
        });
      } else if (msg.toLowerCase().includes('signups not allowed')) {
        setError({
          message: "Signups are currently disabled for this instance.",
          type: 'signup-disabled'
        });
      } else {
        let finalMsg = msg;
        if (msg.toLowerCase().includes('unprocessable') || msg.toLowerCase().includes('422')) {
          finalMsg = "Validation Error: Please ensure your email is valid and your password is at least 6 characters long.";
        }
        setError({
          message: finalMsg || 'An error occurred during authentication.',
          type: 'general'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    onClose();
    navigate('/forgot-password');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="h-32 bg-ug-navy relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center"></div>
            <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-ug-teal rounded-full flex items-center justify-center font-bold text-white text-xl mx-auto mb-2 shadow-lg border-2 border-white">
                    UG
                </div>
                <h2 className="text-white font-bold text-xl tracking-wide">Industry Hub</h2>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition"><X size={24} /></button>
        </div>

        <div className="p-8">
            {error && (
              <div className={`mb-6 p-4 rounded-xl flex flex-col gap-2 text-xs font-bold animate-pulse ${error.type === 'rate-limit' || error.type === 'signup-disabled' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error.message}</span>
                </div>
                {error.type === 'rate-limit' && (
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <Info size={12} /> Developer Fix:
                    </p>
                    <p className="mt-1 font-medium italic">Go to Supabase Dashboard → Auth → Settings. Disable "Confirm Email" to bypass this limit for testing.</p>
                  </div>
                )}
                {error.type === 'signup-disabled' && (
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <Info size={12} /> Developer Fix:
                    </p>
                    <p className="mt-1 font-medium italic">Go to Supabase Dashboard → Auth → Settings → Auth Providers → Email. Enable "Allow new users to sign up".</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex border-b border-gray-100 mb-6">
                <button 
                    className={`flex-1 pb-3 text-sm font-black transition-colors ${isLogin ? 'text-ug-teal border-b-2 border-ug-teal' : 'text-gray-400'}`}
                    onClick={() => setIsLogin(true)}
                >
                    Login
                </button>
                <button 
                    className={`flex-1 pb-3 text-sm font-black transition-colors ${!isLogin ? 'text-ug-teal border-b-2 border-ug-teal' : 'text-gray-400'}`}
                    onClick={() => setIsLogin(false)}
                >
                    Join Hub
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input required type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ug-teal/20 focus:border-ug-teal text-sm font-bold bg-gray-50" />
                  </div>
                )}

                {!isLogin && (
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <ArrowRight size={18} />
                    </div>
                    <select 
                      value={role} 
                      onChange={(e) => {
                        const nextRole = e.target.value as UserRole;
                        setRole(nextRole);
                        if (nextRole !== UserRole.Investor && nextRole !== UserRole.IndustryPartner) {
                          setUserType('individual');
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ug-teal/20 focus:border-ug-teal text-sm font-bold bg-gray-50 appearance-none"
                    >
                      {Object.values(UserRole).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!isLogin && (role === UserRole.Investor || role === UserRole.IndustryPartner) && (
                  <div className="relative animate-fade-in-up">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <Target size={18} />
                    </div>
                    <select 
                      value={userType} 
                      onChange={(e) => setUserType(e.target.value as 'individual' | 'entity')}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ug-teal/20 focus:border-ug-teal text-sm font-bold bg-gray-50 appearance-none"
                    >
                      <option value="individual">Individual Setup</option>
                      <option value="entity">Firm / NGO / Entity Setup</option>
                    </select>
                  </div>
                )}

                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input required type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ug-teal/20 focus:border-ug-teal text-sm font-bold bg-gray-50" />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      required 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ug-teal/20 focus:border-ug-teal text-sm font-bold bg-gray-50" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-ug-teal transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {!isLogin && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      required 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Confirm Password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ug-teal/20 focus:border-ug-teal text-sm font-bold bg-gray-50" 
                    />
                  </div>
                )}

                {isLogin && (
                  <div className="text-right">
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-[10px] font-black text-ug-teal uppercase tracking-widest hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-ug-navy text-white py-3 rounded-lg font-black uppercase tracking-widest hover:bg-opacity-90 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-lg"
                >
                    {loading ? 'Authenticating...' : 'Enter Hub'} <ArrowRight size={18} />
                </button>
            </form>

            <p className="text-center text-[10px] text-gray-400 mt-6 leading-relaxed font-bold uppercase tracking-widest">
                Protected by UG Research Governance & Ghana Data Protection Act (Act 843).
            </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
