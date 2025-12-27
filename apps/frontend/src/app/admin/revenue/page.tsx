"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import Pagination from "@/src/components/ui/pagination";
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import { Table } from "@/src/components/ui/table";
import { formatPrice } from "@/src/utils/format-price";
import { formatVNWithAMPM } from "@/src/utils/format-time";
import { useTRPC } from "@/src/utils/trpc";
import { PaymentProviderEnum, PaymentSearchDtoType, PaymentStatusEnum } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import { RouterOutputsType } from "backend";
import { useState } from "react";

type Payment = RouterOutputsType['payments']['search']['data'][number];

export default function AdminRevenuePage() {
    const trpc = useTRPC();
    const perPage = 20;

    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);

    const [searchInput, setSearchInput] = useState<PaymentSearchDtoType>({
        page: 1,
        perPage,
    });

    const [searchObj, setSearchObj] = useState<PaymentSearchDtoType>(searchInput);

    const searchPaymentsOpts = trpc.payments.search.queryOptions(searchObj);
    const searchPaymentsQuery = useQuery({
        ...searchPaymentsOpts,
        staleTime: 60 * 60 * 1000,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchObj({ ...searchInput, page: 1 });
        setPage(1);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount).replace('₫', 'VND');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-[2rem] text-text font-bold">Revenue Management</h1>

            {/* Filter and Sort */}
            <form onSubmit={handleSearch}>
                <Card>
                    <CardHeader className="text-text text-[20px] font-bold">
                        FILTER AND SORT PAYMENTS
                    </CardHeader>

                    <CardBody className="flex flex-col gap-4 px-6 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Status Filter */}
                            <div>
                                <SelectDropdown
                                    label="Payment Status"
                                    id="status"
                                    name="status"
                                    isClearable
                                    value={searchInput.status ? { value: searchInput.status, label: searchInput.status } : null}
                                    options={Object.values(PaymentStatusEnum).map(status => ({
                                        value: status,
                                        label: status
                                    }))}
                                    onChange={(newValue) => {
                                        const val = newValue as OptionType<string>;
                                        setSearchInput({
                                            ...searchInput,
                                            status: val ? val.value as PaymentStatusEnum : undefined
                                        });
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            </div>

                            {/* Provider Filter */}
                            <div>
                                <SelectDropdown
                                    label="Payment Provider"
                                    id="provider"
                                    name="provider"
                                    isClearable
                                    value={searchInput.paymentProvider ? { value: searchInput.paymentProvider, label: searchInput.paymentProvider } : null}
                                    options={Object.values(PaymentProviderEnum).map(provider => ({
                                        value: provider,
                                        label: provider
                                    }))}
                                    onChange={(newValue) => {
                                        const val = newValue as OptionType<string>;
                                        setSearchInput({
                                            ...searchInput,
                                            paymentProvider: val ? val.value as PaymentProviderEnum : undefined
                                        });
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            </div>

                            {/* Creation Date */}
                            <div>
                                <FormField
                                    label="Creation Date"
                                    type="date"
                                    value={searchInput.createdAt || ''}
                                    onChange={(e) => setSearchInput({
                                        ...searchInput,
                                        createdAt: e.target.value || undefined
                                    })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Transaction ID Search */}
                            <div>
                                <FormField
                                    label="Transaction ID"
                                    placeholder="Search by transaction ID"
                                    value={searchInput.transactionId || ''}
                                    onChange={(e) => setSearchInput({
                                        ...searchInput,
                                        transactionId: e.target.value || undefined
                                    })}
                                />
                            </div>

                            {/* Sort By */}
                            <div>
                                <SelectDropdown
                                    label="Sort By"
                                    id="sortBy"
                                    name="sortBy"
                                    isClearable
                                    value={searchInput.sortBy ? {
                                        value: searchInput.sortBy,
                                        label: searchInput.sortBy === 'createdAt' ? 'Date' :
                                            searchInput.sortBy === 'amount' ? 'Amount' : 'Status'
                                    } : null}
                                    options={[
                                        { value: 'createdAt', label: 'Date' },
                                        { value: 'amount', label: 'Amount' },
                                        { value: 'status', label: 'Status' }
                                    ]}
                                    onChange={(newValue) => {
                                        const val = newValue as OptionType<string>;
                                        setSearchInput({
                                            ...searchInput,
                                            sortBy: val ? val.value as 'createdAt' | 'amount' | 'status' : undefined,
                                            sortOrder: val ? 'asc' : undefined
                                        });
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            </div>

                            {/* Sort Order */}
                            <div>
                                <SelectDropdown
                                    label="Sort Order"
                                    id="sortOrder"
                                    name="sortOrder"
                                    isClearable
                                    value={searchInput.sortOrder ? { value: searchInput.sortOrder, label: searchInput.sortOrder === 'asc' ? 'Ascending' : 'Descending' } : null}
                                    options={[
                                        { value: 'asc', label: 'Ascending' },
                                        { value: 'desc', label: 'Descending' }
                                    ]}
                                    onChange={(newValue) => {
                                        const val = newValue as OptionType<string>;
                                        setSearchInput({
                                            ...searchInput,
                                            sortOrder: val ? val.value as 'asc' | 'desc' : undefined
                                        });
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            </div>
                        </div>
                    </CardBody>

                    <CardFooter className="px-6 pb-6">
                        <Button
                            type="submit"
                            variant="accent"
                            className="flex items-center gap-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            Search Payments
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            {/* Results */}
            {searchPaymentsQuery.isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                </div>
            ) : searchPaymentsQuery.isError ? (
                <Card>
                    <CardBody className="py-12 text-center text-danger">
                        Failed to load payments
                    </CardBody>
                </Card>
            ) : searchPaymentsQuery.data && searchPaymentsQuery.data.data.length > 0 ? (
                <>
                    <Card className="flex overflow-hidden">
                        <Table
                            data={searchPaymentsQuery.data.data}
                            rowKey={(payment) => `payment-${payment.id}`}
                            tableClassName="w-full"
                            headClassName="bg-primary dark:bg-primary text-secondary-text dark:text-secondary-text text-sm"
                            bodyClassName="text-sm"
                            columns={[
                                {
                                    header: "Transaction ID",
                                    render: (payment) => payment.paymentTransactionId || 'N/A',
                                    className: "py-3 px-4 text-left text-text font-mono text-xs",
                                    headerClassName: "py-3 px-4 text-left"
                                },
                                {
                                    header: "Booking Code",
                                    render: (payment) => payment.booking?.lookupCode || 'N/A',
                                    className: "py-3 px-4 text-left text-text font-semibold",
                                    headerClassName: "py-3 px-4 text-left"
                                },
                                {
                                    header: "Customer",
                                    render: (payment) => payment.user?.name || 'Guest',
                                    className: "py-3 px-4 text-left text-text",
                                    headerClassName: "py-3 px-4 text-left"
                                },
                                {
                                    header: "Amount",
                                    render: (payment) => formatCurrency(Number(payment.amount)),
                                    className: "py-3 px-4 text-left text-text font-semibold",
                                    headerClassName: "py-3 px-4 text-left"
                                },
                                {
                                    header: "Provider",
                                    render: (payment) => payment.paymentProvider,
                                    className: "py-3 px-4 text-left text-text",
                                    headerClassName: "py-3 px-4 text-left"
                                },
                                {
                                    header: "Status",
                                    render: (payment) => (
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${payment.status === 'COMPLETED'
                                                ? 'bg-success/20 text-success'
                                                : 'bg-warning/20 text-warning'
                                            }`}>
                                            {payment.status}
                                        </span>
                                    ),
                                    className: "py-3 px-4 text-left",
                                    headerClassName: "py-3 px-4 text-left"
                                },
                                {
                                    header: "Date",
                                    render: (payment) => formatVNWithAMPM(new Date(payment.createdAt)),
                                    className: "py-3 px-4 text-left text-text text-sm",
                                    headerClassName: "py-3 px-4 text-left"
                                },
                            ]}
                        />
                    </Card>

                    <div className="flex justify-center">
                        <Pagination
                            currentPage={searchObj.page}
                            totalPage={searchPaymentsQuery.data.totalPage}
                            loadPageFn={(newPage) => {
                                setSearchObj({ ...searchObj, page: newPage });
                                setPage(newPage);
                            }}
                        />
                    </div>
                </>
            ) : (
                <Card>
                    <CardBody className="py-12 text-center text-secondary-text">
                        No payments found
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
