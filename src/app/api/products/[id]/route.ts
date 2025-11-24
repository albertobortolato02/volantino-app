import { NextResponse } from 'next/server';
import { wcApi } from '@/lib/woocommerce';
import { getCachedCategories } from '@/lib/categoryCache';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;

        // Get the product
        const productResponse = await wcApi.get(`products/${productId}`);
        const product = productResponse.data;

        // Get categories (from persistent cache)
        const allCategories = await getCachedCategories();

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
    } catch (error: any) {
        console.error('Error fetching product with categories:', error);

        // If WooCommerce API fails (404, etc), return error
        // The frontend will use the fallback (original product without enrichment)
        return NextResponse.json(
            { error: 'Failed to fetch product details' },
            { status: error.response?.status || 500 }
        );
    }
}
