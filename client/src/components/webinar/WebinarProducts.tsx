import { Button } from '@/components/ui/button';
import { useWebinar } from '@/contexts/WebinarContext';
import { Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

export function WebinarProducts() {
  const { products, favorites, toggleFavorite, currentProduct } = useWebinar();
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  if (products.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#0F0F23]/80 rounded-xl border border-purple-500/20 p-4">
        <p className="text-gray-400 text-center">No products available yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0F0F23]/80 rounded-xl border border-purple-500/20">
      {/* Current product highlight */}
      {currentProduct && (
        <div className="border-b border-purple-500/20 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <p className="text-xs text-purple-400 font-semibold mb-2">NOW SHOWCASING</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xl flex-shrink-0">
              {currentProduct.image}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm truncate">{currentProduct.name}</h4>
              <p className="text-purple-400 font-bold text-sm">{currentProduct.price}</p>
            </div>
          </div>
        </div>
      )}

      {/* Products list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {products.map((product) => {
          const isFavorited = favorites.includes(product.id);
          const isSelected = selectedProduct === product.id;

          return (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product.id)}
              className={`bg-white/5 rounded-lg p-4 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-white/10 hover:border-purple-500/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                  {product.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-sm truncate">{product.name}</h4>
                  <p className="text-purple-400 font-bold text-sm">{product.price}</p>
                  <p className="text-gray-400 text-xs">MOQ: {product.moq}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                  className={`flex-1 border-white/20 text-white hover:bg-white/5 ${
                    isFavorited ? 'bg-red-500/20 border-red-500/30' : ''
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Saved' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Inquire
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
