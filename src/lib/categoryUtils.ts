export interface Category {
    id: number;
    name: string;
    parent: number;
}

export interface CategoryInfo {
    path: string;
    rootName: string;
    fullHierarchy: Category[];
    label: string;
}

/**
 * Enriches a product with category information (path, root, hierarchy, label)
 * based on a provided list of all categories.
 */
export function enrichProductWithCategory(product: any, allCategories: any[]): any {
    if (!product.categories || product.categories.length === 0) {
        return product;
    }

    // Build category map for fast lookup
    const categoryMap = new Map<number, Category>();
    allCategories.forEach((cat: any) => {
        categoryMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            parent: cat.parent || 0,
        });
    });

    // Helper to build category hierarchy path
    const buildCategoryPath = (categoryId: number): CategoryInfo => {
        const pathParts: string[] = [];
        const hierarchy: Category[] = [];
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
            label: hierarchy.length >= 2
                ? `${hierarchy[0].name} > ${hierarchy[1].name}`
                : pathParts[0] || ''
        };
    };

    // Find the deepest category
    let deepestCategoryId: number | null = null;
    let maxDepth = -1;

    product.categories.forEach((cat: any) => {
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

    let categoryInfo: CategoryInfo = { path: '', rootName: '', fullHierarchy: [], label: '' };

    if (deepestCategoryId) {
        categoryInfo = buildCategoryPath(deepestCategoryId);
    } else if (product.categories.length > 0) {
        // Fallback to first category if traversal fails
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
}
