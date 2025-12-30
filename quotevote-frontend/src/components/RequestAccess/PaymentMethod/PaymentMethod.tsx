'use client';

/**
 * PaymentMethod Component
 * 
 * Payment form component for credit card input and cost selection.
 * Migrated from Material UI to shadcn/ui components.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { paymentMethodSchema } from '@/lib/validation/requestAccessSchema';
import type { PaymentMethodProps } from '@/types/components';
import { CreditCardInput } from '../CreditCardInput';

export function PaymentMethod({
  isContinued,
  cardDetails,
  onSubmit,
  setCardDetails,
  isPersonal = true,
  errorMessage,
  loading,
}: PaymentMethodProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardNumber: cardDetails.cardNumber,
      expiry: cardDetails.expiry,
      cvv: cardDetails.cvv,
      cost: cardDetails.cost,
    },
  });

  const handleRequestAccess = () => {
    if (!Object.keys(errors).length) {
      onSubmit();
    }
  };

  if (!isContinued) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(handleRequestAccess)}>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="w-[22px] h-7 rounded-md bg-[#52b274] bg-opacity-85 font-roboto text-lg leading-[1.56] text-white px-1.5 py-0.5 flex items-center justify-center">
            2
          </div>
          <h3 className="font-roboto text-lg leading-[1.56]">
            Would you like to support this app?
          </h3>
        </CardHeader>

        <input
          type="hidden"
          {...register('cardNumber', { required: !isPersonal })}
        />
        <input
          type="hidden"
          {...register('expiry', { required: !isPersonal })}
        />
        <input
          type="hidden"
          {...register('cvv', { required: !isPersonal })}
        />

        <CardContent className="space-y-4">
          <p className="font-roboto text-base leading-[1.56] text-[#424556]">
            Payment will not be charged until invite is sent
          </p>

          <CreditCardInput
            cardNumberInputProps={{
              autoFocus: !isPersonal,
              value: cardDetails.cardNumber,
              onChange: (e) => {
                setValue('cardNumber', e.target.value);
                setCardDetails({
                  ...cardDetails,
                  cardNumber: e.target.value,
                });
              },
              onError: () => setValue('cardNumber', ''),
            }}
            cardExpiryInputProps={{
              value: cardDetails.expiry,
              onChange: (e) => {
                setValue('expiry', e.target.value);
                setCardDetails({
                  ...cardDetails,
                  expiry: e.target.value,
                });
              },
              onError: () => setValue('expiry', ''),
            }}
            cardCVCInputProps={{
              value: cardDetails.cvv,
              onChange: (e) => {
                setValue('cvv', e.target.value);
                setCardDetails({
                  ...cardDetails,
                  cvv: e.target.value,
                });
              },
              onError: () => setValue('cvv', ''),
            }}
            customTextLabels={{
              cardNumberPlaceholder: 'Credit Card Number',
            }}
          />

          <div className="grid grid-cols-2 gap-4 items-center">
            {isPersonal && (
              <div>
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  value={cardDetails.cost}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, cost: e.target.value })
                  }
                />
              </div>
            )}
            <div className={isPersonal ? 'col-span-1' : 'col-span-2'}>
              <p className="font-roboto text-lg leading-[1.56] text-center font-bold">
                Total: ${cardDetails.cost}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <img
              alt="stripe"
              src="/assets/stripe.png"
              className="w-[90px] h-[19px] opacity-40"
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#52b274] text-white hover:bg-[#52b274] relative"
            >
              {loading && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
              <span className={loading ? 'opacity-0' : ''}>Request Invite</span>
            </Button>
          </div>

          {errorMessage && (
            <div className="mt-2.5">
              <span className="font-roboto text-red-600">
                Error: {errorMessage}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}

