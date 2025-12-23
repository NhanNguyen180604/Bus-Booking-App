"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "../ui/card";
import { OptionType, SelectDropdown } from "../ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Pagination from "../ui/pagination";

interface ReviewsListProps {
    routeId: string;
    className?: string;
}

export function ReviewsList({ routeId, className = "" }: ReviewsListProps) {
    const trpc = useTRPC();
    const [sortBy, setSortBy] = useState<"createdAt" | "rating">("createdAt");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
    const [rating, setRating] = useState<number | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);

    const reviewsQuery = useQuery({
        ...trpc.reviews.getByRoute.queryOptions({
            routeId,
            sortBy,
            sortOrder,
            rating,
            page: currentPage,
            perPage: 5,
        }),
    });

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFull = star <= Math.floor(rating);
                    const isHalf = star === Math.ceil(rating) && !isFull;
                    
                    return (
                        <div key={star} className="relative w-5 h-5">
                            {/* Background star (empty) */}
                            <svg
                                className="absolute inset-0 w-5 h-5 text-text/20"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                            </svg>
                            {/* Filled star or half star */}
                            {(isFull || isHalf) && (
                                <svg
                                    className="absolute inset-0 w-5 h-5 text-yellow-400 fill-current"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                    />
                                </svg>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (reviewsQuery.isLoading) {
        return (
            <Card className={className}>
                <CardHeader className="border-b border-border">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <div className="h-7 bg-text/10 rounded w-24 mb-2 animate-pulse"></div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <div key={star} className="w-5 h-5 bg-text/10 rounded animate-pulse"></div>
                                    ))}
                                </div>
                                <div className="h-6 bg-text/10 rounded w-12 animate-pulse"></div>
                                <div className="h-5 bg-text/10 rounded w-20 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="w-40 h-10 bg-text/10 rounded animate-pulse"></div>
                            <div className="w-32 h-10 bg-text/10 rounded animate-pulse"></div>
                            <div className="w-32 h-10 bg-text/10 rounded animate-pulse"></div>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="pb-6 border-b border-border last:border-b-0 last:pb-0">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="h-5 bg-text/10 rounded w-32 animate-pulse"></div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <div key={star} className="w-5 h-5 bg-text/10 rounded animate-pulse"></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-4 bg-text/10 rounded w-24 animate-pulse"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-text/10 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-text/10 rounded w-5/6 animate-pulse"></div>
                                <div className="h-4 bg-text/10 rounded w-4/6 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </CardBody>
            </Card>
        );
    }

    const reviews = reviewsQuery.data?.reviews || [];
    const averageRating = reviewsQuery.data?.averageRating || 0;
    const totalReviews = reviewsQuery.data?.totalReviews || 0;

    return (
        <Card className={className}>
            <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-text">Reviews</h3>
                        {totalReviews > 0 && (
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-2">
                                    {renderStars(averageRating)}
                                    <span className="text-lg font-semibold text-text">
                                        {averageRating.toFixed(1)}
                                    </span>
                                </div>
                                <span className="text-sm text-secondary-text">
                                    ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    {totalReviews > 0 && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="w-40">
                                <SelectDropdown
                                    label="Rating"
                                    isClearable
                                    value={
                                        rating
                                            ? { value: rating, label: `${rating} Star${rating > 1 ? 's' : ''}` }
                                            : null
                                    }
                                    options={[
                                        { value: 1, label: "1 Star" },
                                        { value: 2, label: "2 Stars" },
                                        { value: 3, label: "3 Stars" },
                                        { value: 4, label: "4 Stars" },
                                        { value: 5, label: "5 Stars" },
                                    ]}
                                    onChange={(newValue) => {
                                        const val = newValue as OptionType<number> | null;
                                        setRating(val?.value);
                                    }}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                    menuPosition="fixed"
                                />
                            </div>

                            <div className="w-32">
                                <SelectDropdown
                                    label="Sort By"
                                    value={{ value: sortBy, label: sortBy === "createdAt" ? "Date" : "Rating" }}
                                    options={[
                                        { value: "createdAt", label: "Date" },
                                        { value: "rating", label: "Rating" },
                                    ]}
                                    onChange={(newValue) => {
                                        const val = newValue as OptionType<"createdAt" | "rating">;
                                        setSortBy(val.value);
                                    }}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                    menuPosition="fixed"
                                />
                            </div>

                            <div className="w-32">
                                <SelectDropdown
                                    label="Order"
                                    value={{
                                        value: sortOrder,
                                        label: sortBy === "rating"
                                            ? (sortOrder === "DESC" ? "Highest" : "Lowest")
                                            : (sortOrder === "DESC" ? "Newest" : "Oldest")
                                    }}
                                    options={[
                                        {
                                            value: "DESC",
                                            label: sortBy === "rating" ? "Highest" : "Newest"
                                        },
                                        {
                                            value: "ASC",
                                            label: sortBy === "rating" ? "Lowest" : "Oldest"
                                        },
                                    ]}
                                    onChange={(newValue) => {
                                        const val = newValue as OptionType<"ASC" | "DESC">;
                                        setSortOrder(val.value);
                                    }}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                    menuPosition="fixed"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardBody>
                {reviews.length === 0 ? (
                    <div className="text-center py-12">
                        <svg
                            className="w-16 h-16 mx-auto text-text/20 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                        </svg>
                        <p className="text-text/60 text-lg">
                            {rating ? "No reviews match your filter" : "No reviews yet"}
                        </p>
                        <p className="text-secondary-text text-sm mt-2">
                            {rating ? "Try adjusting your filters" : "Be the first to review this trip!"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="pb-6 border-b border-border last:border-b-0 last:pb-0"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-semibold text-text">{review.user.name}</p>
                                            {renderStars(review.rating)}
                                        </div>
                                        <p className="text-sm text-secondary-text">
                                            {formatDate(review.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-text leading-relaxed whitespace-pre-wrap">
                                    {review.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
            {reviewsQuery.data &&(
                <div className="flex justify-center py-4 border-t border-border">
                    <Pagination
                        currentPage={reviewsQuery.data.page}
                        totalPage={reviewsQuery.data.totalPage}
                        loadPageFn={setCurrentPage}
                    />
                </div>
            )}
        </Card>
    );
}
