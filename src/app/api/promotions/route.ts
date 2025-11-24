import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
    try {
        const promotions = await prisma.promotion.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json({ error: 'Error fetching promotions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, customPrice, discountPrice, startDate, endDate, product } = body;

        console.log('Saving product to DB:', JSON.stringify(product).substring(0, 200));

        const promotion = await prisma.promotion.create({
            data: {
                id, // Use the ID provided by the client (UUID)
                customPrice,
                discountPrice,
                startDate,
                endDate,
                product: JSON.parse(JSON.stringify(product)), // Ensure proper serialization
            },
        });

        console.log('Retrieved from DB:', JSON.stringify(promotion.product).substring(0, 200));

        return NextResponse.json(promotion);
    } catch (error) {
        console.error('Error creating promotion:', error);
        return NextResponse.json({ error: 'Error creating promotion' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, customPrice, discountPrice, startDate, endDate, product } = body;

        const promotion = await prisma.promotion.update({
            where: { id },
            data: {
                customPrice,
                discountPrice,
                startDate,
                endDate,
                product: product as any,
            },
        });
        return NextResponse.json(promotion);
    } catch (error) {
        console.error('Error updating promotion:', error);
        return NextResponse.json({ error: 'Error updating promotion' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.promotion.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        return NextResponse.json({ error: 'Error deleting promotion' }, { status: 500 });
    }
}
