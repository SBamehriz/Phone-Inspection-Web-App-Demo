// Cloud storage is disabled in demo mode.
// In production, this module handles uploads to S3-compatible storage (e.g. DigitalOcean Spaces).
// Images and reports are served locally from the /temp directory instead.

export async function uploadToSpaces(_file: any): Promise<string> {
  throw new Error("Cloud storage is not available in demo mode. Images are stored locally.");
}

export async function uploadReportToSpaces(_filePath: string, _fileName: string): Promise<string> {
  throw new Error("Cloud storage is not available in demo mode. Reports are served locally.");
}
