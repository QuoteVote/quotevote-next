'use client';

/**
 * BusinessForm Component
 * 
 * Multi-step form for business plan request access.
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

import { businessFormSchema } from '@/lib/validation/requestAccessSchema';
import type { BusinessFormProps } from '@/types/components';
import { PaymentMethod } from '../PaymentMethod/PaymentMethod';

export function BusinessForm({
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
}: Partial<BusinessFormProps>) {
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
    resolver: zodResolver(businessFormSchema),
  });

  // Use external props if provided, otherwise use internal state
  const isContinued = externalIsContinued ?? internalIsContinued;
  const cardDetails = externalCardDetails ?? internalCardDetails;
  const setCardDetails = externalSetCardDetails ?? setInternalCardDetails;
  const onSubmit = externalOnSubmit ?? (async () => {});
  const errorMessage = externalErrorMessage;
  const loading = externalLoading ?? false;

  const onContinue = externalOnContinue ?? ((_data: { fullName: string; companyName: string; email: string }) => {
    setInternalIsContinued(true);
  });

  const finalHandleSubmit = externalHandleSubmit ?? handleSubmit;
  const finalRegister = externalRegister ?? register;
  const finalErrors = externalErrors ?? errors;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 mr-6">
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
              <span className="text-[#52b274]">Business Plan!</span>
            </>
          )}
        </h1>

        {!requestInviteSuccessful && (
          <p className="text-center text-lg md:text-xl mb-8">
            You are one step away from <b>unlimited access</b> to Quote Vote
          </p>
        )}

        <div className="mt-8 md:mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              <Image
                alt="Business Illustration"
                src="/assets/Illustration.png"
                width={400}
                height={265}
                className="w-[400px] h-[265px] object-contain"
                priority
              />
            </div>

            {requestInviteSuccessful ? (
              <div className="flex justify-center items-center">
                <p className="text-lg md:text-2xl leading-tight">
                  <b>You selected the Business Plan</b>, and we are excited to
                  talk with you.
                  <br />
                  <br />
                  When an account becomes available, an invite will be sent to
                  the email address you provided.
                </p>
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
                      onContinue(data as { fullName: string; companyName: string; email: string });
                    })}>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              {...finalRegister('fullName')}
                              aria-invalid={!!finalErrors.fullName}
                            />
                            {finalErrors.fullName && (
                              <p className="text-sm text-red-600 mt-1">
                                {finalErrors.fullName.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                              id="companyName"
                              {...finalRegister('companyName')}
                              aria-invalid={!!finalErrors.companyName}
                            />
                            {finalErrors.companyName && (
                              <p className="text-sm text-red-600 mt-1">
                                {finalErrors.companyName.message}
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
                  isPersonal={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

