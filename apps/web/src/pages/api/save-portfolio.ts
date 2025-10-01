import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, walletAddresses, balances, portfolioSummary, nftHoldings, savedAt } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // For now, we'll just log the portfolio data
    // In a real implementation, you'd save this to your database
    console.log('Portfolio save request:', {
      email,
      walletCount: walletAddresses?.length || 0,
      portfolioValue: portfolioSummary?.totalValue || 0,
      nftCount: nftHoldings?.nfts?.length || 0,
      savedAt
    });

    // Here you would typically:
    // 1. Save the portfolio data to your database
    // 2. Create or update a user record with the email
    // 3. Send a welcome/confirmation email
    // 4. Associate the wallet addresses with the user

    // Simulate successful save
    res.status(200).json({ 
      success: true, 
      message: 'Portfolio data saved successfully',
      email 
    });

  } catch (error) {
    console.error('Error saving portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
