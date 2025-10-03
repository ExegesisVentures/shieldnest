// apps/web/src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Wallet, TrendingUp, Users, ArrowRight, ExternalLink } from 'lucide-react';
import { WalletButton } from '@/components/wallet/WalletButton';
import { ExitIntentPrompt } from '@/components/misc/ExitIntentPrompt';
import { UpgradePrompt } from '@/components/misc/UpgradePrompt';
import { useSession } from '@/contexts/SessionContext';
import { useVisitorState } from '@/hooks/useVisitorState';
import { useExitIntent } from '@/hooks/useExitIntent';
import Link from 'next/link';

/**
 * Landing page for ShieldNest
 */
export default function LandingPage() {
  const { session } = useSession();
  const { shouldShowUpgradePrompt, markAsNudged } = useVisitorState();
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [showUpgradeToast, setShowUpgradeToast] = useState(false);

  // Exit intent detection for visitors
  useExitIntent({
    enabled: session.type === 'visitor' && shouldShowUpgradePrompt(),
    onExitIntent: () => setShowExitIntent(true),
  });

  // Show upgrade toast after wallet connection
  useEffect(() => {
    if (session.type === 'visitor' && shouldShowUpgradePrompt()) {
      const timer = setTimeout(() => {
        setShowUpgradeToast(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [session.type, shouldShowUpgradePrompt]);

  const handleSignUp = async (email: string) => {
    try {
      // TODO(v1): Implement actual sign up logic
      console.log('Sign up with email:', email);
      
      // For now, just mark as nudged
      markAsNudged();
      setShowExitIntent(false);
      setShowUpgradeToast(false);
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  const handleUpgradeClick = () => {
    // TODO(v1): Navigate to sign up page or open modal
    console.log('Upgrade clicked');
    setShowUpgradeToast(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/tokens/shld_light.svg" 
                alt="ShieldNest" 
                className="h-8 w-8"
                onError={(e) => {
                  // Fallback to Shield icon if logo not found
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">ShieldNest</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {session.type !== 'visitor' && (
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Dashboard
                </Link>
              )}
              
              <WalletButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Secure Coreum Portfolio 
              <span className="text-primary-600 block">Dashboard</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Professional-grade portfolio tracking for Coreum users. 
              Connect your wallets, track your assets, and unlock exclusive features 
              with Shield NFT membership.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <WalletButton 
                className="w-full sm:w-auto"
                onConnected={() => {
                  if (session.type === 'visitor') {
                    setTimeout(() => setShowUpgradeToast(true), 1000);
                  }
                }}
              />
              
              <Link
                href="/membership"
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <span>Learn about membership</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary-100 rounded-full opacity-50 blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-shield-100 rounded-full opacity-50 blur-xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose ShieldNest?
            </h2>
            <p className="text-lg text-gray-600">
              Built specifically for the Coreum ecosystem with security and usability in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Multi-Wallet Support */}
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Multi-Wallet Support
              </h3>
              <p className="text-gray-600">
                Connect Keplr, Leap, Cosmostation, or track addresses manually. 
                Your portfolio, your way.
              </p>
            </div>

            {/* Portfolio Tracking */}
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Portfolio Tracking
              </h3>
              <p className="text-gray-600">
                Real-time Coreum asset tracking with detailed analytics and 
                historical performance data.
              </p>
            </div>

            {/* Exclusive Membership */}
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Exclusive Membership
              </h3>
              <p className="text-gray-600">
                Shield NFT holders get access to advanced features, early DEX access, 
                and premium analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shield NFT Section */}
      <section className="py-16 bg-gradient-shield text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">
              Shield NFT Membership
            </h2>
            <p className="text-xl text-shield-100 max-w-2xl mx-auto mb-8">
              Unlock exclusive features with Shield NFT ownership. 
              Get priority access to new features, advanced analytics, 
              and join our exclusive member community.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Member Benefits</h3>
                <ul className="space-y-2 text-shield-100">
                  <li>• Advanced portfolio analytics</li>
                  <li>• Early DEX trading access</li>
                  <li>• Priority customer support</li>
                  <li>• Exclusive community access</li>
                </ul>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">NFT Value</h3>
                <p className="text-shield-100 mb-4">
                  Shield NFTs are valued between $5,000 - $6,000 and provide 
                  ongoing utility within the ShieldNest ecosystem.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center space-x-2 text-white hover:text-shield-100 font-medium"
                >
                  <span>Request Membership</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6" />
                <span className="text-lg font-bold">ShieldNest</span>
              </div>
              <p className="text-gray-400">
                Secure, professional portfolio management for the Coreum ecosystem.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Portfolio Tracking</li>
                <li>Multi-Wallet Support</li>
                <li>Shield NFT Membership</li>
                <li>Coreum Integration</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Community</li>
                <li>Support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Security</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Security Audit</li>
                <li>Bug Bounty</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ShieldNest. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Prompts */}
      <ExitIntentPrompt
        isOpen={showExitIntent}
        onClose={() => setShowExitIntent(false)}
        onSignUp={handleSignUp}
      />
      
      <UpgradePrompt
        isVisible={showUpgradeToast}
        onClose={() => setShowUpgradeToast(false)}
        onUpgrade={handleUpgradeClick}
      />
    </div>
  );
}
