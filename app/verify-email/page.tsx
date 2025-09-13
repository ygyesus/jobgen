import { Suspense } from 'react';
import VerifyEmailForm from '../components/VerifyEmailForm';

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailForm />
        </Suspense>
    );
}