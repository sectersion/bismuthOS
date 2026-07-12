"use client";

import { useEffect, useState } from "react";

export default function SelectedStyle() {
    const [selOS, setSelOS] = useState("tahoe");
    useEffect(() => {
        // Ensure localStorage is set to our values
        window.localStorage.setItem('os', 'tahoe');
        window.localStorage.removeItem('custom-theme');
        const handleStorage = (e) => {
            if (e.key === 'os' && e.newValue !== 'tahoe') {
                window.localStorage.setItem('os', 'tahoe');
                setSelOS('tahoe');
            }
            if (e.key === 'custom-theme' && e.newValue !== null) {
                window.localStorage.removeItem('custom-theme');
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    return (
        <>
        {selOS !== "windows" && <link id="oscss" rel="stylesheet" href={`/${selOS}.css`} />}
        </>
    )
}