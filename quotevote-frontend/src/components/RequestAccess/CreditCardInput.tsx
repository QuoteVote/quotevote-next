'use client';

/**
 * CreditCardInput Component
 * 
 * Component for credit card input with formatting for card number, expiry, and CVC.
 * Migrated from Material UI to shadcn/ui components.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreditCardInputProps } from '@/types/components';

export function CreditCardInput({
  cardNumberInputProps = {},
  cardExpiryInputProps = {},
  cardCVCInputProps = {},
  containerStyle,
  inputStyle,
  customTextLabels,
  fieldClassName = '',
}: CreditCardInputProps) {
  const formatCardNumber = (value: string): string => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts: string[] = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return v;
  };

  const formatExpiry = (value: string): string => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    e.target.value = formatted;
    if (cardNumberInputProps.onChange) {
      cardNumberInputProps.onChange(e);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    e.target.value = formatted;
    if (cardExpiryInputProps.onChange) {
      cardExpiryInputProps.onChange(e);
    }
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 4 characters
    const v = e.target.value.replace(/\D/g, '').substring(0, 4);
    e.target.value = v;
    if (cardCVCInputProps.onChange) {
      cardCVCInputProps.onChange(e);
    }
  };

  return (
    <div className="space-y-4" style={containerStyle}>
      <div>
        <Label htmlFor="cardNumber">
          {customTextLabels?.cardNumberPlaceholder || 'Card Number'}
        </Label>
        <Input
          id="cardNumber"
          {...cardNumberInputProps}
          value={cardNumberInputProps.value || ''}
          onChange={handleCardNumberChange}
          maxLength={19} // 16 digits + 3 spaces
          className={fieldClassName}
          style={inputStyle}
          placeholder="1234 5678 9012 3456"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiry">MM/YY</Label>
          <Input
            id="expiry"
            {...cardExpiryInputProps}
            value={cardExpiryInputProps.value || ''}
            onChange={handleExpiryChange}
            maxLength={5} // MM/YY format
            className={fieldClassName}
            style={inputStyle}
            placeholder="MM/YY"
          />
        </div>
        <div>
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            {...cardCVCInputProps}
            value={cardCVCInputProps.value || ''}
            onChange={handleCVCChange}
            maxLength={4}
            className={fieldClassName}
            style={inputStyle}
            placeholder="123"
          />
        </div>
      </div>
    </div>
  );
}

