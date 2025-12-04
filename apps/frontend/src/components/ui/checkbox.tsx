import { InputHTMLAttributes } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    title: string;
};

export default function Checkbox({ title, ...props }: CheckboxProps) {
    const id = props.id ?? props.name;
    return (
        <div className="flex gap-4 items-center">
            <div className="relative w-6 h-6">
                <input type="checkbox"
                    id={id}
                    {...props}
                    className="
                    peer
                    appearance-none w-6 h-6 box-border
                    border-2 border-accent dark:border-accent 
                    transition checked:bg-accent 
                    rounded-md
                "
                />
                <svg className="pointer-events-none absolute inset-0 w-6 h-6 opacity-0 peer-checked:opacity-100 transition-opacity text-background"
                    xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                    fill="currentColor">
                    <path d="M400-304 240-464l56-56 104 104 264-264 56 56-320 320Z" />
                </svg>
            </div>

            <label htmlFor={id} className="text-text dark:text-text text-sm">{title}</label>
        </div>
    );
}