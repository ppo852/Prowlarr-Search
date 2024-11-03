import { api } from './api';

interface GlobalSettings {
  prowlarr_url: string;
  prowlarr_api_key: string;
  tmdb_access_token: string;
  min_seeds: number;
}

class GlobalSettingsManager {
  private settings: Partial<GlobalSettings> = {
    prowlarr_url: '',
    prowlarr_api_key: '',
    tmdb_access_token: '',
    min_seeds: 3
  };

  async load() {
    try {
      const settings = await api.getSettings();
      this.settings = {
        ...this.settings,
        ...settings
      };
      return this.settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      throw error;
    }
  }

  getProwlarrSettings() {
    return {
      url: this.settings.prowlarr_url || '',
      apiKey: this.settings.prowlarr_api_key || ''
    };
  }

  getTmdbAccessToken(): string {
    return this.settings.tmdb_access_token || '';
  }

  getMinSeeds(): number {
    return this.settings.min_seeds ?? 3;
  }

  async updateSettings(settings: Partial<GlobalSettings>): Promise<void> {
    try {
      await api.updateSettings(settings);
      this.settings = {
        ...this.settings,
        ...settings
      };
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }
}

export const globalSettings = new GlobalSettingsManager();