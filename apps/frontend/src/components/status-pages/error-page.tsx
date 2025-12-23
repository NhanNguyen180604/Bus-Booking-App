"use client"
import { useRouter } from "next/navigation";

interface ErrorPageProps {
    header?: string;
    message?: string;
    returnBtnText?: string;
    redirectUrl?: string;
    routerGoBack?: boolean;
}

export default function ErrorPage({
    header = 'Error',
    message = 'Something went wrong',
    returnBtnText = 'Return',
    redirectUrl = '/',
    routerGoBack
}: ErrorPageProps) {
    const router = useRouter();

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-text mb-4">
                    {header}
                </h1>
                <p className="text-secondary-text mb-6">
                    {message}
                </p>
                <button
                    className="text-accent hover:underline cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        if (routerGoBack) {
                            if (window.history.state && window.history.state.idx > 0) router.back();
                            else router.push(redirectUrl);
                        }
                    }}
                >
                    {returnBtnText}
                </button>
            </div>
        </div>
    );
}