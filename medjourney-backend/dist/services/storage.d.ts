import multer from 'multer';
import { StorageService } from '../types/services';
declare class LocalStorageService implements StorageService {
    private uploadPath;
    private baseUrl;
    constructor();
    private ensureUploadDirectory;
    uploadFile(file: Express.Multer.File, bucket: string): Promise<{
        url: string;
        filename: string;
        size: number;
    }>;
    deleteFile(filename: string, bucket: string): Promise<boolean>;
    getFileUrl(filename: string, bucket: string): Promise<string>;
    listFiles(bucket: string, prefix?: string): Promise<string[]>;
    private validateFile;
    private processImage;
}
declare class SupabaseStorageService implements StorageService {
    private client;
    private defaultBucket;
    constructor();
    uploadFile(file: Express.Multer.File, bucket?: string): Promise<{
        url: string;
        filename: string;
        size: number;
    }>;
    deleteFile(filename: string, bucket?: string): Promise<boolean>;
    getFileUrl(filename: string, bucket?: string): Promise<string>;
    listFiles(bucket?: string, prefix?: string): Promise<string[]>;
    private validateFile;
}
export declare const multerConfig: multer.Multer;
declare class StorageServiceFactory {
    private static instance;
    static create(): StorageService;
    static getInstance(): StorageService | null;
    static reset(): void;
}
export { StorageServiceFactory, LocalStorageService, SupabaseStorageService };
export default StorageServiceFactory;
//# sourceMappingURL=storage.d.ts.map