import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ConvertRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to NFT page with convert tab
    router.replace('/nft');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Redirecting to NFT Hub...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Convert functionality has moved to our consolidated NFT Hub.
        </p>
      </div>
    </div>
  );
}