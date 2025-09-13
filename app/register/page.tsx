// src/app/register/page.tsx

import { Suspense } from 'react';
import SignUpForm from '../components/SignUpForm';

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading registration form...</div>}>
            <SignUpForm />
        </Suspense>
    );
}