import Select, { type Props as ReactSelectProps, ClassNamesConfig } from "react-select";

interface SelectDropdownProps extends ReactSelectProps {
    label?: string;
}

export interface OptionType<T> {
    value: T;
    label: string;
};

const classNamesStyles: ClassNamesConfig = {
    control: ({ isFocused }) => `
        border-box border-2 ${isFocused ? "border-accent dark:border-accent" : "border-border dark:border-border"} bg-primary
        rounded-md px-2
    `,
    placeholder: ({ }) => `text-secondary-text dark:text-secondary-text`,
    singleValue: ({ }) => `text-text dark:text-text`,
    dropdownIndicator(props) {
        return `
            text-accent dark:text-accent
        `;
    },
    input: () => `text-text dark:text-text`,
    clearIndicator: (props) => `text-text dark:text-text`,
    menu: () => `
        bg-primary border border-border dark:border-border 
        rounded-md shadow-lg mt-1
    `,
    menuList: () => `
        bg-primary rounded-md
        max-h-60 overflow-y-auto
    `,
    option: ({ isFocused, isSelected }) => `
        px-2 py-2
        ${isSelected ? "bg-accent text-light-text-button dark:light-text-button" : "text-text dark:text-text"}
        ${!isSelected && isFocused ? "bg-accent/30 dark:bg-accent/30" : ""}  
    `,
    noOptionsMessage: () => `text-text dark:text-text py-2`,
};

export const SelectDropdown = ({ label, ...props }: SelectDropdownProps) => {
    return (
        <>
            {label ? (
                <div>
                    <label className="text-text dark:text-text font-bold" htmlFor={props.id}>
                        {label} {props.required && <span className="text-danger dark:text-danger">*</span>}
                    </label>
                    <Select {...props} className="mt-2" classNames={classNamesStyles} unstyled />
                </div>
            ) : (
                <Select {...props} classNames={classNamesStyles} unstyled />
            )}
        </>
    );
};