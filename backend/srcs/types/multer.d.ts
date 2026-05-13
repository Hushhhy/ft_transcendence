declare module 'multer' {
	import type { RequestHandler } from 'express';

	export type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

	export interface MulterFile {
		filename: string;
		originalname: string;
		mimetype: string;
	}

	export interface DiskStorageOptions {
		destination?: string | ((req: unknown, file: MulterFile, cb: (error: Error | null, destination?: string) => void) => void);
		filename?: (req: unknown, file: MulterFile, cb: (error: Error | null, filename?: string) => void) => void;
	}

	export interface Options {
		storage?: unknown;
		fileFilter?: (req: unknown, file: MulterFile, cb: FileFilterCallback) => void;
		limits?: {
			fileSize?: number;
		};
	}

	export interface MulterInstance {
		single(fieldName: string): RequestHandler;
	}

	export interface MulterStatic {
		diskStorage(options: DiskStorageOptions): unknown;
		(options?: Options): MulterInstance;
	}

	declare const multer: MulterStatic;
	export default multer;
}