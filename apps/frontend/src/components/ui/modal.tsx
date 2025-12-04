"use client"

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    open: boolean;
    onClose: Function;
    children: React.ReactNode;
};

export default function Modal({ open, onClose, children }: ModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    useEffect(() => {
        if (open) {
            document.body.classList.add("overflow-hidden");
        }
        else {
            document.body.classList.remove("overflow-hidden");
        }
    }, [open]);

    return mounted ? createPortal(
        <>
            <dialog
                onClick={() => onClose()}
                className={`
                    fixed inset-0 w-full h-full flex justify-center items-center z-1000
                    ${open ? "visible bg-background/60 dark:bg-background/60" : "invisible"}
                `}
            >
                <div className={`
                    transition-all duration-150
                    ${open ? "scale-100 opacity-100" : " scale-125 opacity-0"}    
                `}>
                    {children}
                </div>
            </dialog>
        </>
        , document.body
    ) : null;
};