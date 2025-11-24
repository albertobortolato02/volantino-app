"use client";

import { useState, useEffect } from 'react';
import ProductSearch, { Product } from '@/components/ProductSearch';
import PromotionEditor, { Promotion } from '@/components/PromotionEditor';
import FlyerPreview from '@/components/FlyerPreview';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Printer, Trash2, Edit } from 'lucide-react';
import { startOfISOWeek, endOfISOWeek, setISOWeek, setISOWeekYear, areIntervalsOverlapping, parseISO } from 'date-fns';

export default function Home() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [selectedWeek, setSelectedWeek] = useState<string>("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/promotions');
      const data = await res.json();
      setPromotions(data);
    } catch (error) {
      console.error("Failed to fetch promotions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromotion = async (promo: Promotion) => {
    try {
      if (editingPromotion) {
        // Update existing
        const res = await fetch('/api/promotions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promo),
        });
        if (res.ok) {
          const updatedPromo = await res.json();
          setPromotions(promotions.map(p => p.id === editingPromotion.id ? updatedPromo : p));
          setEditingPromotion(null);
        }
      } else {
        // Add new
        const res = await fetch('/api/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promo),
        });
        if (res.ok) {
          const newPromo = await res.json();
          setPromotions([newPromo, ...promotions]);
        }
      }
      setSelectedProduct(null);
    } catch (error) {
      console.error("Failed to save promotion", error);
      alert("Errore nel salvataggio della promozione");
    }
  };

  const handleDelete = (id: string) => {
    setPromoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (promoToDelete) {
      try {
        const res = await fetch(`/api/promotions?id=${promoToDelete}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setPromotions(promotions.filter(p => p.id !== promoToDelete));
        }
      } catch (error) {
        console.error("Failed to delete promotion", error);
        alert("Errore nell'eliminazione della promozione");
      }
    }
    setDeleteDialogOpen(false);
    setPromoToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setPromoToDelete(null);
  };

  const handleEdit = (promo: Promotion) => {
    setSelectedProduct(promo.product);
    setEditingPromotion(promo);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter promotions based on selected week
  const filteredPromotions = selectedWeek ? promotions.filter(p => {
    const [yearStr, weekStr] = selectedWeek.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);

    const weekStart = startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), year), week));
    const weekEnd = endOfISOWeek(weekStart);

    const promoStart = parseISO(p.startDate);
    const promoEnd = parseISO(p.endDate);

    return areIntervalsOverlapping(
      { start: weekStart, end: weekEnd },
      { start: promoStart, end: promoEnd },
      { inclusive: true }
    );
  }) : promotions;

  return (
    <main className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto print:max-w-none print:mx-0">
        {/* Toolbar - Hidden when printing */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
          <h1 className="text-2xl font-bold text-gray-800">Generatore Volantini</h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white p-2 rounded shadow-sm">
              <label className="text-sm font-medium text-gray-600">Settimana Volantino:</label>
              <input
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="border rounded p-1"
              />
              {selectedWeek && (
                <button onClick={() => setSelectedWeek("")} className="text-xs text-red-500 hover:underline">
                  Reset
                </button>
              )}
            </div>

            <button
              onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              {viewMode === 'edit' ? 'Vedi Anteprima' : 'Torna all\'Editor'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer size={20} /> Stampa / PDF
            </button>
          </div>
        </div>

        {viewMode === 'edit' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Search & Editor */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-bold mb-4">
                  {editingPromotion ? 'Modifica Promozione' : 'Aggiungi Prodotto'}
                </h2>
                {!selectedProduct ? (
                  <ProductSearch onSelect={setSelectedProduct} />
                ) : (
                  <PromotionEditor
                    product={selectedProduct}
                    initialValues={editingPromotion || undefined}
                    onSave={handleSavePromotion}
                    onCancel={() => {
                      setSelectedProduct(null);
                      setEditingPromotion(null);
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right Column: List of Promotions */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">
                    {selectedWeek ? `Promozioni per ${selectedWeek}` : 'Tutte le Promozioni'}
                    ({filteredPromotions.length})
                  </h2>
                  {selectedWeek && filteredPromotions.length < promotions.length && (
                    <span className="text-sm text-gray-500">
                      (Totale salvate: {promotions.length})
                    </span>
                  )}
                </div>

                {filteredPromotions.length === 0 ? (
                  <p className="text-gray-500">
                    {selectedWeek
                      ? "Nessuna promozione attiva in questa settimana."
                      : "Nessuna promozione inserita."}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredPromotions.map(promo => (
                      <div key={promo.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <img
                            src={promo.product.images[0]?.src}
                            alt=""
                            className="w-12 h-12 object-contain"
                          />
                          <div>
                            <div className="font-bold">{promo.product.name}</div>
                            <div className="text-sm text-gray-500">
                              €{promo.discountPrice} (da €{promo.customPrice})
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(promo);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(promo.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <FlyerPreview promotions={filteredPromotions} week={selectedWeek || "Tutte le offerte"} />
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Conferma eliminazione"
        message="Sei sicuro di voler eliminare questa promozione?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </main>
  );
}
