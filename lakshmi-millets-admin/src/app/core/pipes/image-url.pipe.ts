import { Pipe, PipeTransform } from '@angular/core';
import { API_BASE_URL } from '../services/config';

// Backend origin, derived from the API base URL (strips the trailing /api)
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Turns a stored `image` value into something an <img> tag can load, no
 * matter where it came from:
 *  - "multi-millet-flour.jpg"      -> local seeded asset (assets/images/<folder>/...)
 *  - "/uploads/products/169...jpg" -> image uploaded via the admin API (served by the backend)
 *  - "https://..."                  -> already a full URL, used as-is
 *
 * Usage: [src]="product.image | imageUrl:'products'"
 */
@Pipe({ name: 'imageUrl' })
export class ImageUrlPipe implements PipeTransform {
  transform(image: string | null | undefined, folder: 'products' | 'categories' | 'recipes' = 'products'): string {
    if (!image) return 'assets/images/placeholder.jpg';
    if (/^https?:\/\//i.test(image)) return image;
    if (image.startsWith('/uploads/')) return BACKEND_ORIGIN + image;
    return `assets/images/${folder}/${image}`;
  }
}
