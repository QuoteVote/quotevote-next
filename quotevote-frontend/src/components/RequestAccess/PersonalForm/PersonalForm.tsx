'use client';

/**
 * PersonalForm Component
 * 
 * Multi-step form for personal plan request access.
 * Migrated from Material UI to shadcn/ui components.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { personalFormSchema } from '@/lib/validation/requestAccessSchema';
import type { PersonalFormProps } from '@/types/components';
import { PaymentMethod } from '../PaymentMethod/PaymentMethod';

export function PersonalForm({
  requestInviteSuccessful,
  handleSubmit: externalHandleSubmit,
  isContinued: externalIsContinued,
  onContinue: externalOnContinue,
  errors: externalErrors,
  register: externalRegister,
  setCardDetails: externalSetCardDetails,
  cardDetails: externalCardDetails,
  onSubmit: externalOnSubmit,
  errorMessage: externalErrorMessage,
  loading: externalLoading,
}: Partial<PersonalFormProps>) {
  // Internal form state if not provided externally
  const [internalIsContinued, setInternalIsContinued] = useState(false);
  const [internalCardDetails, setInternalCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cost: '0',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(personalFormSchema),
  });

  // Use external props if provided, otherwise use internal state
  const isContinued = externalIsContinued ?? internalIsContinued;
  const cardDetails = externalCardDetails ?? internalCardDetails;
  const setCardDetails = externalSetCardDetails ?? setInternalCardDetails;
  const onSubmit = externalOnSubmit ?? (async () => {});
  const errorMessage = externalErrorMessage;
  const loading = externalLoading ?? false;

  const onContinue = externalOnContinue ?? ((_data: { firstName: string; lastName: string; email: string }) => {
    setInternalIsContinued(true);
  });

  const finalHandleSubmit = externalHandleSubmit ?? handleSubmit;
  const finalRegister = externalRegister ?? register;
  const finalErrors = externalErrors ?? errors;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="w-full max-w-6xl">
        <h1 className="text-center text-2xl md:text-4xl font-bold mb-4 md:mb-8">
          {requestInviteSuccessful ? (
            <>
              Thank you for{' '}
              <span className="text-[#52b274]">joining us</span>
            </>
          ) : (
            <>
              Get access to your{' '}
              <span className="text-[#52b274]">Personal Plan!</span>
            </>
          )}
        </h1>

        {!requestInviteSuccessful && (
          <p className="text-center text-lg md:text-xl mb-8">
            Pay what you like, or pay nothing at all
          </p>
        )}

        <div className="mt-8 md:mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              <Image
                alt="Personal Plan"
                src="/assets/PersonalPlan.png"
                width={489}
                height={350}
                className="w-full max-w-[489px] h-auto max-h-[35vh] object-contain mx-auto"
                priority
              />
            </div>

            {requestInviteSuccessful ? (
              <div className="flex justify-center items-center py-4">
                <div className="bg-black bg-opacity-50 p-8 md:p-12 rounded-xl text-white text-center max-w-[60%] md:max-w-[400px] mx-auto">
                  <p className="text-lg md:text-2xl leading-tight">
                    When an account becomes available, an invite will be sent
                    to the email address you provided.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-[22px] h-7 rounded-md bg-[#52b274] bg-opacity-85 font-roboto text-lg leading-[1.56] text-white px-1.5 py-0.5 flex items-center justify-center">
                      1
                    </div>
                    <h3 className="font-roboto text-lg leading-[1.56]">
                      Your Personal Info
                    </h3>
                  </CardHeader>

                  {!isContinued && (
                    <form onSubmit={finalHandleSubmit((data: unknown) => {
                      onContinue(data as { firstName: string; lastName: string; email: string });
                    })}>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              {...finalRegister('firstName')}
                              aria-invalid={!!finalErrors.firstName}
                            />
                            {finalErrors.firstName && (
                              <p className="text-sm text-red-600 mt-1">
                                {finalErrors.firstName.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              {...finalRegister('lastName')}
                              aria-invalid={!!finalErrors.lastName}
                            />
                            {finalErrors.lastName && (
                              <p className="text-sm text-red-600 mt-1">
                                {finalErrors.lastName.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            {...finalRegister('email')}
                            aria-invalid={!!finalErrors.email}
                          />
                          {finalErrors.email && (
                            <p className="text-sm text-red-600 mt-1">
                              {finalErrors.email.message}
                            </p>
                          )}
                        </div>
                        <Button
                          type="submit"
                          className="bg-[#52b274] text-white hover:bg-[#52b274] float-right"
                        >
                          Continue
                        </Button>
                      </CardContent>
                    </form>
                  )}
                </Card>

                <PaymentMethod
                  cardDetails={cardDetails}
                  onSubmit={onSubmit}
                  isContinued={isContinued}
                  setCardDetails={setCardDetails}
                  errorMessage={errorMessage}
                  loading={loading}
                  isPersonal={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

