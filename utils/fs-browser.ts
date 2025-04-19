interface FileSystemAPI {
  readdir: (path: string) => Promise<string[]>;
  readFile: (path: string, encoding: string) => Promise<string>;
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
}

class BrowserFileSystem implements FileSystemAPI {
  private dirHandle: FileSystemDirectoryHandle | null = null;

  private async getDirectoryHandle(networkPath: string): Promise<FileSystemDirectoryHandle> {
    if (!window.showDirectoryPicker) {
      throw new Error('File System Access API is not supported in this browser');
    }

    try {
      this.dirHandle = await window.showDirectoryPicker();
      return this.dirHandle;
    } catch (error) {
      throw new Error(`Failed to access directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async readdir(path: string): Promise<string[]> {
    const dirHandle = await this.getDirectoryHandle(path);
    const entries: string[] = [];
    
    for await (const [name] of dirHandle.entries()) {
      entries.push(name);
    }
    
    return entries;
  }

  async readFile(path: string, encoding: string): Promise<string> {
    if (!this.dirHandle) {
      throw new Error('No directory selected');
    }

    const fileName = path.split('\\').pop();
    if (!fileName) {
      throw new Error('Invalid file path');
    }

    try {
      const fileHandle = await this.dirHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

const fs = new BrowserFileSystem();
export default fs; 