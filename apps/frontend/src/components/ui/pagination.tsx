import { useState } from "react";
import { Button } from "./button";

interface PaginationProps {
    currentPage: number;
    totalPage: number;
    loadPageFn: (page: number) => void,
};
export default function Pagination({ currentPage, totalPage, loadPageFn }: PaginationProps) {
    const [page, setPage] = useState(currentPage);

    const loadPage = (page: number) => {
        if (page === page || page > totalPage || page === 0)
            return;

        setPage(page);
        loadPageFn(page);
    };

    return (
        <div>
            <Button variant="primary"
                disabled={page === 1}
                onClick={() => { loadPage(page - 1) }}
            >
                Previous
            </Button>

            {[...Array(totalPage)].map((_, index) => (
                <Button variant="primary"
                    key={`page-${index + 1}`}
                    disabled={page === index + 1}
                    onClick={() => { loadPage(index + 1) }}
                >
                    {index + 1}
                </Button>
            ))}

            <Button variant="primary"
                disabled={page === totalPage}
                onClick={() => { loadPage(page + 1) }}
            >
                Next
            </Button>
        </div>
    )
}