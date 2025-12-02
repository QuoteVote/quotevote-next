'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function EmailSent() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <Card className="w-full max-w-[350px]">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          <h2 className="font-montserrat text-xl font-semibold leading-6">
            Email Sent
          </h2>
          <p className="font-roboto text-center text-base font-normal leading-[19px] text-muted-foreground">
            We have sent you an email to reset your password.
          </p>
          <Button
            onClick={handleLogin}
            className="w-full"
            size="lg"
          >
            Go to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

