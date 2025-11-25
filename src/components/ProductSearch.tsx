"use client";

import { useState, useEffect, useCallback } from 'react';
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

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce search with 500ms delay
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    const handleProductSelect = (product: Product) => {
        // Use product directly from search results (fast)
        onSelect(product);
        setResults([]);
        setQuery('');
    };

    return (
        <div className="w-full max-w-md space-y-4">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cerca per nome o SKU (min 2 caratteri)..."
                    className="w-full p-2 pr-10 border rounded-md"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {loading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    ) : (
                        <Search size={20} className="text-gray-400" />
                    )}
                </div>
            </div>

            {results.length > 0 && (
                <ul className="border rounded-md divide-y max-h-60 overflow-y-auto bg-white shadow-lg">
                    {results.map((product) => (
                        <li
                            key={product.id}
                            onClick={() => handleProductSelect(product)}
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
