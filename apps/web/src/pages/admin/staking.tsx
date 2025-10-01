import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { InformationCircleIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

interface MemberRow {
  trackedWalletId: string;
  user: { id: string; email: string; name?: string; firstName?: string; lastName?: string };
  address: string;
  chain: string;
  startDate: string;
  investedUsd?: string;
  totals: {
    totalClaimed: number;
    currentClaimable: number;
    lastClaimAt?: string | null;
    lastClaimableUpdate?: string | null;
  };
  adminTake: number;
}

export default function AdminStaking() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/staking/members');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load members');
      setMembers(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/staking/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Refresh failed');
      await fetchMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fmt = (n: number | string | undefined) => {
    const num = typeof n === 'number' ? n : Number(n || 0);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const short = (a: string) => `${a.slice(0, 10)}...${a.slice(-8)}`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin • Staking Members</h1>
          <div className="flex gap-2">
            <button onClick={refreshAll} disabled={isLoading} className="btn inline-flex items-center">
              <ArrowPathIcon className="h-5 w-5 mr-2" /> Refresh Claimables
            </button>
            <button className="btn-secondary inline-flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" /> Track Wallet
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-medium">Start Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium">Invested (USD)</th>
                <th className="px-4 py-3 text-right text-xs font-medium">Total Claimed (CORE)</th>
                <th className="px-4 py-3 text-right text-xs font-medium">Current Claimable (CORE)</th>
                <th className="px-4 py-3 text-right text-xs font-medium">Admin 20% (CORE)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No members tracked yet.</td></tr>
              ) : (
                members.map((m) => (
                  <tr key={m.trackedWalletId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{m.user.name || `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || m.user.email}</div>
                      <div className="text-xs text-gray-500">{m.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{short(m.address)}</div>
                      <div className="text-xs text-gray-500">{m.chain}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{new Date(m.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">{m.investedUsd ? `$${fmt(m.investedUsd)}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">{fmt(m.totals.totalClaimed)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">{fmt(m.totals.currentClaimable)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">{fmt(m.adminTake)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}


