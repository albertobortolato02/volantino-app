import { NextResponse } from 'next/server';
import { getCachedCategories } from '@/lib/categoryCache';
import { enrichProductWithCategory } from '@/lib/categoryUtils';

export async function POST(request: Request) {
    try {
        const products = await request.json();

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json([]);
        }

        // Get categories (from persistent cache)
        const allCategories = await getCachedCategories();

        // Enrich each product
        const enrichedProducts = products.map(product =>
            enrichProductWithCategory(product, allCategories)
        );

        return NextResponse.json(enrichedProducts);
    } catch (error) {
        console.error('Error enriching products:', error);
        return NextResponse.json(
            { error: 'Failed to enrich products' },
            { status: 500 }
        );
    }
}
