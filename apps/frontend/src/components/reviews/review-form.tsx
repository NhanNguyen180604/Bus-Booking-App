"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateReviewDto, type CreateReviewDtoType } from "@repo/shared";
import { Button } from "../ui/button";
import { Card, CardBody, CardHeader } from "../ui/card";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";

interface ReviewFormProps {
    bookingId: string;
    tripId: string;
    onSuccess?: () => void;
    onDeleteClick?: () => void;
}

export function ReviewForm({ bookingId, tripId, onSuccess, onDeleteClick }: ReviewFormProps) {
    const trpc = useTRPC();
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    const checkReviewQuery = useQuery({
        ...trpc.reviews.checkUserReview.queryOptions({ bookingId }),
    });

    const existingReview = checkReviewQuery.data?.review;

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<Pick<CreateReviewDtoType, 'rating' | 'comment'>>({
        resolver: zodResolver(CreateReviewDto.pick({ rating: true, comment: true })),
        defaultValues: {
            rating: 0,
            comment: "",
        },
    });

    const rating = watch("rating");
    const comment = watch("comment");

    useEffect(() => {
        if (existingReview && !isEditing) {
            setValue("rating", existingReview.rating);
            setValue("comment", existingReview.comment);
        } else if (!existingReview) {
            // Reset form when review is deleted
            reset({
                rating: 0,
                comment: "",
            });
        }
    }, [existingReview, isEditing, setValue, reset]);

    const createReviewMutation = useMutation({
        ...trpc.reviews.create.mutationOptions(),
        onSuccess: () => {
            reset();
            checkReviewQuery.refetch();
            onSuccess?.();
        },
    });

    const updateReviewMutation = useMutation({
        ...trpc.reviews.update.mutationOptions(),
        onSuccess: () => {
            setIsEditing(false);
            checkReviewQuery.refetch();
            onSuccess?.();
        },
    });

    if (checkReviewQuery.isLoading) {
        return (
            <Card>
                <CardBody>
                    <div className="animate-pulse">
                        <div className="h-6 bg-text/10 rounded w-1/3 mb-4"></div>
                        <div className="h-20 bg-text/10 rounded"></div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    if (!checkReviewQuery.data?.canReview && !checkReviewQuery.data?.hasReviewed) {
        return null;
    }

    const onSubmit = (data: Pick<CreateReviewDtoType, 'rating' | 'comment'>) => {
        if (existingReview && isEditing) {
            updateReviewMutation.mutate({
                reviewId: existingReview.id,
                rating: data.rating,
                comment: data.comment,
            });
        } else if (!existingReview) {
            createReviewMutation.mutate({
                bookingId,
                tripId,
                rating: data.rating,
                comment: data.comment,
            });
        }
    };

    const handleCancel = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        setIsEditing(false);
        if (existingReview) {
            setValue("rating", existingReview.rating);
            setValue("comment", existingReview.comment);
        }
    };

    const handleEdit = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        setIsEditing(true);
    };

    const isFormDisabled = !!existingReview && !isEditing;

    return (
        <Card>
            <CardHeader>
                <h3 className="text-xl font-semibold text-text">
                    {existingReview ? "Your Review" : "Leave a Review"}
                </h3>
            </CardHeader>
            <CardBody>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Star Rating */}
                    <div>
                        <label className="text-sm text-secondary-text uppercase font-semibold block mb-2">
                            Rating
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setValue("rating", star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110"
                                    disabled={isFormDisabled}
                                >
                                    <svg
                                        className={`w-8 h-8 ${star <= (hoveredRating || rating)
                                            ? "text-yellow-400 fill-current"
                                            : "text-text/20"
                                            }`}
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
                                </button>
                            ))}
                        </div>
                        {errors.rating && (
                            <p className="text-xs text-danger mt-1">{errors.rating.message}</p>
                        )}
                        {!existingReview && rating === 0 && (
                            <p className="text-xs text-danger mt-1">Please select a rating</p>
                        )}
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="text-sm text-secondary-text uppercase font-semibold block mb-2">
                            Comment
                        </label>
                        <textarea
                            {...register("comment")}
                            placeholder="Share your experience with this trip..."
                            className="w-full px-4 py-3 bg-primary border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent min-h-[120px] resize-none"
                            maxLength={1000}
                            disabled={isFormDisabled}
                        />
                        {errors.comment && (
                            <p className="text-xs text-danger mt-1">{errors.comment.message}</p>
                        )}
                        <p className="text-xs text-secondary-text mt-1">
                            {comment.length}/1000 characters
                        </p>
                    </div>

                    {/* Error Messages */}
                    {(createReviewMutation.isError || updateReviewMutation.isError) && (
                        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                            <p className="text-sm text-danger">
                                {createReviewMutation.error?.message ||
                                    updateReviewMutation.error?.message ||
                                    "An error occurred"}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        {existingReview && (
                            <>
                                {isEditing ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleCancel}
                                            disabled={updateReviewMutation.isPending}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="accent"
                                            disabled={updateReviewMutation.isPending}
                                        >
                                            {updateReviewMutation.isPending ? "Updating..." : "Update Review"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDeleteClick?.();
                                            }}
                                        >
                                            Delete Review
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="accent"
                                            onClick={handleEdit}
                                        >
                                            Edit Review
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                        {!existingReview && (
                    <Button
                        type="submit"
                        variant="accent"
                        disabled={createReviewMutation.isPending || rating === 0 || comment.trim() === ""}
                    >
                        {createReviewMutation.isPending ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                            </>
                        ) : (
                            "Submit Review"
                        )}
                    </Button>
                )}
                    </div>
                </form>
            </CardBody>
        </Card>
    );
}
