import { PrismaClient } from '@prisma/client';
import { wcApi } from '@/lib/woocommerce';

const prisma = new PrismaClient();

// TTL in milliseconds (default 1 hour)
const CACHE_TTL_MS = (parseInt(process.env.CATEGORY_CACHE_TTL_HOURS || '1', 10) * 60 * 60 * 1000);

/**
 * Retrieve categories from persistent cache (PostgreSQL). If cache is missing or stale, fetch from WooCommerce and update.
 * @param forceRefresh - if true, bypass cache and fetch fresh data.
 */
export async function getCachedCategories(forceRefresh: boolean = false) {
    // Try to read from DB
    const cacheEntry = await prisma.categoryCache.findUnique({ where: { id: 'categories' } });
    const now = Date.now();

    if (!forceRefresh && cacheEntry) {
        const age = now - new Date(cacheEntry.fetchedAt).getTime();
        if (age < CACHE_TTL_MS) {
            // Cache still valid
            return cacheEntry.data as any[];
        }
    }

    // Fetch fresh categories from WooCommerce (handle pagination)
    let allCategories: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const resp = await wcApi.get('products/categories', { per_page: 100, page });
        const data = resp.data;
        if (data.length === 0) {
            hasMore = false;
        } else {
            allCategories = allCategories.concat(data);
            page++;
        }
    }

    // Upsert cache entry
    await prisma.categoryCache.upsert({
        where: { id: 'categories' },
        update: { data: allCategories, fetchedAt: new Date() },
        create: { id: 'categories', data: allCategories, fetchedAt: new Date() },
    });

    return allCategories;
}
