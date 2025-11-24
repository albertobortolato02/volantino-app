"use client";

import { startOfISOWeek, endOfISOWeek, setISOWeek, setISOWeekYear, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Promotion } from './PromotionEditor';

interface FlyerPreviewProps {
    promotions: Promotion[];
    week: string; // e.g. "2023-W47"
}

export default function FlyerPreview({ promotions, week }: FlyerPreviewProps) {
    let dateRangeString = "";
    if (week && week.includes('-W')) {
        const [yearStr, weekStr] = week.split('-W');
        const year = parseInt(yearStr);
        const weekNum = parseInt(weekStr);
        const startDate = startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), year), weekNum));
        const endDate = endOfISOWeek(startDate);
        dateRangeString = `dal ${format(startDate, 'dd/MM/yyyy')} al ${format(endDate, 'dd/MM/yyyy')}`;
    }

    return (
        <div className="bg-white p-8 w-[210mm] min-h-[297mm] mx-auto shadow-lg print:shadow-none print:w-full print:h-auto flex flex-col" id="flyer-content">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b-4 border-red-600 pb-4">
                <div className="w-1/3">
                    <img
                        src="https://www.bortolatoefoglia.it/wp-content/uploads/Logo-Bortolato-Foglia.png"
                        alt="Bortolato e Foglia"
                        className="h-20 object-contain"
                    />
                </div>
                <div className="text-right">
                    <h1 className="text-4xl font-black text-red-600 uppercase tracking-tighter">Offerte</h1>
                    <p className="text-xl font-bold text-gray-800">
                        {dateRangeString ? dateRangeString : 'Della Settimana'}
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-4 flex-1 content-start">
                {promotions
                    .sort((a, b) => {
                        // Sort by full category hierarchy path (provided by server), then by product name
                        const pathA = a.product.categoryPath || '';
                        const pathB = b.product.categoryPath || '';
                        if (pathA !== pathB) {
                            return pathA.localeCompare(pathB);
                        }
                        return a.product.name.localeCompare(b.product.name);
                    })
                    .map((promo) => {
                        const [euros, cents] = promo.discountPrice.split('.');
                        const discountPercent = Math.round(((parseFloat(promo.customPrice) - parseFloat(promo.discountPrice)) / parseFloat(promo.customPrice)) * 100);

                        // Find Unit of Measure attribute
                        const umAttribute = promo.product.attributes.find(attr => attr.name === "Unità di misura");
                        const unitOfMeasure = umAttribute ? umAttribute.options[0] : '';

                        // Use the root category name provided by the server
                        const categoryName = promo.product.categoryRoot || '';

                        return (
                            <div key={promo.id} className="border-2 border-yellow-400 p-2 relative flex flex-col items-center bg-white print:break-inside-avoid">
                                {/* Discount Badge */}
                                <div className="absolute top-0 right-0 bg-red-600 text-white font-bold px-2 py-1 text-lg rounded-bl-lg z-10">
                                    -{discountPercent}%
                                </div>

                                {/* Image */}
                                <div className="w-full h-40 flex items-center justify-center mb-2 overflow-hidden">
                                    <img
                                        src={promo.product.images[0]?.src || 'https://placehold.co/300x300?text=No+Image'}
                                        alt={promo.product.name}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>

                                {/* Description */}
                                <div className="text-center mb-2 flex-1 w-full">
                                    <p className="text-xs text-gray-500 mb-1">{promo.product.sku}</p>
                                    <h3 className="font-bold text-sm leading-tight line-clamp-2">{promo.product.name}</h3>
                                    {promo.product.categoryLabel && (
                                        <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wide">{promo.product.categoryLabel}</p>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="w-full bg-yellow-400 p-2 flex justify-between items-end rounded-lg">
                                    <div className="text-xs text-gray-700 line-through mb-1">
                                        € {parseFloat(promo.customPrice).toFixed(2)}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-start font-black text-red-700 leading-none">
                                            <span className="text-3xl">{euros}</span>
                                            <span className="text-sm mt-1">,{cents || '00'}</span>
                                            <span className="text-xl ml-1">€</span>
                                        </div>
                                        {unitOfMeasure && (
                                            <div className="text-[10px] font-bold text-gray-800 leading-none mt-1">
                                                al {unitOfMeasure}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-[10px] text-gray-500 mt-1 w-full text-center">
                                    Valido dal {new Date(promo.startDate).toLocaleDateString('it-IT')} al {new Date(promo.endDate).toLocaleDateString('it-IT')}
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
                <p className="font-bold text-gray-700 mb-2">Bortolato e Foglia SRL</p>
                <div className="flex justify-center gap-4 flex-wrap">
                    <span>Via Aeroporto, 12 | 31055 Quinto di Treviso (TV)</span>
                    <span>P. IVA 00227710266</span>
                    <span>Tel: 0422 470290</span>
                    <span>Email: commerciale@bortolatoefoglia.it</span>
                </div>
                <p className="mt-2 text-[10px]">Le offerte sono valide fino ad esaurimento scorte. Le foto sono indicative.</p>
            </div>
        </div>
    );
}
