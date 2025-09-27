'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import { useUserStore, useUsernameAvailability } from '@/lib/stores/user-store';
import { useDynamicUser } from '@/hooks/use-dynamic-user';

interface UserOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserOnboardingModal({ open, onOpenChange }: UserOnboardingModalProps) {
  const { user: dynamicUser, walletAddress } = useDynamicUser();
  const { createUser, isLoading, error } = useUserStore();
  const { checkAvailability } = useUsernameAvailability();

  // Extract data from Dynamic auth if available
  const getDynamicUserData = () => {
    if (!dynamicUser) return { full_name: '', username: '', email: '' };

    // Extract name from various Dynamic user properties
    const fullName = dynamicUser.firstName && dynamicUser.lastName
      ? `${dynamicUser.firstName} ${dynamicUser.lastName}`
      : dynamicUser.firstName || dynamicUser.lastName || '';

    // Generate a suggested username from email or name
    const suggestedUsername = dynamicUser.email
      ? dynamicUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')
      : fullName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);

    return {
      full_name: fullName,
      username: suggestedUsername,
      email: dynamicUser.email || '',
    };
  };

  const [formData, setFormData] = useState(() => getDynamicUserData());

  const [validation, setValidation] = useState({
    username: { isValid: true, message: '' },
    email: { isValid: true, message: '' },
  });

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Update form data when Dynamic user data becomes available
  useEffect(() => {
    if (dynamicUser) {
      const dynamicData = getDynamicUserData();
      setFormData(prev => ({
        // Only update empty fields to preserve user edits
        full_name: prev.full_name || dynamicData.full_name,
        username: prev.username || dynamicData.username,
        email: prev.email || dynamicData.email,
      }));
    }
  }, [dynamicUser]);

  // Validate username
  const validateUsername = async (username: string) => {
    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }

    setIsCheckingUsername(true);
    try {
      const isAvailable = await checkAvailability(username);
      if (!isAvailable) {
        return { isValid: false, message: 'Username is already taken' };
      }
      return { isValid: true, message: 'Username is available!' };
    } catch (error) {
      return { isValid: false, message: 'Could not check username availability' };
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true, message: '' };
  };

  // Handle input changes
  const handleInputChange = async (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate on change
    if (field === 'username' && value) {
      const result = await validateUsername(value);
      setValidation(prev => ({ ...prev, username: result }));
    } else if (field === 'email') {
      const result = validateEmail(value);
      setValidation(prev => ({ ...prev, email: result }));
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    // Final validation
    const usernameValidation = await validateUsername(formData.username);
    const emailValidation = validateEmail(formData.email);

    setValidation({
      username: usernameValidation,
      email: emailValidation,
    });

    if (!usernameValidation.isValid || !emailValidation.isValid) {
      return;
    }

    try {
      await createUser({
        wallet_address: walletAddress,
        full_name: formData.full_name || '',
        username: formData.username || '',
        email: formData.email || '',
      });

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  if (!walletAddress) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Crypto Fantasy League! 🏆</DialogTitle>
            <DialogDescription>
              Please connect your wallet to continue.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome! 🎉</DialogTitle>
          <DialogDescription>
            Let's set up your profile to get started with fantasy crypto trading.
          </DialogDescription>
          {dynamicUser && (formData.full_name || formData.email) && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-700 text-sm">
                ✨ We've pre-filled some details from your connected account. Feel free to edit them!
              </p>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder={formData.full_name ? "Your name looks good!" : "Enter your full name"}
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={
                validation.username.isValid ? '' : 'border-red-500'
              }
              placeholder={formData.username ? "Username suggestion based on your account" : "Choose a unique username"}
              required
            />
            {isCheckingUsername && (
              <p className="text-blue-500 text-xs">Checking availability...</p>
            )}
            {formData.username && !isCheckingUsername && (
              <p className={`text-xs ${
                validation.username.isValid ? 'text-green-500' : 'text-red-500'
              }`}>
                {validation.username.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email (Optional)
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={
                validation.email.isValid ? '' : 'border-red-500'
              }
              placeholder="your@email.com"
            />
            {formData.email && !validation.email.isValid && (
              <p className="text-red-500 text-xs">{validation.email.message}</p>
            )}
          </div>

          {/* Wallet Address Display */}
          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <div className="p-3 bg-muted border rounded-md">
              <p className="font-mono text-sm text-muted-foreground">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              isLoading ||
              isCheckingUsername ||
              !formData.full_name ||
              !formData.username ||
              !validation.username.isValid ||
              !validation.email.isValid
            }
            className="w-full"
          >
            {isLoading ? 'Creating Profile...' : 'Create Profile'}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          <p>By creating a profile, you agree to our terms of service.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}