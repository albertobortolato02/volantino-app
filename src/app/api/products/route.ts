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
        // Get products - fast search without category enrichment
        const response = await wcApi.get("products", {
            search,
            per_page: 50,
            status: 'publish',
        });

        return NextResponse.json(response.data);
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
