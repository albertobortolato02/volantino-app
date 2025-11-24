import { NextResponse } from 'next/server';
import { getCachedCategories } from '@/lib/categoryCache';

export async function GET() {
    try {
        const categories = await getCachedCategories();
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
