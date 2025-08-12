'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Tag, Sparkles } from 'lucide-react';
import { validatePromoCode, formatDiscount, type PromoCodeValidation } from '@/lib/promo-codes';

interface PromoCodeInputProps {
  planTier: 'Growth' | 'Transformation';
  originalPrice: number;
  onPromoApplied: (validation: PromoCodeValidation) => void;
  onPromoRemoved: () => void;
  className?: string;
}

export function PromoCodeInput({
  planTier,
  originalPrice,
  onPromoApplied,
  onPromoRemoved,
  className = ''
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [validation, setValidation] = useState<PromoCodeValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = validatePromoCode(promoCode.trim(), planTier, originalPrice);
    setValidation(result);
    
    if (result.isValid) {
      onPromoApplied(result);
    }
    
    setIsLoading(false);
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setValidation(null);
    setShowInput(false);
    onPromoRemoved();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyPromo();
    }
  };

  if (validation?.isValid) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Promo code applied!</div>
                <div className="text-sm text-green-700">
                  {validation.promoCode?.description}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {formatDiscount(validation.promoCode!)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePromo}
                  className="text-green-700 hover:text-green-900 hover:bg-green-100"
                >
                  Remove
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!showInput) {
    return (
      <Button
        variant="outline"
        onClick={() => setShowInput(true)}
        className={`w-full ${className}`}
      >
        <Tag className="h-4 w-4 mr-2" />
        Have a promo code?
      </Button>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={handleApplyPromo}
          disabled={!promoCode.trim() || isLoading}
          className="whitespace-nowrap"
        >
          {isLoading ? 'Applying...' : 'Apply'}
        </Button>
      </div>

      {validation && !validation.isValid && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {validation.errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowInput(false)}
        className="text-gray-500 hover:text-gray-700"
      >
        Cancel
      </Button>
    </div>
  );
}