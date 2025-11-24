"use client";

import { useState, useEffect } from 'react';
import { Product } from './ProductSearch';

export interface Promotion {
    id: string;
    product: Product;
    customPrice: string; // Base price (editable)
    discountPrice: string; // Promo price
    startDate: string;
    endDate: string;
}

interface PromotionEditorProps {
    product: Product | null;
    initialValues?: Partial<Promotion>;
    onSave: (promotion: Promotion) => void;
    onCancel: () => void;
}

export default function PromotionEditor({ product, initialValues, onSave, onCancel }: PromotionEditorProps) {
    const [customPrice, setCustomPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (product) {
            if (initialValues) {
                setCustomPrice(initialValues.customPrice || product.regular_price || product.price);
                setDiscountPrice(initialValues.discountPrice || product.price);
                setStartDate(initialValues.startDate || '');
                setEndDate(initialValues.endDate || '');
            } else {
                setCustomPrice(product.regular_price || product.price);
                setDiscountPrice(product.price);
                setStartDate('');
                setEndDate('');
            }
        }
    }, [product, initialValues]);

    if (!product) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (startDate > endDate) {
            alert("La data di fine non può essere precedente alla data di inizio!");
            return;
        }

        onSave({
            id: initialValues?.id || crypto.randomUUID(),
            product,
            customPrice,
            discountPrice,
            startDate,
            endDate,
        });
    };

    const discountPercent = customPrice && discountPrice
        ? Math.round(((parseFloat(customPrice) - parseFloat(discountPrice)) / parseFloat(customPrice)) * 100)
        : 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-bold text-lg">
                {initialValues ? 'Modifica Promozione' : 'Nuova Promozione'}: {product.name}
            </h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Prezzo Base (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Prezzo Offerta (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(e.target.value)}
                        className="w-full p-2 border rounded text-red-600 font-bold"
                        required
                    />
                </div>
            </div>

            <div className="text-sm text-gray-600">
                Sconto calcolato: <span className="font-bold text-green-600">-{discountPercent}%</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Dal</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Al</label>
                    <input
                        type="date"
                        min={startDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">
                    Annulla
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Salva Promozione
                </button>
            </div>
        </form>
    );
}
