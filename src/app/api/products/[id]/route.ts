import { NextResponse } from 'next/server';
import { wcApi } from '@/lib/woocommerce';


export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;

        // Get the product
        const productResponse = await wcApi.get(`products/${productId}`);
        const product = productResponse.data;

        // Return raw product without enrichment
        // Enrichment will happen in background via /api/products/enrich
        return NextResponse.json(product);
    } catch (error: any) {
        console.error('Error fetching product:', error);

        // If WooCommerce API fails (404, etc), return error
        return NextResponse.json(
            { error: 'Failed to fetch product details' },
            { status: error.response?.status || 500 }
        );
    }
}
