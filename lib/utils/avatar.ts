/**
 * Generate DiceBear avatar URL based on wallet address or username
 * @param seed - The wallet address or username to use as seed
 * @param style - The DiceBear style (adventurer, avataaars, etc.)
 * @param size - The size of the avatar (default: 64)
 * @returns URL string for the avatar
 */
export function generateAvatar(
  seed: string,
  style: 'adventurer' | 'avataaars' | 'bottts' | 'identicon' | 'initials' | 'personas' = 'adventurer',
  size: number = 64
): string {
  // Use wallet address as seed for unique avatars
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodedSeed}&size=${size}&backgroundColor=transparent`;
}

/**
 * Get avatar for a user - uses real avatar if available, otherwise generates one
 * @param walletAddress - The user's wallet address
 * @param userAvatar - Optional real user avatar URL from Dynamic.xyz or other provider
 * @returns Avatar URL
 */
export function getUserAvatar(walletAddress: string, userAvatar?: string | null): string {
  // Use real avatar if provided and valid
  if (userAvatar && userAvatar.trim() !== '') {
    return userAvatar;
  }

  // Fall back to generated avatar
  return generateAvatar(walletAddress, 'adventurer', 64);
}

/**
 * Get shortened wallet address for display
 * @param walletAddress - The full wallet address
 * @returns Shortened address like "0x1234...abcd"
 */
export function shortenAddress(walletAddress: string): string {
  if (!walletAddress) return '';
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
}

/**
 * Get display name for user - prioritizes username, then full name, then shortened wallet
 * @param walletAddress - The wallet address
 * @param userProfile - Optional user profile with username/full_name
 * @returns Display name
 */
export function getUserDisplayName(walletAddress: string, userProfile?: { username?: string | null; full_name?: string | null }): string {
  if (userProfile?.username) {
    return userProfile.username;
  }

  if (userProfile?.full_name) {
    return userProfile.full_name;
  }

  return shortenAddress(walletAddress);
}

/**
 * Helper to create user avatar with profile data
 * @param walletAddress - Wallet address
 * @param userProfile - User profile with photo_url
 * @returns Avatar URL
 */
export function getUserAvatarWithProfile(walletAddress: string, userProfile?: { photo_url?: string | null }): string {
  return getUserAvatar(walletAddress, userProfile?.photo_url);
}