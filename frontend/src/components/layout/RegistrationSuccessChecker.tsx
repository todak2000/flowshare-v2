// components/RegistrationSuccessChecker.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SuccessAlert } from '@/components/ui/alert';

export function RegistrationSuccessChecker() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShow(true);
    }
  }, [searchParams]);

  if (!show) return null;

  return (
    <SuccessAlert
      title="Registration Successful!"
      message="Your account has been created. Please log in to continue."
    />
  );
}