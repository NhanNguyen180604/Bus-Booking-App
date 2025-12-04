import React from "react";
import { useState } from "react";

interface TabProps {
    children: React.ReactNode;
}

export function Tab({ children }: TabProps) {
    const [activeTab, setActiveTab] = useState(0);

    const panels = React.Children.toArray(children) as React.ReactElement<TabPanelProps>[];

    return (
        <div>
            {/* Tab headers */}
            <div className="flex bg-secondary dark:bg-secondary rounded-lg shadow-sm shadow-drop-shadow-near">
                {panels.map((panel, index) => (
                    <div
                        key={`tab-header-${index}`}
                        onClick={() => setActiveTab(index)}
                        className={`
                            flex-1 text-center transition-all cursor-pointer px-2 py-4 rounded-lg
                            ${activeTab === index ?
                                "opacity-100 text-text dark:text-text font-bold bg-primary shadow-sm shadow-drop-shadow-near" :
                                "opacity-50 text-secondary-text dark:text-secondary-text"}
                        `}
                    >
                        {panel.props.title}
                    </div>
                ))}
            </div>

            {/* Tab content */}
            <div>
                {panels.map((panel, index) => (
                    <div
                        key={`tab-content-${index}`}
                        className={activeTab === index ? "mt-8" : "hidden"}
                    >
                        {panel}
                    </div>
                ))}
            </div>
        </div>
    );
}


interface TabPanelProps {
    title: string;
    children: React.ReactNode;
}

export function TabPanel({ children }: TabPanelProps) {
    return (
        <div>{children}</div>
    )
}