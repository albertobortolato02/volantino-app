"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';

export interface Product {
    id: number;
    name: string;
    sku: string;
    price: string;
    regular_price: string;
    images: { src: string }[];
    categories: { id: number; name: string; slug: string; parent: number }[];
    attributes: { id: number; name: string; options: string[] }[];
    categoryPath?: string;
    categoryRoot?: string;
    categoryHierarchy?: any[];
    categoryLabel?: string;
}

interface ProductSearchProps {
    onSelect: (product: Product) => void;
}

export default function ProductSearch({ onSelect }: ProductSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Cerca per nome o SKU..."
                    className="flex-1 p-2 border rounded-md"
                />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    <Search size={20} />
                </button>
            </div>

            {results.length > 0 && (
                <ul className="border rounded-md divide-y max-h-60 overflow-y-auto bg-white shadow-lg">
                    {results.map((product) => (
                        <li
                            key={product.id}
                            onClick={() => {
                                onSelect(product);
                                setResults([]);
                                setQuery('');
                            }}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        >
                            <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.sku}</div>
                            </div>
                            <div className="font-bold">€{product.price}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
