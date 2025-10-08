export interface WebsiteProfile {
  id: string;
  url: string;
  name: string;
  description?: string;
  author?: {
    name: string;
    url?: string;
    image?: string;
    jobTitle?: string;
  };
  organization?: {
    name: string;
    url?: string;
    logo?: string;
    description?: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
    contactPoint?: {
      telephone?: string;
      email?: string;
      contactType?: string;
    };
    sameAs?: string[];
  };
  defaultImage?: string;
  socialProfiles?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface ScrapedWebsiteData {
  url: string;
  title?: string;
  description?: string;
  author?: string;
  publishDate?: string;
  modifiedDate?: string;
  images?: string[];
  organization?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  reviews?: Array<{
    author: string;
    rating: number;
    reviewBody: string;
    datePublished?: string;
  }>;
  products?: Array<{
    name: string;
    description?: string;
    price?: string;
    currency?: string;
    availability?: string;
    brand?: string;
  }>;
}

class WebsiteProfileService {
  private static readonly STORAGE_KEY = 'seo-schema-generator-profiles';
  private static readonly SCRAPED_DATA_KEY = 'seo-schema-generator-scraped-data';

  /**
   * Get all website profiles
   */
  static getProfiles(): WebsiteProfile[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage not available');
        return [];
      }
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  }

  /**
   * Save a website profile
   */
  static saveProfile(profile: WebsiteProfile): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        throw new Error('localStorage not available');
      }

      const profiles = this.getProfiles();
      const existingIndex = profiles.findIndex(p => p.id === profile.id);

      if (existingIndex >= 0) {
        profiles[existingIndex] = { ...profile, updatedAt: new Date().toISOString() };
      } else {
        profiles.push(profile);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw new Error('Failed to save profile');
    }
  }

  /**
   * Delete a website profile
   */
  static deleteProfile(profileId: string): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        throw new Error('localStorage not available');
      }

      const profiles = this.getProfiles().filter(p => p.id !== profileId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw new Error('Failed to delete profile');
    }
  }

  /**
   * Get profile by URL
   */
  static getProfileByUrl(url: string): WebsiteProfile | null {
    const profiles = this.getProfiles();
    return profiles.find(p => p.url === url) || null;
  }

  /**
   * Get profile by ID
   */
  static getProfileById(id: string): WebsiteProfile | null {
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === id) || null;
  }

  /**
   * Update profile from scraped data
   */
  static updateProfileFromScrapedData(url: string, scrapedData: Partial<ScrapedWebsiteData>): WebsiteProfile | null {
    const existingProfile = this.getProfileByUrl(url);

    if (!existingProfile) return null;

    const updatedProfile: WebsiteProfile = {
      ...existingProfile,
      updatedAt: new Date().toISOString(),
    };

    // Update from scraped data if available
    if (scrapedData.title && !updatedProfile.name) {
      updatedProfile.name = scrapedData.title;
    }

    if (scrapedData.description && !updatedProfile.description) {
      updatedProfile.description = scrapedData.description;
    }

    if (scrapedData.author && !updatedProfile.author?.name) {
      updatedProfile.author = {
        ...updatedProfile.author,
        name: scrapedData.author,
      };
    }

    if (scrapedData.organization && !updatedProfile.organization?.name) {
      updatedProfile.organization = {
        ...updatedProfile.organization,
        name: scrapedData.organization,
      };
    }

    if (scrapedData.images && scrapedData.images.length > 0 && !updatedProfile.defaultImage) {
      updatedProfile.defaultImage = scrapedData.images[0];
    }

    this.saveProfile(updatedProfile);
    return updatedProfile;
  }

  /**
   * Store scraped data for a URL
   */
  static storeScrapedData(url: string, data: ScrapedWebsiteData): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage not available for scraped data');
        return;
      }

      const existing = this.getScrapedData();
      existing[url] = {
        ...data,
        scrapedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.SCRAPED_DATA_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Error storing scraped data:', error);
    }
  }

  /**
   * Get scraped data for a URL
   */
  static getScrapedData(): Record<string, ScrapedWebsiteData & { scrapedAt?: string }> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage not available');
        return {};
      }

      const stored = localStorage.getItem(this.SCRAPED_DATA_KEY);
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (error) {
      console.error('Error loading scraped data:', error);
      return {};
    }
  }

  /**
   * Get scraped data for a specific URL
   */
  static getScrapedDataForUrl(url: string): (ScrapedWebsiteData & { scrapedAt?: string }) | null {
    const data = this.getScrapedData();
    return data[url] || null;
  }

  /**
   * Generate a new profile ID
   */
  static generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new profile with basic information
   */
  static createProfile(url: string, name?: string): WebsiteProfile {
    return {
      id: this.generateProfileId(),
      url,
      name: name || new URL(url).hostname,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Set a profile as default
   */
  static setDefaultProfile(profileId: string): void {
    const profiles = this.getProfiles();
    const updatedProfiles = profiles.map(p => ({
      ...p,
      isDefault: p.id === profileId,
    }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProfiles));
  }

  /**
   * Get the default profile
   */
  static getDefaultProfile(): WebsiteProfile | null {
    const profiles = this.getProfiles();
    return profiles.find(p => p.isDefault) || null;
  }

  /**
   * Extract domain from URL for grouping
   */
  static extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  /**
   * Get profiles by domain
   */
  static getProfilesByDomain(domain: string): WebsiteProfile[] {
    return this.getProfiles().filter(p => this.extractDomain(p.url) === domain);
  }
}

export default WebsiteProfileService;
