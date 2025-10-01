import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  ShieldCheckIcon,
  EyeIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BanknotesIcon,
  HandRaisedIcon,
  UserGroupIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  UserIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  DocumentIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ShieldNestLogo from '@/components/ShieldNestLogo';
import Link from 'next/link';

interface FormData {
  // Newsletter form
  newsletterEmail: string;
  
  // Membership request form
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  referralSource: string;
  additionalInfo: string;
  agreeToPMA: boolean;
}

const INTEREST_OPTIONS = [
  'Secure Custody Solutions',
  'Educational Resources',
  'Hands-off Management',
  'Risk Protection',
  'Community Access',
  'Market Analysis',
  'Technical Support',
  'Investment Strategies'
];

const REFERRAL_OPTIONS = [
  'Search Engine',
  'Social Media',
  'Friend/Family',
  'Business Partner',
  'Industry Event',
  'Newsletter',
  'Other'
];

export default function ShieldNestLanding() {
  const { isDark } = useTheme();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const [showMembershipForm, setShowMembershipForm] = useState(false);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (showMembershipForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMembershipForm]);
  
  const [membershipData, setMembershipData] = useState<Omit<FormData, 'newsletterEmail'>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    experience: 'intermediate',
    interests: [],
    referralSource: '',
    additionalInfo: '',
    agreeToPMA: false
  });
  const [membershipStatus, setMembershipStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [membershipMessage, setMembershipMessage] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus('loading');
    
    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'newsletter',
          data: { email: newsletterEmail }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNewsletterStatus('success');
        setNewsletterMessage(result.message);
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setNewsletterStatus('error');
      setNewsletterMessage('Something went wrong. Please try again.');
    }
  };

  const handleMembershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMembershipStatus('loading');
    
    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'membership',
          data: membershipData
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMembershipStatus('success');
        setMembershipMessage(result.message);
        setShowMembershipForm(false);
        // Reset form
        setMembershipData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          website: '',
          experience: 'intermediate',
          interests: [],
          referralSource: '',
          additionalInfo: '',
          agreeToPMA: false
        });
      } else {
        setMembershipStatus('error');
        setMembershipMessage(result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setMembershipStatus('error');
      setMembershipMessage('Something went wrong. Please try again.');
    }
  };

  const toggleInterest = (interest: string) => {
    setMembershipData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:depth-bg">
      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Background Lighting Effects */}
          <div className="absolute inset-0 hero-glow"></div>
          <div className="absolute top-20 left-10 w-96 h-96 light-accent-blue rounded-full floating-light"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 gradient-orb-1 rounded-full floating-orb" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 right-20 w-64 h-64 light-accent-purple rounded-full floating-light" style={{ animationDelay: '4s' }}></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-8 animate-float">
              <ShieldNestLogo size="xxxl" className="text-primary-600 dark:text-primary-400" />
            </div>
              
              <h1 
                className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-6" 
                style={{ 
                  textShadow: isDark ? '2px 2px 0 black, -2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black' : 'none' 
                }}
              >
                ShieldNest
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
                Securing Your Future, Together
              </p>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-4xl mx-auto">
                A private members-only custody organization built to protect, educate, and empower those who refuse to give up control.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/nft" className="btn-primary inline-flex items-center">
                  <EyeIcon className="h-5 w-5 mr-2" />
                  Explore NFT Features
                </Link>
                <button 
                  onClick={() => setShowMembershipForm(true)}
                  className="btn-secondary inline-flex items-center"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Request Membership
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Crypto has burned too many good people.
              </h2>
              
              <div className="max-w-4xl mx-auto space-y-6 text-lg text-gray-600 dark:text-gray-400">
                <p>Billions of dollars are lost each year to scams, hacks, and broken promises.</p>
                <p>We've watched friends and family lose everything.</p>
                <p>Most gave up. Some never came back.</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  That pain is why ShieldNest exists.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section id="about" className="py-20 bg-white/50 dark:bg-gray-800/20 relative overflow-hidden">
          {/* Subtle lighting for depth */}
          <div className="absolute top-0 left-1/4 w-72 h-72 light-accent-green rounded-full floating-light" style={{ animationDelay: '3s' }}></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Why We Built ShieldNest
              </h2>
              
              <div className="max-w-4xl mx-auto space-y-6 text-lg text-gray-600 dark:text-gray-400">
                <p>We refused to accept that crypto had to be unsafe.</p>
                <p>ShieldNest was born out of love for our community and frustration with the chaos.</p>
                <p>We are a Private Member Custody Organization (PMCO) operating under the House of Exegesis, a 508(c)(1)(a).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="card text-center">
                <div className="p-4 bg-primary-100/80 dark:bg-primary-900/50 rounded-full inline-flex mb-6">
                  <ShieldCheckIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Protect our members from fraud and loss.
                </h3>
              </div>

              <div className="card text-center">
                <div className="p-4 bg-green-100/80 dark:bg-green-900/50 rounded-full inline-flex mb-6">
                  <AcademicCapIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Teach at a pace that works for real life.
                </h3>
              </div>

              <div className="card text-center">
                <div className="p-4 bg-blue-100/80 dark:bg-blue-900/50 rounded-full inline-flex mb-6">
                  <HandRaisedIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Build trust through action, not hype.
                </h3>
              </div>
            </div>

            <div className="text-center max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                We're not here for the masses. We're here for those who want to be part of a safe, private, and transparent future.
              </p>
            </div>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Not public. Not chaotic. Not reckless.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-100/80 dark:bg-purple-900/50 rounded-lg">
                    <LockClosedIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🔒 Private Membership Only
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No random sign-ups. Membership is by agreement and capped to a few hundred people.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-100/80 dark:bg-green-900/50 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      ☑️ Transparency First
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Our custody practices are explained in plain English.
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Reports and updates are published for members regularly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100/80 dark:bg-blue-900/50 rounded-lg">
                    <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      📖 Education at Your Pace
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Learn with bite-sized tips via newsletter.
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Or go hands-off and let us handle everything.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-yellow-100/80 dark:bg-yellow-900/50 rounded-lg">
                    <BanknotesIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🛡️ Safety Net Fund
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      A small reimbursement fund for phishing or hacks.
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Because we only win when our members win.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card md:col-span-2">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-red-100/80 dark:bg-red-900/50 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🤝 Real Human Support
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Always a human. Never a bot.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white/50 dark:bg-gray-800/20 relative overflow-hidden">
          {/* Additional depth lighting */}
          <div className="absolute bottom-10 right-1/3 w-80 h-80 gradient-orb-2 rounded-full floating-orb" style={{ animationDelay: '6s' }}></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Becoming part of ShieldNest is simple, but not open to everyone.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="p-6 bg-primary-100/80 dark:bg-primary-900/50 rounded-full inline-flex mb-6">
                  <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  1️⃣ Explore NFT Features
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our members can share their NFT benefits so you can see how ShieldNest works in real life.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Visitors can browse, but cannot transact.
                </p>
              </div>

              <div className="card text-center">
                <div className="p-6 bg-green-100/80 dark:bg-green-900/50 rounded-full inline-flex mb-6">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  2️⃣ Request Membership
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Membership requires signing a PMA Waiver.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  This ensures ShieldNest operates as a private organization, not a public service.
                </p>
              </div>

              <div className="card text-center">
                <div className="p-6 bg-blue-100/80 dark:bg-blue-900/50 rounded-full inline-flex mb-6">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  3️⃣ Secure Your Future
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Once inside, members gain access to secure custody, education, and optional hands-off management.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Membership is exclusive and capped at ~100–300 members.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section id="newsletter" className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card text-center">
              <div className="p-4 bg-primary-100/80 dark:bg-primary-900/50 rounded-full inline-flex mb-8">
                <EnvelopeIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Crypto wisdom, one tip at a time.
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Stay sharp without overwhelm.
                Our newsletter delivers short, mobile-friendly tips to help you protect and grow in crypto.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-field flex-1"
                    required
                    disabled={newsletterStatus === 'loading'}
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === 'loading'}
                    className="btn-primary whitespace-nowrap"
                  >
                    {newsletterStatus === 'loading' ? (
                      <div className="flex items-center">
                        <div className="loading-spinner mr-2" />
                        Subscribing...
                      </div>
                    ) : (
                      <>
                        📬 Subscribe Now
                      </>
                    )}
                  </button>
                </div>
                
                {newsletterMessage && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    newsletterStatus === 'success' 
                      ? 'bg-green-100/80 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
                      : 'bg-red-100/80 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                  }`}>
                    <div className="flex items-center justify-center">
                      {newsletterStatus === 'success' ? (
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                      )}
                      <p className="text-sm">{newsletterMessage}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Trust & Values */}
        <section className="py-20 bg-white/50 dark:bg-gray-800/20 relative overflow-hidden">
          {/* More subtle lighting */}
          <div className="absolute top-1/2 left-10 w-60 h-60 light-accent-blue rounded-full floating-light" style={{ animationDelay: '1s' }}></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Our Promise to Members
              </h2>
              
              <div className="max-w-4xl mx-auto text-lg text-gray-600 dark:text-gray-400 mb-12">
                <p className="mb-6">ShieldNest exists to:</p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    <p>Secure the assets of our members under the House of Exegesis, a 508(c)(1)(a).</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    <p>Protect against fraud and misinformation.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    <p>Empower with education, clarity, and real human support.</p>
                  </div>
                </div>
              </div>
              
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Private. Transparent. Shielded.
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="explore" className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="card">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Ready to join the most secure crypto community?
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Membership is limited and by invitation only. Start by exploring NFT features or requesting access.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/nft" className="btn-glass inline-flex items-center">
                  <EyeIcon className="h-5 w-5 mr-2" />
                  Browse NFT Features
                </Link>
                <button 
                  onClick={() => setShowMembershipForm(true)}
                  className="btn-primary inline-flex items-center"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Request Membership
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Membership Request Modal */}
      {showMembershipForm && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" data-modal="membership">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
            onClick={() => setShowMembershipForm(false)}
          />
          
          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4 relative z-10">
            {/* Modal */}
            <div 
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Request ShieldNest Membership
                  </h2>
                  <button
                    onClick={() => setShowMembershipForm(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleMembershipSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="label">
                        <UserIcon className="h-4 w-4 inline mr-2" />
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={membershipData.firstName}
                        onChange={(e) => setMembershipData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="input-field"
                        required
                        aria-describedby="firstName-required"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="label">Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={membershipData.lastName}
                        onChange={(e) => setMembershipData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="input-field"
                        required
                        aria-describedby="lastName-required"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="label">
                      <EnvelopeIcon className="h-4 w-4 inline mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={membershipData.email}
                      onChange={(e) => setMembershipData(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                      required
                      aria-describedby="email-required"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="label">
                      <PhoneIcon className="h-4 w-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={membershipData.phone}
                      onChange={(e) => setMembershipData(prev => ({ ...prev, phone: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="label">
                        <BuildingOfficeIcon className="h-4 w-4 inline mr-2" />
                        Company/Organization
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={membershipData.company}
                        onChange={(e) => setMembershipData(prev => ({ ...prev, company: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="website" className="label">
                        <GlobeAltIcon className="h-4 w-4 inline mr-2" />
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={membershipData.website}
                        onChange={(e) => setMembershipData(prev => ({ ...prev, website: e.target.value }))}
                        className="input-field"
                        placeholder="https://"
                      />
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label htmlFor="experience" className="label">Crypto Experience Level *</label>
                    <div className="relative">
                      <select
                        id="experience"
                        name="experience"
                        value={membershipData.experience}
                        onChange={(e) => setMembershipData(prev => ({ ...prev, experience: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                        className="input-field pr-10 appearance-none"
                        required
                        aria-describedby="experience-required"
                      >
                        <option value="beginner">Beginner - New to crypto</option>
                        <option value="intermediate">Intermediate - Some experience</option>
                        <option value="advanced">Advanced - Very experienced</option>
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="label">Areas of Interest (select all that apply)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {INTEREST_OPTIONS.map((interest) => {
                        const interestId = `interest-${interest.toLowerCase().replace(/\s+/g, '-')}`;
                        return (
                          <label key={interest} htmlFor={interestId} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              id={interestId}
                              name="interests"
                              value={interest}
                              checked={membershipData.interests.includes(interest)}
                              onChange={() => toggleInterest(interest)}
                              className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{interest}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Referral Source */}
                  <div>
                    <label htmlFor="referralSource" className="label">How did you hear about ShieldNest?</label>
                    <div className="relative">
                      <select
                        id="referralSource"
                        name="referralSource"
                        value={membershipData.referralSource}
                        onChange={(e) => setMembershipData(prev => ({ ...prev, referralSource: e.target.value }))}
                        className="input-field pr-10 appearance-none"
                      >
                        <option value="">Select an option</option>
                        {REFERRAL_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <label htmlFor="additionalInfo" className="label">Additional Information</label>
                    <textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      value={membershipData.additionalInfo}
                      onChange={(e) => setMembershipData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                      className="input-field"
                      rows={4}
                      placeholder="Tell us more about your interest in ShieldNest, your goals, or any questions you have..."
                    />
                  </div>

                  {/* PMA Agreement */}
                  <div className="glass-card p-4">
                    <label htmlFor="agreeToPMA" className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        id="agreeToPMA"
                        name="agreeToPMA"
                        checked={membershipData.agreeToPMA}
                        onChange={(e) => setMembershipData(prev => ({ ...prev, agreeToPMA: e.target.checked }))}
                        className="mt-1 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        required
                      />
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">I agree to the Private Member Association (PMA) requirements *</span>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                          I understand that ShieldNest operates as a private organization and that membership 
                          requires signing a PMA waiver. I agree to the terms and conditions of private membership.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowMembershipForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={membershipStatus === 'loading'}
                      className="btn-primary"
                    >
                      {membershipStatus === 'loading' ? (
                        <div className="flex items-center">
                          <div className="loading-spinner mr-2" />
                          Submitting Request...
                        </div>
                      ) : (
                        <>
                          <DocumentIcon className="h-5 w-5 mr-2" />
                          Submit Request
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Success/Error Message */}
                {membershipMessage && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    membershipStatus === 'success' 
                      ? 'bg-green-100/80 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
                      : 'bg-red-100/80 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                  }`}>
                    <div className="flex items-start">
                      {membershipStatus === 'success' ? (
                        <CheckCircleIcon className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                      )}
                      <p className="text-sm">{membershipMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <ShieldNestLogo size="sm" className="text-primary-600 dark:text-primary-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">ShieldNest</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                A private members-only custody organization built to protect, educate, and empower those who refuse to give up control.
              </p>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                <a href="mailto:nestd@pm.me" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  nestd@pm.me
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/portfolio" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link href="/nft" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    NFT Hub
                  </Link>
                </li>
                <li>
                  <Link href="/rewards-history" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Rewards History
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <a href="mailto:nestd@pm.me" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    nestd@pm.me
                  </a>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  For membership inquiries, support, and general questions
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                © 2024 ShieldNest. All rights reserved.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4 md:mt-0">
                Securing Your Future, Together
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}