"use client"
import ErrorPage from "@/src/components/status-pages/error-page";
import NotFoundPage from "@/src/components/status-pages/not-found-page";
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import Loading from "@/src/components/ui/loading";
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import { DragSelectProvider, useDragSelect } from "@/src/utils/drag-select-provider";
import { useTRPC } from "@/src/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    BusStatusEnum,
    BusUpdateOneDto,
    BusUpdateOneDtoType,
    generateSeatCode,
    NO_DRIVER,
    SeatTypeEnum
} from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type RouterOutputsType } from "backend";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useCallback, useRef } from "react";

type Driver = RouterOutputsType['users']['getAllDriversWithNoBus'][number];
type Seat = RouterOutputsType["buses"]["getSeatsByBus"][0];

export default function AdminEditBusPageWrapper() {
    return (
        <DragSelectProvider settings={{
            selectionThreshold: 0.6,
            multiSelectMode: false,
            multiSelectToggling: true,
            keyboardDragSpeed: 0,
            keyboardDrag: false,
            draggability: false,
        }}>
            <AdminEditBusPage />
        </DragSelectProvider>
    );
}

export function AdminEditBusPage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { id: busId } = useParams<{ id: string }>();

    const busQuery = useQuery({
        ...trpc.buses.getOneById.queryOptions({ id: busId }),
        staleTime: 5 * 60 * 1000,
    });
    const seatsQuery = useQuery({
        ...trpc.buses.getSeatsByBus.queryOptions({ id: busId }),
        staleTime: 5 * 60 * 1000,
    });

    const allDriverNoBusQuery = useQuery({
        ...trpc.users.getAllDriversWithNoBus.queryOptions(),
        staleTime: 5 * 60 * 1000,
    });

    const updateBusMutation = useMutation({
        ...trpc.buses.updateOne.mutationOptions(),
        onSuccess(data, variables, onMutateResult, context) {

        },
        onError(error, variables, onMutateResult, context) {

        },
    });

    const busForm = useForm<BusUpdateOneDtoType>({
        resolver: zodResolver(BusUpdateOneDto),
        defaultValues: { id: busId },
    });
    const busFormData = busForm.watch();
    useEffect(() => {
        if (!busQuery.data || !seatsQuery.data) return;
        busForm.reset({
            ...busFormData,
            bus: {
                ...busQuery.data,
                driverId: busQuery.data.driver ? busQuery.data.driver.id : NO_DRIVER,
            },
            seats: seatsQuery.data.map(seat => ({
                id: seat.id,
                isActive: seat.isActive,
            })),
        });
    }, [busQuery.data, seatsQuery.data]);
    const [selectedFloor, setSelectedFloor] = useState(0);

    const ds = useDragSelect();
    const selectableElements = useRef<HTMLElement[]>([]);
    // adding selectable elements
    const attachRef = useCallback((el: HTMLElement | null) => {
        if (!el || !ds) return;
        el.setAttribute("draggable", "false");
        el.ondragstart = (e) => e.preventDefault();
        selectableElements.current.push(el);
        ds.addSelectables(el);
    }, [ds]);

    const seatsRef = useRef(seatsQuery.data);
    useEffect(() => {
        seatsRef.current = seatsQuery.data;
    }, [seatsQuery.data]);

    // drag end callback
    useEffect(() => {
        if (!ds) return;
        const id = ds.subscribe("DS:end", (e) => {
            if (e.isDragging) return;
            const isAltKey = e.event?.altKey ?? false;
            const currentSeats = seatsRef.current;
            if (!currentSeats) return;

            const dragSelectedSeats = [] as Seat[];

            for (const element of e.items) {
                const seatId = element.dataset.id as string;
                const seat = currentSeats.find(s => s.id === seatId);
                if (seat && seat.seatType === SeatTypeEnum.PASSENGER) {
                    dragSelectedSeats.push(seat);
                }
            }
            if (dragSelectedSeats.length < 1) return;

            const currentFormSeats = busForm.getValues("seats");
            const newFormSeats = currentFormSeats.map(seat => {
                const draggedSeat = dragSelectedSeats.find(ds => ds.id === seat.id);
                if (draggedSeat) {
                    return { ...seat, isActive: !isAltKey };
                }
                return seat;
            });
            busForm.setValue("seats", newFormSeats);
        });

        return () => ds.unsubscribe("DS:end", undefined, id!);
    }, [ds, busForm]);

    //#region loading stuff
    if (busQuery.isPending || seatsQuery.isPending || allDriverNoBusQuery.isPending) {
        return <Loading />
    }
    if (!busQuery.isPending && !busQuery.data) {
        return <NotFoundPage
            header='Bus Not Found'
            message="The bus you're looking for doesn't exist or has been removed."
            returnBtnText="Go back"
            redirectUrl="/admin/buses?tab=0"
            routerGoBack
        />
    }
    if (!seatsQuery.data) {
        return <ErrorPage
            header="Could not fetch seats"
            message="Could not fetch seats for this bus. Please try again."
            redirectUrl="/admin/buses?tab=0"
            routerGoBack
        />
    }
    if (!busFormData.bus || !busFormData.seats) {
        return <Loading />
    }
    //#endregion

    const drivers = [] as Driver[];
    if (allDriverNoBusQuery.data) {
        drivers.push(...allDriverNoBusQuery.data);
    }
    if (busQuery.data.driver) {
        drivers.push(busQuery.data.driver);
    }

    const seatIdMap = new Map<string, Seat>();
    seatsQuery.data.forEach(seat => {
        seatIdMap.set(seat.id, seat);
    });
    const getSeatsAtFloor = (floor: number) => {
        const seats = busFormData.seats.map(seat => ({
            ...seatIdMap.get(seat.id)!,
            ...seat,
        }));
        return seats.filter((seat) => seat.floor === floor);
    };

    const seats = getSeatsAtFloor(selectedFloor);
    const seatMap = new Map<string, Seat>();
    seats.forEach((s) => {
        seatMap.set(generateSeatCode(s.row, s.col, s.floor), s);
    });

    const getSeatClassName = (type: SeatTypeEnum | undefined, isActive: boolean | undefined) => {
        const base = "w-12 h-12 rounded-lg transition-all flex items-center justify-center text-xs font-semibold border-2 select-none";

        switch (type) {
            case SeatTypeEnum.DRIVER:
                return `${base} bg-warning text-white border-warning shadow-lg cursor-not-allowed`;
            case SeatTypeEnum.PASSENGER:
                if (isActive) {
                    return `${base} bg-accent text-white border-accent scale-105 hover:scale-105 cursor-pointer shadow-lg`;
                } else {
                    return `${base} bg-primary text-white border-primary hover:scale-105 cursor-pointer shadow-lg hover:border-accent`;
                }
            default:
                return "w-12 h-12";
        }
    };
    const drawSeatLayout = () => {

        return (
            <>
                {/* select floor */}
                <div className="flex flex-col gap-4 mt-4 xl:flex-row">
                    <Card className="flex-1">
                        <CardBody className="flex gap-4 items-center">
                            <span className="text-text font-bold text-sm">Select Floor:</span>
                            {Array.from({ length: busQuery.data.floors }).map((_, floorIndex) => (
                                <Button key={`floor-btn-${floorIndex}`}
                                    variant={selectedFloor === floorIndex ? "accent" : "primary"}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedFloor(floorIndex);
                                    }}
                                >
                                    Floor {floorIndex + 1}
                                </Button>
                            ))}
                        </CardBody>
                    </Card>
                </div>

                <div className="flex flex-col-reverse xl:flex-row gap-4 mt-4 xl:grid-cols-3">
                    {/* seat here baby */}
                    <Card className="flex justify-center flex-1 py-4 xl:flex-2">
                        <div
                            className="grid gap-4"
                            style={{
                                gridTemplateColumns: `repeat(${busQuery.data.cols}, minmax(0, 1fr))`,
                            }}
                        >
                            {Array.from({ length: busQuery.data.rows }).map((_, rowIndex) => (
                                <React.Fragment key={`seat-row-${rowIndex}`}>
                                    {Array.from({ length: busQuery.data.cols }).map((_, colIndex) => {
                                        const seat = seatMap.get(generateSeatCode(rowIndex, colIndex, selectedFloor));
                                        return (
                                            <div
                                                key={`seat-col-${colIndex}`}
                                                className="flex justify-between items-center"
                                            >
                                                <button
                                                    ref={seat?.seatType === SeatTypeEnum.PASSENGER ? attachRef : undefined}
                                                    data-id={seat?.id}
                                                    className={getSeatClassName(seat?.seatType, seat?.isActive)}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (seat?.seatType === SeatTypeEnum.PASSENGER) {
                                                            const currentFormSeats = busForm.getValues("seats");
                                                            const newFormSeats = currentFormSeats.map(s =>
                                                                s.id === seat.id ? { ...s, isActive: !s.isActive } : s
                                                            );
                                                            busForm.setValue("seats", newFormSeats);
                                                        }
                                                    }}
                                                    title={seat && seat.code}
                                                    disabled={seat?.seatType === SeatTypeEnum.DRIVER}
                                                >
                                                    {seat && (seat.code)}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>

                    {/* legend */}
                    <div className="flex-1 flex xl:flex-col gap-4">
                        <Card className="flex items-center">
                            <CardBody className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-primary dark:bg-primary border border-secondary-text"></div>
                                    <span className="text-sm text-secondary-text">Inactive Passenger Seat</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-accent dark:bg-accent"></div>
                                    <span className="text-sm text-secondary-text">Active Passenger Seat</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-warning dark:bg-warning"></div>
                                    <span className="text-sm text-secondary-text">Driver Seat</span>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="flex-1">
                            <CardBody>
                                <div className="text-text font-bold text-sm mb-2">INSTRUCTIONS</div>
                                <div className="text-sm text-secondary-text"><span className="text-text dark:text-text">Left click</span> to enable/disable passenger seat</div>
                                <div className="text-sm text-secondary-text"><span className="text-text dark:text-text">Drag</span> to enable multiple passenger seats</div>
                                <div className="text-sm text-secondary-text"><span className="text-text dark:text-text">Hold Alt and Drag</span> to disable multiple passenger seats</div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </>
        );
    }

    const onSubmit = (data: BusUpdateOneDtoType) => {
        updateBusMutation.mutate(data);
    }

    return (
        <>
            <div className="flex flex-col">
                <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Edit Bus</h1>
                <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/buses?tab=0')}>Return</Button>

                <form onSubmit={busForm.handleSubmit(onSubmit)}>
                    <Card>
                        <CardBody>
                            {busForm.formState.errors.root && (
                                <div className="col-span-2">
                                    <p className="text-danger dark:text-danger font-bold">{busForm.formState.errors.root.message}</p>
                                </div>
                            )}
                        </CardBody>

                        <CardBody className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-6">
                            <FormField label="Plate Number" required
                                {...busForm.register("bus.plateNumber")}
                                placeholder="12345"
                            />
                            <Controller
                                control={busForm.control}
                                name="bus.status"
                                render={({ field }) => (
                                    <SelectDropdown
                                        label="Bus Status"
                                        required
                                        options={Object.entries(BusStatusEnum).map(([key, val]) => ({
                                            label: val,
                                            value: key,
                                        }))}
                                        value={
                                            field.value
                                                ? { label: field.value, value: field.value }
                                                : null
                                        }
                                        onChange={(newValue) => {
                                            const opt = newValue as OptionType<string> | null;
                                            field.onChange(opt?.value ?? BusStatusEnum.ACTIVE);
                                        }}
                                    />
                                )}
                            />
                            <Controller control={busForm.control}
                                name="bus.driverId"
                                render={({ field: { onChange } }) => (
                                    <div className="col-span-2">
                                        <SelectDropdown label="Driver" isClearable
                                            {...busForm.register('bus.driverId')}
                                            value={(() => {
                                                const driverId = busFormData.bus.driverId;
                                                if (driverId) {
                                                    const driver = drivers.find(d => d.id === driverId);
                                                    if (!driver) {
                                                        return { value: NO_DRIVER, label: 'No driver' };
                                                    }
                                                    return {
                                                        label: `${driver.name} - ${driver.email} - ${driver.phone}`,
                                                        value: driverId,
                                                    };
                                                }
                                                return { value: NO_DRIVER, label: 'No driver' };
                                            })()}
                                            options={[
                                                { value: undefined, label: 'No driver' },
                                                ...drivers.map(driver => ({
                                                    value: driver.id,
                                                    label: `${driver.name} - ${driver.email} - ${driver.phone}`,
                                                })),
                                            ]}
                                            onChange={(newValue, _) => {
                                                const newVal: OptionType<string> = newValue as OptionType<string>;
                                                onChange(newVal ? newVal.value : undefined);
                                            }}
                                            errorMessage={busForm.formState.errors.bus?.driverId?.message}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    </div>
                                )}
                            />
                        </CardBody>
                    </Card>

                    {drawSeatLayout()}

                    <Card className="mt-4">
                        <CardFooter>
                            <Button
                                className="transition-all"
                                type="submit"
                                variant="accent"
                                size="md"
                                fullWidth
                                disabled={!busForm.formState.isValid || updateBusMutation.isPending || updateBusMutation.isSuccess}
                            >
                                {updateBusMutation.isPending ? "Updating..." : "Update"}
                            </Button>

                            {updateBusMutation.isSuccess && (
                                <>
                                    <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Update Bus Successfully!</div>
                                    <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Returning to Buses Page</div>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </>
    );
}