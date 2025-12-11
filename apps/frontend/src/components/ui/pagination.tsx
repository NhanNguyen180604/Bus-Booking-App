import { useState } from "react";
import { Button } from "./button";

interface PaginationProps {
    currentPage: number;
    totalPage: number;
    loadPageFn: (page: number) => void;
}

export default function Pagination({ currentPage, totalPage, loadPageFn }: PaginationProps) {
    const [page, setPage] = useState(currentPage);
    const [pageInput, setPageInput] = useState("");

    const loadPage = (p: number) => {
        if (p === page || p < 1 || p > totalPage) return;
        setPage(p);
        loadPageFn(p);
    };

    if (totalPage < 1)
        return null;

    const renderPages = () => {
        const pages: number[] = [];

        if (totalPage <= 10) {
            // show all pages when total <= 10
            for (let i = 1; i <= totalPage; i++) {
                pages.push(i);
            }
        }
        else {
            pages.push(1);

            let start = Math.max(2, page - 2);
            let end = Math.min(totalPage - 1, page + 2);

            if (start > 2) pages.push(-1); // left ellipsis

            for (let i = start; i <= end; i++) pages.push(i);

            if (end < totalPage - 1) pages.push(-2); // right ellipsis

            pages.push(totalPage);
        }

        return pages.map((p, index) =>
            p < 0 ? (
                <span key={`ellipsis-${index}`} className="px-2 text-text dark:text-text leading-10">…</span>
            ) : (
                <Button
                    className={`${page === p ? "disabled:opacity-100 disabled:pointer-events-none" : ""}`}
                    key={`page-${p}`}
                    variant={page === p ? "accent" : "primary"}
                    disabled={page === p}
                    onClick={() => loadPage(p)}
                >
                    {p}
                </Button>
            )
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <Button
                    variant="primary"
                    disabled={page === 1 || totalPage === 0}
                    onClick={() => loadPage(page - 1)}
                >
                    Previous
                </Button>

                {renderPages()}

                <Button
                    variant="primary"
                    disabled={page === totalPage || totalPage === 0}
                    onClick={() => loadPage(page + 1)}
                >
                    Next
                </Button>
            </div>
            <div className="self-center text-text dark:text-text flex items-center gap-2">
                <span>Page</span>
                <input className="w-10 text-center border-0 border-b-2 border-border dark:border-border focus:outline-none focus:border-accent transition-colors"
                    value={pageInput}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                            setPageInput(String(Number(value)));
                        }
                    }}
                />
                <Button variant="accent"
                    disabled={function () {
                        const parsedPage = parseInt(pageInput);
                        return !(parsedPage !== page && parsedPage >= 1 && parsedPage <= totalPage);
                    }()}
                    onClick={() => loadPage(parseInt(pageInput))}
                >
                    Go
                </Button>
            </div>
        </div>
    );
}
