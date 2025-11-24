import { NextResponse } from 'next/server';
import { getCachedCategories } from '@/lib/categoryCache';

export async function POST(request: Request) {
    try {
        const { force } = await request.json().catch(() => ({ force: false }));
        const start = Date.now();
        const categories = await getCachedCategories(force);
        const duration = Date.now() - start;
        return NextResponse.json({
            message: 'Categories cache warmup completed',
            count: categories.length,
            durationMs: duration,
        });
    } catch (error) {
        console.error('Warmup error:', error);
        return NextResponse.json({ error: 'Warmup failed' }, { status: 500 });
    }
}
