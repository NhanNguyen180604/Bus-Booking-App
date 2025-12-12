"use client"
import { useRouter } from "next/navigation";

interface ForbiddenProps {
    header?: string;
    message?: string;
    returnBtnText?: string;
    redirectUrl?: string;
    routerGoBack?: boolean;
}

export default function ForbiddenPage({ header = '', message = '', returnBtnText = '', redirectUrl = '', routerGoBack }: ForbiddenProps) {
    const router = useRouter();

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-text mb-4">
                    {header.length ? header : '403 - Forbidden'}
                </h1>
                <p className="text-secondary-text mb-6">
                    {message.length ? message : 'You are not allowed to access this content'}
                </p>
                <button
                    className="text-accent hover:underline cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        if (routerGoBack) {
                            if (window.history.state && window.history.state.idx > 0) {
                                router.back();
                            } else {
                                router.push(redirectUrl.trim().length ? redirectUrl.trim() : '/');
                            }
                        }
                    }}
                >
                    {returnBtnText.length ? returnBtnText : 'Go back'}
                </button>
            </div>
        </div>
    );
}