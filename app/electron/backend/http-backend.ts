import { IBackendAPI, SearchParams, AnalyzeParams, AnalyzeResult, Video, BackendConfig } from './types';

export class HttpBackend implements IBackendAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const resp = await fetch(`${this.baseUrl}${path}`, options);
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Backend API error ${resp.status}: ${body}`);
    }
    return resp.json() as Promise<T>;
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async health(): Promise<{ status: string }> {
    return this.request('/health');
  }

  async fetchHomepage(platform: string): Promise<Video[]> {
    const resp = await this.post<{ videos: Video[] }>('/homepage', { platform, keyword: '' });
    return resp.videos;
  }

  async search(params: SearchParams): Promise<Video[]> {
    const resp = await this.post<{ videos: Video[] }>('/search', params);
    return resp.videos;
  }

  async analyze(params: AnalyzeParams): Promise<AnalyzeResult> {
    return this.post<AnalyzeResult>('/analyze', params);
  }

  async updateConfig(config: BackendConfig): Promise<BackendConfig> {
    return this.post<BackendConfig>('/config', config);
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}
