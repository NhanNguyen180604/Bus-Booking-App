import React from "react";

interface Column<T> {
    header: string;
    render: (item: T) => React.ReactNode;
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    rowKey: (item: T) => string;
    tableClassName?: string;
    headClassName?: string;
    bodyClassName?: string;
}

export function Table<T>({
    data,
    columns,
    rowKey,
    tableClassName = "",
    headClassName = "",
    bodyClassName = "",
}: TableProps<T>) {
    return (
        <table className={tableClassName}>
            <thead className={headClassName}>
                <tr>
                    {columns.map((col, i) => (
                        <th key={i} className="py-2">
                            {col.header}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className={bodyClassName}>
                {data.map(item => (
                    <tr key={rowKey(item)} className="border-b border-border">
                        {columns.map((col, i) => (
                            <td key={i} className={`${col.className ?? "py-2 text-center text-text dark:text-text"}`}>
                                {col.render(item)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
