import React, { useState, useEffect } from 'react';
import { WebsiteProfile, default as WebsiteProfileService } from '../services/websiteProfileService';
import { XIcon, PlusIcon, EditIcon, TrashIcon, SaveIcon, UserIcon, BuildingIcon, GlobeIcon } from './Icons';

interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSelect?: (profile: WebsiteProfile) => void;
  initialUrl?: string;
}

interface ProfileFormData {
  id: string;
  url: string;
  name: string;
  description: string;
  author: {
    name: string;
    url: string;
    image: string;
    jobTitle: string;
  };
  organization: {
    name: string;
    url: string;
    logo: string;
    description: string;
    address: {
      streetAddress: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      addressCountry: string;
    };
    contactPoint: {
      telephone: string;
      email: string;
      contactType: string;
    };
    sameAs: string[];
  };
  defaultImage: string;
  socialProfiles: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  isOpen,
  onClose,
  onProfileSelect,
  initialUrl = ''
}) => {
  const [profiles, setProfiles] = useState<WebsiteProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<WebsiteProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    id: '',
    url: initialUrl,
    name: '',
    description: '',
    author: {
      name: '',
      url: '',
      image: '',
      jobTitle: ''
    },
    organization: {
      name: '',
      url: '',
      logo: '',
      description: '',
      address: {
        streetAddress: '',
        addressLocality: '',
        addressRegion: '',
        postalCode: '',
        addressCountry: ''
      },
      contactPoint: {
        telephone: '',
        email: '',
        contactType: 'customer service'
      },
      sameAs: []
    },
    defaultImage: '',
    socialProfiles: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: ''
    }
  });
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Use WebsiteProfileService directly from static import (all methods are static)
  const profileService = WebsiteProfileService;

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
      if (initialUrl) {
        setFormData(prev => ({ ...prev, url: initialUrl }));
      }
    }
  }, [isOpen, initialUrl]);

  const loadProfiles = async () => {
    if (!profileService) {
      console.error('ProfileManager: profileService is not available');
      return;
    }

    try {
      console.log('ProfileManager: Loading profiles...');
      const loadedProfiles = profileService.getProfiles();
      console.log('ProfileManager: Loaded profiles:', loadedProfiles.length);
      setProfiles(loadedProfiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      url: initialUrl,
      name: '',
      description: '',
      author: {
        name: '',
        url: '',
        image: '',
        jobTitle: ''
      },
      organization: {
        name: '',
        url: '',
        logo: '',
        description: '',
        address: {
          streetAddress: '',
          addressLocality: '',
          addressRegion: '',
          postalCode: '',
          addressCountry: ''
        },
        contactPoint: {
          telephone: '',
          email: '',
          contactType: 'customer service'
        },
        sameAs: []
      },
      defaultImage: '',
      socialProfiles: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: ''
      }
    });
  };

  const handleCreateProfile = () => {
    resetForm();
    setActiveTab('create');
  };

  const handleEditProfile = (profile: WebsiteProfile) => {
    setFormData({
      id: profile.id,
      url: profile.url,
      name: profile.name,
      description: profile.description || '',
      author: {
        name: profile.author?.name || '',
        url: profile.author?.url || '',
        image: profile.author?.image || '',
        jobTitle: profile.author?.jobTitle || ''
      },
      organization: {
        name: profile.organization?.name || '',
        url: profile.organization?.url || '',
        logo: profile.organization?.logo || '',
        description: profile.organization?.description || '',
        address: {
          streetAddress: profile.organization?.address?.streetAddress || '',
          addressLocality: profile.organization?.address?.addressLocality || '',
          addressRegion: profile.organization?.address?.addressRegion || '',
          postalCode: profile.organization?.address?.postalCode || '',
          addressCountry: profile.organization?.address?.addressCountry || ''
        },
        contactPoint: {
          telephone: profile.organization?.contactPoint?.telephone || '',
          email: profile.organization?.contactPoint?.email || '',
          contactType: profile.organization?.contactPoint?.contactType || 'customer service'
        },
        sameAs: profile.organization?.sameAs || []
      },
      defaultImage: profile.defaultImage || '',
      socialProfiles: {
        facebook: profile.socialProfiles?.facebook || '',
        twitter: profile.socialProfiles?.twitter || '',
        instagram: profile.socialProfiles?.instagram || '',
        linkedin: profile.socialProfiles?.linkedin || '',
        youtube: profile.socialProfiles?.youtube || ''
      }
    });
    setEditingProfile(profile);
    setActiveTab('edit');
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!profileService) return;

    if (confirm('Are you sure you want to delete this profile?')) {
      try {
        profileService.deleteProfile(profileId);
        await loadProfiles();
      } catch (error) {
        console.error('Failed to delete profile:', error);
        alert('Failed to delete profile');
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!profileService || !formData.name.trim() || !formData.url.trim()) {
      alert('Please fill in the required fields (name and URL)');
      return;
    }

    setSaveStatus('saving');

    try {
      const profileData: WebsiteProfile = {
        id: formData.id || profileService.generateProfileId(),
        url: formData.url,
        name: formData.name,
        description: formData.description || undefined,
        author: formData.author.name ? {
          name: formData.author.name,
          url: formData.author.url || undefined,
          image: formData.author.image || undefined,
          jobTitle: formData.author.jobTitle || undefined
        } : undefined,
        organization: formData.organization.name ? {
          name: formData.organization.name,
          url: formData.organization.url || undefined,
          logo: formData.organization.logo || undefined,
          description: formData.organization.description || undefined,
          address: formData.organization.address.streetAddress ? {
            streetAddress: formData.organization.address.streetAddress,
            addressLocality: formData.organization.address.addressLocality,
            addressRegion: formData.organization.address.addressRegion,
            postalCode: formData.organization.address.postalCode,
            addressCountry: formData.organization.address.addressCountry
          } : undefined,
          contactPoint: formData.organization.contactPoint.telephone ? {
            telephone: formData.organization.contactPoint.telephone,
            email: formData.organization.contactPoint.email || undefined,
            contactType: formData.organization.contactPoint.contactType
          } : undefined,
          sameAs: formData.organization.sameAs.filter(url => url.trim())
        } : undefined,
        defaultImage: formData.defaultImage || undefined,
        socialProfiles: Object.fromEntries(
          Object.entries(formData.socialProfiles).filter(([_, value]) => value.trim())
        ) as any,
        createdAt: formData.id ? (profiles.find(p => p.id === formData.id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      profileService.saveProfile(profileData);
      await loadProfiles();
      setSaveStatus('success');

      setTimeout(() => {
        setActiveTab('list');
        setEditingProfile(null);
        resetForm();
        setSaveStatus('idle');
      }, 1000);

    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleSelectProfile = (profile: WebsiteProfile) => {
    if (onProfileSelect) {
      onProfileSelect(profile);
    }
    onClose();
  };

  if (!isOpen) {
    console.log('ProfileManager: Modal closed, isOpen =', isOpen);
    return null;
  }

  console.log('ProfileManager: Rendering modal, isOpen =', isOpen, 'profileService =', !!profileService);

  if (!profileService) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Profile Manager Error</h3>
          <p className="text-slate-600 mb-4">Failed to load profile management service.</p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3" onClick={(e) => {
      if (e.target === e.currentTarget) {
        console.log('ProfileManager: Clicked outside modal');
        onClose();
      }
    }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserIcon className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Website Profiles</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            Manage website profiles to improve schema generation accuracy
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'list' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Your Profiles</h3>
                <button
                  onClick={handleCreateProfile}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-1.5 text-sm"
                >
                  <PlusIcon className="w-3 h-3" />
                  Create Profile
                </button>
              </div>

              {profiles.length === 0 ? (
                <div className="text-center py-8">
                  <GlobeIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-600 mb-2">No profiles yet</h3>
                  <p className="text-slate-500 mb-3 text-sm">Create your first website profile to improve schema generation</p>
                  <button
                    onClick={handleCreateProfile}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-sm"
                  >
                    Create Your First Profile
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800 text-sm">{profile.name}</h4>
                            {profile.isDefault && (
                              <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-xs mb-1.5">{profile.url}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {profile.author?.name && (
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                {profile.author.name}
                              </span>
                            )}
                            {profile.organization?.name && (
                              <span className="flex items-center gap-1">
                                <BuildingIcon className="w-3 h-3" />
                                {profile.organization.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSelectProfile(profile)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleEditProfile(profile)}
                            className="text-slate-600 hover:text-slate-800 p-1.5"
                          >
                            <EditIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="text-red-600 hover:text-red-800 p-1.5"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'create' || activeTab === 'edit') && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setActiveTab('list');
                    setEditingProfile(null);
                    resetForm();
                  }}
                  className="text-slate-600 hover:text-slate-800 text-sm"
                >
                  ← Back to Profiles
                </button>
                <h3 className="text-lg font-bold text-slate-800">
                  {activeTab === 'create' ? 'Create New Profile' : 'Edit Profile'}
                </h3>
              </div>

              <div className="max-h-80 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 border-b pb-1.5 text-sm">Basic Information</h4>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Website URL *
                      </label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Website Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Website"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of your website"
                        rows={2}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Default Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.defaultImage}
                        onChange={(e) => setFormData(prev => ({ ...prev, defaultImage: e.target.value }))}
                        placeholder="https://example.com/logo.jpg"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Author Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 border-b pb-1.5 text-sm">Author Information</h4>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={formData.author.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          author: { ...prev.author, name: e.target.value }
                        }))}
                        placeholder="John Doe"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Author URL
                      </label>
                      <input
                        type="url"
                        value={formData.author.url}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          author: { ...prev.author, url: e.target.value }
                        }))}
                        placeholder="https://example.com/author"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Author Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.author.image}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          author: { ...prev.author, image: e.target.value }
                        }))}
                        placeholder="https://example.com/author-photo.jpg"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.author.jobTitle}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          author: { ...prev.author, jobTitle: e.target.value }
                        }))}
                        placeholder="Content Writer"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Organization Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 border-b pb-1.5 text-sm">Organization Information</h4>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={formData.organization.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          organization: { ...prev.organization, name: e.target.value }
                        }))}
                        placeholder="Company Name"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Organization URL
                      </label>
                      <input
                        type="url"
                        value={formData.organization.url}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          organization: { ...prev.organization, url: e.target.value }
                        }))}
                        placeholder="https://example.com"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Logo URL
                      </label>
                      <input
                        type="url"
                        value={formData.organization.logo}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          organization: { ...prev.organization, logo: e.target.value }
                        }))}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Organization Description
                      </label>
                      <textarea
                        value={formData.organization.description}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          organization: { ...prev.organization, description: e.target.value }
                        }))}
                        placeholder="Brief description of your organization"
                        rows={2}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 border-b pb-1.5 text-sm">Contact Information</h4>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.organization.contactPoint.telephone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          organization: {
                            ...prev.organization,
                            contactPoint: { ...prev.organization.contactPoint, telephone: e.target.value }
                          }
                        }))}
                        placeholder="+1-555-0123"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.organization.contactPoint.email}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          organization: {
                            ...prev.organization,
                            contactPoint: { ...prev.organization.contactPoint, email: e.target.value }
                          }
                        }))}
                        placeholder="contact@example.com"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={formData.organization.address.streetAddress}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            organization: {
                              ...prev.organization,
                              address: { ...prev.organization.address, streetAddress: e.target.value }
                            }
                          }))}
                          placeholder="123 Main St"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.organization.address.addressLocality}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            organization: {
                              ...prev.organization,
                              address: { ...prev.organization.address, addressLocality: e.target.value }
                            }
                          }))}
                          placeholder="New York"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={formData.organization.address.addressRegion}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            organization: {
                              ...prev.organization,
                              address: { ...prev.organization.address, addressRegion: e.target.value }
                            }
                          }))}
                          placeholder="NY"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          ZIP/Postal Code
                        </label>
                        <input
                          type="text"
                          value={formData.organization.address.postalCode}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            organization: {
                              ...prev.organization,
                              address: { ...prev.organization.address, postalCode: e.target.value }
                            }
                          }))}
                          placeholder="10001"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.organization.address.addressCountry}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            organization: {
                              ...prev.organization,
                              address: { ...prev.organization.address, addressCountry: e.target.value }
                            }
                          }))}
                          placeholder="United States"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  {saveStatus === 'saving' && (
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {saveStatus === 'success' && (
                    <div className="w-3 h-3 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="w-3 h-3 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✗</span>
                    </div>
                  )}
                  <span className="text-xs text-slate-600">
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'success' && 'Profile saved successfully!'}
                    {saveStatus === 'error' && 'Failed to save profile'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('list');
                      setEditingProfile(null);
                      resetForm();
                    }}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-800 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveStatus === 'saving'}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <SaveIcon className="w-3 h-3" />
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
