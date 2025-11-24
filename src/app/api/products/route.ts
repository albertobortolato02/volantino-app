import { NextResponse } from 'next/server';
import { wcApi } from '@/lib/woocommerce';

const MOCK_PRODUCTS = [
    {
        id: 1,
        name: "Pasta Barilla Spaghetti n.5 500g",
        sku: "BAR001",
        price: "1.20",
        regular_price: "1.20",
        sale_price: "",
        images: [{ src: "https://www.bortolatoefoglia.it/wp-content/uploads/BAR001.jpg" }],
        description: "Spaghetti di semola di grano duro.",
    },
    {
        id: 2,
        name: "Passata di Pomodoro Mutti 700g",
        sku: "MUT001",
        price: "1.50",
        regular_price: "1.50",
        sale_price: "",
        images: [{ src: "https://www.bortolatoefoglia.it/wp-content/uploads/MUT001.jpg" }],
        description: "Passata di pomodoro dolce.",
    },
    {
        id: 3,
        name: "Caffè Lavazza Qualità Rossa 250g",
        sku: "LAV001",
        price: "3.50",
        regular_price: "3.50",
        sale_price: "",
        images: [{ src: "https://www.bortolatoefoglia.it/wp-content/uploads/LAV001.jpg" }],
        description: "Miscela di caffè macinato.",
    },
    {
        id: 4,
        name: "Biscotti Mulino Bianco Macine 350g",
        sku: "MUL001",
        price: "2.80",
        regular_price: "2.80",
        sale_price: "",
        images: [{ src: "https://www.bortolatoefoglia.it/wp-content/uploads/MUL001.jpg" }],
        description: "Biscotti frollini con panna fresca.",
    },
    {
        id: 5,
        name: "Acqua Minerale Naturale Levissima 1.5L",
        sku: "LEV001",
        price: "0.45",
        regular_price: "0.45",
        sale_price: "",
        images: [{ src: "https://www.bortolatoefoglia.it/wp-content/uploads/LEV001.jpg" }],
        description: "Acqua minerale naturale oligominerale.",
    }
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Try to fetch from WooCommerce
    try {
        // First, get all categories to build the map
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
                if (visited.has(currentId)) break; // Prevent infinite loops
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

        // Get products
        const response = await wcApi.get("products", {
            search,
            per_page: 20,
            status: 'publish',
        });

        // Enrich products with full category hierarchy
        const enrichedProducts = response.data.map((product: any) => {
            // Find the deepest category (the one with the most parents in the chain)
            let deepestCategoryId: number | null = null;
            let maxDepth = -1;

            product.categories.forEach((cat: any) => {
                // Use the category from our map which has the parent field
                const fullCat = categoryMap.get(cat.id);
                if (!fullCat) return;

                let depth = 0;
                let currentId = fullCat.id;
                const visited = new Set<number>();

                // Count how many parents this category has
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

            // Build the full hierarchy path from the deepest category
            if (deepestCategoryId) {
                const info = buildCategoryPath(deepestCategoryId);
                categoryInfo = {
                    ...info,
                    label: info.fullHierarchy.length >= 2
                        ? `${info.fullHierarchy[0].name} > ${info.fullHierarchy[1].name}`
                        : info.rootName
                };
            } else if (product.categories && product.categories.length > 0) {
                // Fallback: use first category name if no hierarchy found
                const firstCat = product.categories[0];
                categoryInfo = {
                    path: firstCat.name,
                    rootName: firstCat.name,
                    fullHierarchy: [firstCat],
                    label: firstCat.name
                };
            }

            return {
                ...product,
                categoryPath: categoryInfo.path,
                categoryRoot: categoryInfo.rootName,
                categoryHierarchy: categoryInfo.fullHierarchy,
                categoryLabel: categoryInfo.label,
            };
        });

        return NextResponse.json(enrichedProducts);
    } catch (error) {
        console.error("WooCommerce API Error:", error);
        // Fallback to mock data on error
        const filtered = MOCK_PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())
        );
        return NextResponse.json(filtered);
    }
}
