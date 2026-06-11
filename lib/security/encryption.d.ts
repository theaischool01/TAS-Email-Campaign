export declare function encrypt(text: string): string;
export declare function decrypt(encrypted: string): string;
export declare class NotEncryptedError extends Error {}
export declare class DecryptionFailedError extends Error {}
