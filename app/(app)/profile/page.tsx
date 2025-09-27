'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/auth-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserProfile, useDynamicUser } from '@/hooks/use-dynamic-user';
import { useUserStore } from '@/lib/stores/user-store';
import { UserService } from '@/lib/services/user-service';
import { Camera, Edit, Save, X } from 'lucide-react';

function ProfileContent() {
  const { profile, walletAddress, displayName, dynamicEmail, isComplete, missingFields, isLoading: profileLoading } = useUserProfile();
  const { updateUser, createUser, isLoading } = useUserStore();
  
  console.log('ProfileContent render:', {
    profile,
    walletAddress,
    profileLoading,
    isComplete
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
  });

  // Update form data when profile changes
  useEffect(() => {
    setFormData({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
    });
  }, [profile]);

  const handleSave = async () => {
    if (!walletAddress) return;

    try {
      console.log('Saving profile data:', formData);
      
      if (profile) {
        // Update existing user
        await updateUser(formData);
        console.log('Profile updated successfully');
      } else {
        // Create new user with Dynamic email
        const userData = {
          wallet_address: walletAddress,
          full_name: formData.full_name,
          username: formData.username,
          email: dynamicEmail || '', // Use Dynamic email
        };
        console.log('Creating new user:', userData);
        await createUser(userData);
        console.log('Profile created successfully');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!walletAddress) return;
    
    try {
      const photoUrl = await UserService.uploadUserPhoto(walletAddress, file);
      await updateUser({ photo_url: photoUrl });
    } catch (error) {
      console.error('Failed to upload photo:', error);
    }
  };

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">👤 User Profile</h1>
          <p className="text-muted-foreground">Loading your profile...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Wallet: {walletAddress || 'Not connected'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">👤 User Profile</h1>
        <p className="text-muted-foreground">
          Manage your crypto fantasy league profile
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Wallet: {walletAddress || 'Not connected'} | Profile: {profile ? 'Found' : 'Not found'}
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile?.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white border-2 rounded-full p-1 cursor-pointer hover:bg-gray-50">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground">@{profile?.username || 'No username'}</p>
              <p className="text-sm text-muted-foreground font-mono">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </p>
            </div>
            {profile && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>

          {/* Profile Status */}
          {!profile ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Create Your Profile</h3>
              <p className="text-blue-700 text-sm mb-2">
                Welcome! Create your profile to start playing fantasy crypto tournaments.
              </p>
              <p className="text-blue-700 text-sm">
                • Add your full name and username
                • Your email is automatically linked from Dynamic
              </p>
            </div>
          ) : !isComplete && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Complete Your Profile</h3>
              <p className="text-yellow-700 text-sm mb-2">
                Complete your profile to access all fantasy league features:
              </p>
              <ul className="text-yellow-700 text-sm space-y-1">
                {missingFields.username && <li>• Add a username</li>}
                {missingFields.fullName && <li>• Add your full name</li>}
              </ul>
            </div>
          )}

          {/* Profile Form */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              {(isEditing || !profile) ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full p-3 border rounded-md"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-md">
                  {profile?.full_name || 'Not set'}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              {(isEditing || !profile) ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full p-3 border rounded-md"
                  placeholder="Choose a username"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-md">
                  @{profile?.username || 'Not set'}
                </p>
              )}
            </div>

            {/* Email (Read-only from Dynamic) */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <p className="p-3 bg-gray-50 rounded-md text-muted-foreground">
                {dynamicEmail || profile?.email || 'Not set'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Email is linked to your Dynamic account and cannot be changed
              </p>
            </div>

            {/* Wallet Address (Read-only) */}
            <div>
              <label className="block text-sm font-medium mb-2">Wallet Address</label>
              <p className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                {walletAddress}
              </p>
            </div>

            {/* Save Button */}
            {(isEditing || !profile) && (
              <div className="flex space-x-3">
                <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : (profile ? 'Save Changes' : 'Create Profile')}
                </Button>
                {profile && (
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Account Stats */}
      <Card className="p-6 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Member since:</span>
            <p className="font-medium">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Profile status:</span>
            <p className={`font-medium ${isComplete ? 'text-green-600' : 'text-yellow-600'}`}>
              {isComplete ? 'Complete' : 'Incomplete'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Tournaments joined:</span>
            <p className="font-medium">0</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total winnings:</span>
            <p className="font-medium">0 FLOW</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <AuthGuard requireProfile={true}>
      <ProfileContent />
    </AuthGuard>
  );
}