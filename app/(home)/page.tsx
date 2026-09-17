'use client';

// Imports
// ------------
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const LazyExperience = dynamic(() => import('@parts/Experience'), {
    ssr: false,
});

// Component
// ------------
const Page = () => {
    return (
        <>
            <Suspense fallback={null}>
                <LazyExperience />
            </Suspense>
        </>
    );
};

// Exports
// ------------
export default Page;
