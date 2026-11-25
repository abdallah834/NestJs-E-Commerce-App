export type CloudinaryDeliveryType = 'upload' | 'authenticated' | 'private';
export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';
// the SDK's Admin API methods are typed as Promise<any>
export type ApiResponse = Record<string, unknown>;
