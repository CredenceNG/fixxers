import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import RegisterForm from './RegisterForm';

export default function RegisterPage() {
  return (
    <>
      <Toaster position="top-center" />
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </>
  );
}
