import React from 'react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card' | 'badge';
  className?: string;
}

/**
 * PWAInstallButton is disabled as the application is configured as a standalone phone app
 * packaged for Google Play Store via PWABuilder (TWA). In-app install prompts are not needed.
 */
export const PWAInstallButton: React.FC<PWAInstallButtonProps> = () => {
  return null;
};
