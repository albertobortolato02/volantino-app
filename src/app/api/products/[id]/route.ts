import { NextResponse } from 'next/server';
import { wcApi } from '@/lib/woocommerce';

// Category cache with 1-hour TTL
let categoryCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

async function getCategoriesWithCache() {
    const now = Date.now();

    // Return cached data if valid
    if (categoryCache && (now - categoryCache.timestamp) < CACHE_TTL) {
        return categoryCache.data;
    }

    // Fetch all categories
    let allCategories: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const categoriesResponse = await wcApi.get("products/categories", {
            per_page: 100,
            page: page,
        });

        if (categoriesResponse.data.length === 0) {
            hasMore = false;
        } else {
            allCategories = allCategories.concat(categoriesResponse.data);
            page++;
        }
    }

    // Update cache
    categoryCache = {
        data: allCategories,
        timestamp: now
    };

    return allCategories;
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const productId = params.id;

        // Get the product
        const productResponse = await wcApi.get(`products/${productId}`);
        const product = productResponse.data;

        // Get categories (from cache if available)
        const allCategories = await getCategoriesWithCache();

        // Build category map
        const categoryMap = new Map<number, { id: number; name: string; parent: number }>();
        allCategories.forEach((cat: any) => {
            categoryMap.set(cat.id, {
                id: cat.id,
                name: cat.name,
                parent: cat.parent || 0,
            });
        });

        // Helper to build category hierarchy path
        const buildCategoryPath = (categoryId: number): { path: string; rootName: string; fullHierarchy: any[] } => {
            const pathParts: string[] = [];
            const hierarchy: any[] = [];
            let currentId = categoryId;
            const visited = new Set<number>();

            // Traverse up the parent chain
            while (currentId && currentId !== 0) {
                if (visited.has(currentId)) break;
                visited.add(currentId);

                const cat = categoryMap.get(currentId);
                if (!cat) break;

                pathParts.unshift(cat.name);
                hierarchy.unshift(cat);

                currentId = cat.parent;
            }

            return {
                path: pathParts.join(' / '),
                rootName: pathParts[0] || '',
                fullHierarchy: hierarchy,
            };
        };

        // Find the deepest category
        let deepestCategoryId: number | null = null;
        let maxDepth = -1;

        product.categories?.forEach((cat: any) => {
            const fullCat = categoryMap.get(cat.id);
            if (!fullCat) return;

            let depth = 0;
            let currentId = fullCat.id;
            const visited = new Set<number>();

            while (currentId && currentId !== 0) {
                if (visited.has(currentId)) break;
                visited.add(currentId);

                const current = categoryMap.get(currentId);
                if (!current) break;

                depth++;
                currentId = current.parent;
            }

            if (depth > maxDepth) {
                maxDepth = depth;
                deepestCategoryId = fullCat.id;
            }
        });

        let categoryInfo = { path: '', rootName: '', fullHierarchy: [] as any[], label: '' };

        if (deepestCategoryId) {
            const info = buildCategoryPath(deepestCategoryId);
            categoryInfo = {
                ...info,
                label: info.fullHierarchy.length >= 2
                    ? `${info.fullHierarchy[0].name} > ${info.fullHierarchy[1].name}`
                    : info.rootName
            };
        } else if (product.categories && product.categories.length > 0) {
            const firstCat = product.categories[0];
            categoryInfo = {
                path: firstCat.name,
                rootName: firstCat.name,
                fullHierarchy: [firstCat],
                label: firstCat.name
            };
        }

        return NextResponse.json({
            ...product,
            categoryPath: categoryInfo.path,
            categoryRoot: categoryInfo.rootName,
            categoryHierarchy: categoryInfo.fullHierarchy,
            categoryLabel: categoryInfo.label,
        });
    } catch (error) {
        console.error('Error fetching product with categories:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}
