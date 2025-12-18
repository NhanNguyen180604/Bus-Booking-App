"use client";

import { Card, CardBody, CardHeader } from "@/src/components/ui/card";
import { Table } from "@/src/components/ui/table";
import { formatPrice } from "@/src/utils/format-price";
import { useTRPC } from "@/src/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminReportsPage() {
    const trpc = useTRPC();
    
    const overviewQueryOpts = trpc.reports.getOverview.queryOptions();
    const overviewQuery = useQuery({
        ...overviewQueryOpts,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
    
    if (overviewQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (overviewQuery.isError) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-danger">Failed to load reports data</p>
            </div>
        );
    }

    const data = overviewQuery.data;

    return (
        <div className="space-y-6">
            <h1 className="text-[2rem] text-text font-bold">Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Today Revenue */}
                <Card>
                    <CardBody className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-secondary-text mb-1">Total Revenue</p>
                                <p className="text-xs text-secondary-text mb-3">Today</p>
                                <p className="text-2xl font-bold text-text">{formatPrice(data!.todayRevenue)}</p>
                            </div>
                            <div className="p-3 bg-accent/10 rounded-lg">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-accent"
                                >
                                    <rect width="20" height="14" x="2" y="5" rx="2" />
                                    <line x1="2" x2="22" y1="10" y2="10" />
                                </svg>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Last 30 Days Revenue */}
                <Card>
                    <CardBody className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-secondary-text mb-1">Total Revenue</p>
                                <p className="text-xs text-secondary-text mb-3">Last 30 days</p>
                                <p className="text-2xl font-bold text-text">{formatPrice(data!.last30DaysRevenue)}</p>
                            </div>
                            <div className="p-3 bg-accent/10 rounded-lg">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-accent"
                                >
                                    <rect width="20" height="14" x="2" y="5" rx="2" />
                                    <line x1="2" x2="22" y1="10" y2="10" />
                                </svg>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Total Bookings */}
                <Card>
                    <CardBody className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-secondary-text mb-1">Total Bookings</p>
                                <p className="text-xs text-secondary-text mb-3">Last 30 days</p>
                                <p className="text-2xl font-bold text-text">{data!.last30DaysBookings.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-accent/10 rounded-lg">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-accent"
                                >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Chart and Top Routes Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="px-6 pt-6 pb-4">
                        <h2 className="text-xl font-bold text-text">Revenue Last 30 Days</h2>
                    </CardHeader>
                    <CardBody className="p-6">
                        {data!.dailyRevenue && data!.dailyRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={data!.dailyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#9ca3af"
                                        tick={{ fill: '#9ca3af' }}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return `${date.getMonth() + 1}/${date.getDate()}`;
                                        }}
                                    />
                                    <YAxis 
                                        stroke="#9ca3af"
                                        tick={{ fill: '#9ca3af' }}
                                        tickFormatter={(value) => {
                                            return (value / 1000000).toFixed(2) + 'M';
                                        }}
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                            color: '#f3f4f6'
                                        }}
                                        labelFormatter={(value) => {
                                            const date = new Date(value);
                                            return date.toLocaleDateString('vi-VN');
                                        }}
                                        formatter={(value: number | undefined) => [
                                            formatPrice(value ?? 0),
                                            'Revenue'
                                        ]}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[350px]">
                                <p className="text-secondary-text">No revenue data available</p>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Top 5 Routes */}
                <Card>
                    <CardHeader className="px-6 pt-6 pb-4">
                        <h2 className="text-xl font-bold text-text">Top 5 Routes</h2>
                    </CardHeader>
                    <CardBody className="p-0">
                        {data!.topRoutes.length > 0 ? (
                            <Table
                                data={data!.topRoutes}
                                rowKey={(route) => `route-${route.id}`}
                                tableClassName="w-full"
                                headClassName="bg-primary/50 text-secondary-text text-sm"
                                bodyClassName="text-sm"
                                columns={[
                                    {
                                        header: "Start",
                                        render: (route) => route.start,
                                        className: "py-3 px-4 text-left text-text",
                                        headerClassName: "py-3 px-4 text-left"
                                    },
                                    {
                                        header: "Destination",
                                        render: (route) => route.destination,
                                        className: "py-3 px-4 text-left text-text",
                                        headerClassName: "py-3 px-4 text-left"
                                    },
                                    {
                                        header: "Revenue",
                                        render: (route) => {
                                            const revenue = (route.revenue / 1000000).toFixed(2);
                                            return revenue + 'M VND';
                                        },
                                        className: "py-3 px-4 text-right text-text font-semibold",
                                        headerClassName: "py-3 px-4 text-right"
                                    },
                                ]}
                            />
                        ) : (
                            <div className="p-6 text-center text-secondary-text">
                                No route data available
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
