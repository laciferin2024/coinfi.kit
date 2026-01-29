import { PUBLIC_GOOGLE_CLIENT_ID } from "$env/static/public";

export class GoogleDriveService {
  private gapi: any;
  private tokenClient: any;
  private accessToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.gapi = (window as any).gapi;
      this.tokenClient = (window as any).google?.accounts.oauth2.initTokenClient({
        client_id: PUBLIC_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.appdata',
        callback: (response: any) => {
          if (response.error !== undefined) {
            throw response;
          }
          this.accessToken = response.access_token;
        },
      });
    }
  }

  async authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) return reject("Google Identity Services not initialized");

      this.tokenClient.callback = (response: any) => {
        if (response.error) return reject(response);
        this.accessToken = response.access_token;
        resolve();
      };

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  async backupShare(walletAddress: string, deviceShare: string): Promise<void> {
    if (!this.accessToken) await this.authenticate();

    const fileName = `coinfi_share_${walletAddress.toLowerCase()}.json`;
    const metadata = {
      name: fileName,
      parents: ['appDataFolder'],
    };

    const fileContent = JSON.stringify({
      address: walletAddress,
      share: deviceShare,
      timestamp: Date.now()
    });

    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      close_delim;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to backup to Google Drive: ${response.statusText}`);
    }

    console.log(`[GoogleDrive] Backup successful for ${walletAddress}`);
  }

  async restoreShare(walletAddress: string): Promise<string | null> {
    if (!this.accessToken) await this.authenticate();

    // Query for the file in appDataFolder
    const fileName = `coinfi_share_${walletAddress.toLowerCase()}.json`;
    const query = `name = '${fileName}' and 'appDataFolder' in parents`;

    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );

    if (!listResponse.ok) throw new Error("Failed to query Google Drive");
    const listData = await listResponse.json();

    if (listData.files && listData.files.length > 0) {
      const fileId = listData.files[0].id;
      const fileResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );

      if (!fileResponse.ok) throw new Error("Failed to download share from drive");
      const data = await fileResponse.json();
      return data.share;
    }

    return null;
  }

  async listBackups(): Promise<Array<{ id: string; name: string; createdTime?: string }>> {
    if (!this.accessToken) await this.authenticate();

    // Query for any file starting with coinfi_share_ in appDataFolder
    const query = "name contains 'coinfi_share_' and 'appDataFolder' in parents and trashed = false";

    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&orderBy=createdTime desc&q=${encodeURIComponent(query)}&fields=files(id, name, createdTime)`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );

    if (!listResponse.ok) throw new Error("Failed to list backups from Google Drive");
    const listData = await listResponse.json();
    return listData.files || [];
  }

  async restoreFile(fileId: string): Promise<{ address: string; share: string; timestamp: number }> {
    if (!this.accessToken) await this.authenticate();

    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );

    if (!fileResponse.ok) throw new Error("Failed to download file content");
    return await fileResponse.json();
  }
}

export const googleDriveService = new GoogleDriveService();
