import { WalletInfo } from '@/types/wallet';

export const WALLET_REGISTRY: WalletInfo[] = [
  {
    name: 'keplr-extension',
    prettyName: 'Keplr',
    logo: '/wallets/keplr.svg',
    mode: 'extension',
    connectEventNamesOnWindow: ['keplr_keystorechange'],
    downloads: {
      desktop: [
        'https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap',
        'https://addons.mozilla.org/en-US/firefox/addon/keplr/',
      ],
      mobile: [
        'https://apps.apple.com/us/app/keplr-wallet/id1567851089',
        'https://play.google.com/store/apps/details?id=com.chainapsis.keplr',
      ],
    },
  },
  {
    name: 'leap-extension',
    prettyName: 'Leap Cosmos',
    logo: '/wallets/leap.svg',
    mode: 'extension',
    connectEventNamesOnWindow: ['leap_keystorechange'],
    downloads: {
      desktop: [
        'https://chrome.google.com/webstore/detail/leap-cosmos-wallet/fcfcfllfndlomdhbehjjcoimbgofdncg',
      ],
      mobile: [
        'https://apps.apple.com/us/app/leap-cosmos/id1642465549',
        'https://play.google.com/store/apps/details?id=io.leapwallet.cosmos',
      ],
    },
  },
  {
    name: 'cosmostation-extension',
    prettyName: 'Cosmostation',
    logo: '/wallets/cosmostation.svg',
    mode: 'extension',
    connectEventNamesOnWindow: ['cosmostation_keystorechange'],
    downloads: {
      desktop: [
        'https://chrome.google.com/webstore/detail/cosmostation-wallet/fpkhgmpbidmiogeglndfbkegfdlnajnf',
      ],
      mobile: [
        'https://apps.apple.com/us/app/cosmostation/id1459830339',
        'https://play.google.com/store/apps/details?id=wannabit.io.cosmostaion',
      ],
    },
  },
];

export function getWalletByName(name: string): WalletInfo | undefined {
  return WALLET_REGISTRY.find(wallet => wallet.name === name);
}

export function getAvailableWallets(): WalletInfo[] {
  return WALLET_REGISTRY.filter(wallet => {
    if (typeof window === 'undefined') return false;
    
    switch (wallet.name) {
      case 'keplr-extension':
        return !!(window as any).keplr;
      case 'leap-extension':
        return !!(window as any).leap;
      case 'cosmostation-extension':
        return !!(window as any).cosmostation;
      default:
        return false;
    }
  });
}

export function getInstallableWallets(): WalletInfo[] {
  return WALLET_REGISTRY.filter(wallet => {
    if (typeof window === 'undefined') return true;
    
    switch (wallet.name) {
      case 'keplr-extension':
        return !(window as any).keplr;
      case 'leap-extension':
        return !(window as any).leap;
      case 'cosmostation-extension':
        return !(window as any).cosmostation;
      default:
        return true;
    }
  });
}
