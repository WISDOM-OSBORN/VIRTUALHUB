import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldAlert, Mail, Lock, Sparkles, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StorageService } from '../services/storageService';
import { UserRole } from '../types';
import { useToast } from '../App';

export const AdminLogin: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const superEmail = 'abuyahwisdom@gmail.com';
    const superPassword = 'Qr3frrL4AQhqHhCE';
    const superName = 'WISDOM OSBORN ABUYAH';

    // Verify inputs correspond to requested Super Admin identity
    if (email.trim().toLowerCase() !== superEmail.toLowerCase() || password !== superPassword) {
      showToast("Access Denied: Invalid Administrative Credentials", "error");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Attempt to sign up the Super Admin to guarantee they exist in Supabase auth
      let authUserId = '';
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: superEmail,
          password: superPassword,
        });

        if (signUpError) {
          // If already registered, sign-up might fail (e.g. Email already exists), which is fine.
          // We will proceed to sign-in.
          if (!signUpError.message.includes("already registered") && !signUpError.message.includes("Use different email")) {
            throw signUpError;
          }
        }
        
        if (signUpData?.user) {
          authUserId = signUpData.user.id;
        }
      } catch (signUpErr) {
        console.log("Super Admin registration skipped (already exists or restricted):", signUpErr);
      }

      // Step 2: Sign in with the super administrator credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: superEmail,
        password: superPassword,
      });

      if (signInError) throw signInError;
      if (signInData?.user) {
        authUserId = signInData.user.id;
      }

      if (authUserId) {
        // Step 3: Explicitly write/update the profile state in the database as Admin/SuperAdmin
        await StorageService.updateProfile({
          id: authUserId,
          email: superEmail,
          name: superName,
          role: UserRole.Admin,
          company: 'UG ORID Directorates System Root'
        });

        showToast("Super Administrator Access Verified", "success");
        window.location.href = '#/dashboard';
        window.location.reload();
      } else {
        throw new Error("Could not resolve authorization token.");
      }
    } catch (err: any) {
      console.error("Admin Login Error:", err);
      showToast(err.message || "Failed to establish administrative privileges.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-white font-sans select-none">
      {/* Background Graphic Accents */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-ug-teal/10 to-transparent pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-ug-teal/10 blur-3xl rounded-full pointer-events-none animate-pulse"></div>
      
      {/* Container */}
      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex p-4 rounded-3xl bg-ug-teal/10 border border-ug-teal/20 mb-6 text-ug-teal"
          >
            <ShieldAlert size={36} />
          </motion.div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">
            Administrative Login
          </h2>
          <p className="mt-2 text-xs text-gray-500 font-mono tracking-wider max-w-sm mx-auto">
            Authorized Super Administrators Only. All transactions and alterations are audited on the blockchain database ledger.
          </p>
        </div>

        {/* Input Form Box */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-gray-900 border border-white/5 shadow-2xl rounded-[2.5rem] p-8 md:p-10 space-y-6"
        >
          <form onSubmit={handleAdminAuth} className="space-y-4 text-left">
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-mono">
                Admin Email Secure Index
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@institution.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-white placeholder-gray-600 focus:outline-none focus:border-ug-teal focus:bg-white/10 transition"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-mono">
                System Privilege Keyphrase
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-white placeholder-gray-600 focus:outline-none focus:border-ug-teal focus:bg-white/10 transition"
                />
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-ug-teal hover:bg-ug-teal/80 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition flex items-center justify-center gap-2 mt-6 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Verifying Identity Clearance...
                </>
              ) : (
                <>
                  Verify Credentials & Open Gate
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Dynamic Trust Badges */}
        <div className="flex items-center justify-center gap-6 text-gray-600 text-[9px] uppercase tracking-widest font-mono pt-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={10} className="text-ug-teal" />
            <span>Encrypted Tunnel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} className="text-ug-teal" />
            <span>Super Admin Override</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
