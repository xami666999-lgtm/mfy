import type { Stream, Subtitle, MetaItem, Addon, Catalog, SearchResult, Movie, Series } from '../types';

class StreamService {
  private addons: Addon[] = [];
  private cache = new Map<string, any>();
  private cacheExpiry = 5 * 60 * 1000;

  setAddons(addons: Addon[]) {
    this.addons = addons;
  }

  async getMeta(type: 'movie' | 'series', id: string): Promise<MetaItem | null> {
    const cacheKey = `meta:${type}:${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    for (const addon of this.addons) {
      if (!addon.resources.includes('meta')) continue;
      if (!addon.types.includes(type)) continue;

      try {
        const response = await this.fetchAddon(addon, `/meta/${type}/${id}.json`);
        if (response?.meta) {
          this.setCache(cacheKey, response.meta);
          return response.meta;
        }
      } catch (e) {
        console.warn(`Addon ${addon.name} meta failed:`, e);
      }
    }
    return null;
  }

  async getStreams(type: 'movie' | 'series', id: string): Promise<Stream[]> {
    const cacheKey = `streams:${type}:${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const streams: Stream[] = [];

    for (const addon of this.addons) {
      if (!addon.resources.includes('stream')) continue;
      if (!addon.types.includes(type)) continue;

      try {
        const response = await this.fetchAddon(addon, `/stream/${type}/${id}.json`);
        if (response?.streams) {
          streams.push(...response.streams);
        }
      } catch (e) {
        console.warn(`Addon ${addon.name} streams failed:`, e);
      }
    }

    this.setCache(cacheKey, streams);
    return streams;
  }

  async getSubtitles(type: 'movie' | 'series', id: string): Promise<Subtitle[]> {
    const cacheKey = `subtitles:${type}:${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const subtitles: Subtitle[] = [];

    for (const addon of this.addons) {
      if (!addon.resources.includes('subtitles')) continue;
      if (!addon.types.includes(type)) continue;

      try {
        const response = await this.fetchAddon(addon, `/subtitles/${type}/${id}.json`);
        if (response?.subtitles) {
          subtitles.push(...response.subtitles);
        }
      } catch (e) {
        console.warn(`Addon ${addon.name} subtitles failed:`, e);
      }
    }

    this.setCache(cacheKey, subtitles);
    return subtitles;
  }

  async search(query: string, type?: 'movie' | 'series'): Promise<SearchResult> {
    const cacheKey = `search:${type || 'all'}:${query}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const results: SearchResult = { movies: [], series: [] };

    for (const addon of this.addons) {
      if (!addon.resources.includes('catalog')) continue;

      for (const catalog of addon.catalogs) {
        if (type && catalog.type !== type) continue;

        try {
          const response = await this.fetchAddon(addon, `/catalog/${catalog.type}/${catalog.id}/search=${encodeURIComponent(query)}.json`);
          if (response?.metas) {
            for (const meta of response.metas) {
              if (meta.type === 'movie') results.movies.push(meta as Movie);
              else if (meta.type === 'series') results.series.push(meta as Series);
            }
          }
        } catch (e) {
          console.warn(`Addon ${addon.name} search failed:`, e);
        }
      }
    }

    this.setCache(cacheKey, results);
    return results;
  }

  async getCatalog(catalogId: string, type: 'movie' | 'series', extra?: Record<string, string>): Promise<MetaItem[]> {
    const cacheKey = `catalog:${catalogId}:${type}:${JSON.stringify(extra)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const items: MetaItem[] = [];

    for (const addon of this.addons) {
      const catalog = addon.catalogs.find((c) => c.id === catalogId);
      if (!catalog) continue;

      try {
        let url = `/catalog/${type}/${catalogId}.json`;
        if (extra) {
          const params = new URLSearchParams(extra).toString();
          if (params) url += `?${params}`;
        }
        const response = await this.fetchAddon(addon, url);
        if (response?.metas) {
          items.push(...response.metas);
        }
      } catch (e) {
        console.warn(`Addon ${addon.name} catalog failed:`, e);
      }
    }

    this.setCache(cacheKey, items);
    return items;
  }

  private async fetchAddon(addon: Addon, path: string): Promise<any> {
    if (!addon.transportUrl) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), addon.timeout || 10000);

    try {
      const response = await fetch(`${addon.transportUrl}${path}`, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private getCached(key: string): any {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.time < this.cacheExpiry) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, time: Date.now() });
  }

  clearCache() {
    this.cache.clear();
  }
}

export const streamService = new StreamService();