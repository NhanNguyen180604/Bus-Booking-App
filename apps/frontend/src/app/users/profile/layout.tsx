import { AppShell } from '@/src/components/layout/app-shell';
import React from 'react';
export default function UserProfileLayout({ children }: { children: React.ReactNode }) {

    return (
        <AppShell hideNav>
            {children}
        </AppShell>
    );
}