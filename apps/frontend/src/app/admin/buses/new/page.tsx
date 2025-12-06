"use client"

import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { useTRPC } from "@/src/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { BusCreateOneWithSeatsDto, BusCreateOneWithSeatsDtoType, SeatTypeEnum } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { type RouterOutputsType } from 'backend';
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import { type BusSeatCreateOneDtoType as Seat } from '@repo/shared';
import { DragSelectProvider, useDragSelect } from "@/src/utils/drag-select-provider";
import { generateSeatCode } from '@repo/shared';

type Driver = RouterOutputsType['users']['search']['data'][number];
type BusType = RouterOutputsType['busTypes']['getOneById'];

export default function AdminCreateBusPageWrapper() {
    return (
        <DragSelectProvider settings={{
            selectionThreshold: 0.6,
            multiSelectMode: false,
            multiSelectToggling: true,
            keyboardDragSpeed: 0,
            keyboardDrag: false,
            draggability: false,
        }}>
            <AdminCreateBusPage />
        </DragSelectProvider>
    );
}

export function AdminCreateBusPage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();
    const perPage = 20;

    //#region fetching drivers for dropdown
    const driverTotalPageNumber = useRef(1);
    const [driverPage, setDriverPage] = useState(1);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    const searchDriverQueryOpts = trpc.users.search.queryOptions({
        page: driverPage,
        perPage,
        role: "DRIVER",
        driverWithNoBus: true,
    });
    const searchDriverQuery = useQuery({
        ...searchDriverQueryOpts,
        staleTime: 60 * 60 * 1000,
    });

    // appending drivers whenever successfully fetch
    useEffect(() => {
        if (searchDriverQuery.isSuccess) {
            driverTotalPageNumber.current = searchDriverQuery.data.totalPage;
            setDrivers([...drivers, ...searchDriverQuery.data.data]);
        }
    }, [searchDriverQuery.isSuccess]);
    //#endregion

    //#region fetching bus types for dropdown
    const busTypesTotalPageNumber = useRef(1);
    const [busTypePage, setBusTypePage] = useState(1);
    const [busTypes, setBusTypes] = useState<BusType[]>([]);

    const searchBusTypeQueryOpts = trpc.busTypes.search.queryOptions({
        page: busTypePage,
        perPage,
    });
    const searchBusTypeQuery = useQuery({
        ...searchBusTypeQueryOpts,
        staleTime: 60 * 60 * 1000,
    });
    // appending bus types whenever successfully fetch
    useEffect(() => {
        if (searchBusTypeQuery.isSuccess) {
            busTypesTotalPageNumber.current = searchBusTypeQuery.data.totalPage;
            setBusTypes([...busTypes, ...searchBusTypeQuery.data.data]);
        }
    }, [searchBusTypeQuery.isSuccess]);
    //#endregion

    //#region create bus hook form and mutation
    const busForm = useForm<BusCreateOneWithSeatsDtoType>({
        resolver: zodResolver(BusCreateOneWithSeatsDto),
        mode: "onBlur",
        defaultValues: {
            bus: {
                floors: 1,
                rows: 0,
                cols: 0,
            },
        }
    });

    const createBusMutationOpts = trpc.buses.createOneWithSeats.mutationOptions();
    const createBusMutation = useMutation({
        ...createBusMutationOpts,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: trpc.buses.searchBus.queryKey() });
            queryClient.setQueryData(trpc.buses.getOneById.queryKey(), data.bus);
            queryClient.setQueryData(trpc.buses.getSeatsByBus.queryKey(), data.seats);
            queryClient.invalidateQueries({ queryKey: trpc.users.search.queryKey({ driverWithNoBus: true, role: "DRIVER" }) });
            setTimeout(() => router.push("/admin/buses?tab=0"), 3000);
        },
        onError(error: any) {
            if (error.data?.zodError) {
                // Handle Zod validation errors from backend
                const zodErrors = error.data.zodError.fieldErrors;
                zodErrors.forEach((fieldError: any) => {
                    busForm.setError(fieldError.path[0] as any, {
                        message: fieldError.message,
                    });
                });
            } else {
                busForm.setError("root", {
                    message: error.message || "Create new route failed. Please try again.",
                });
            }
        },
    });
    //#endregion

    const [seatMatrix, setSeatMatrix] = useState<(Seat | null)[][][]>([]);
    const watchRows = useWatch({ control: busForm.control, name: "bus.rows" });
    const watchCols = useWatch({ control: busForm.control, name: "bus.cols" });
    const watchFloors = useWatch({ control: busForm.control, name: "bus.floors" });
    // re-initialize seat matrix on user input (onBlur)
    useEffect(() => {
        if (!watchRows || !watchCols || !watchFloors) {
            setSeatMatrix([]);
            setCurrentFloorIndex(0);
        }

        const prevFloors = seatMatrix.length;
        const prevRows = seatMatrix.at(0)?.length ?? 0;
        const prevCols = seatMatrix.at(0)?.at(0)?.length ?? 0;

        let newSeatMatrix: (Seat | null)[][][] = [...seatMatrix];
        if (prevFloors !== watchFloors) {
            if (watchFloors < prevFloors) {
                newSeatMatrix = seatMatrix.slice(0, watchFloors);
                setSeatMatrix(newSeatMatrix);
            }
            else {
                newSeatMatrix = [...seatMatrix];
                for (let floorIndex = prevFloors; floorIndex < watchFloors; floorIndex++) {
                    const newFloor: (Seat | null)[][] = [];
                    for (let rowIndex = 0; rowIndex < watchRows; rowIndex++) {
                        const newRow: (Seat | null)[] = [];
                        for (let colIndex = 0; colIndex < watchCols; colIndex++) {
                            newRow.push(null);
                        }
                        newFloor.push(newRow);
                    }
                    newSeatMatrix.push(newFloor);
                }
                setSeatMatrix(newSeatMatrix);
            }
            if (watchFloors - 1 < currentFloorIndex)
                setCurrentFloorIndex(watchFloors - 1);
        }
        else if (prevRows !== watchRows) {
            if (watchRows < prevRows) {
                newSeatMatrix = seatMatrix.map(floor =>
                    floor.slice(0, watchRows)
                );
                setSeatMatrix(newSeatMatrix);
            }
            else {
                for (const floor of newSeatMatrix) {
                    for (let rowIndex = prevRows; rowIndex < watchRows; rowIndex++) {
                        const newRow: (Seat | null)[] = [];
                        for (let colIndex = 0; colIndex < watchCols; colIndex++) {
                            newRow.push(null);
                        }
                        floor.push(newRow);
                    }
                }
                setSeatMatrix(newSeatMatrix);
            }
        }
        else if (prevCols !== watchCols) {
            if (watchCols < prevCols) {
                newSeatMatrix = seatMatrix.map(floor =>
                    floor.map(row =>
                        row.slice(0, watchCols)
                    )
                );
                setSeatMatrix(newSeatMatrix);
            }
            else {
                for (const floor of newSeatMatrix) {
                    for (const row of floor) {
                        for (let colIndex = prevCols; colIndex < watchCols; colIndex++) {
                            row.push(null);
                        }
                    }
                }
                setSeatMatrix(newSeatMatrix);
            }
        }
    }, [watchRows, watchCols, watchFloors]);

    // -100000 performance points, Capcom shall hire me to optimize Monster Hunter Wilds
    useEffect(() => {
        const newSeats = [] as Seat[];
        for (let floorIndex = 0; floorIndex < watchFloors; floorIndex++) {
            for (let rowIndex = 0; rowIndex < watchRows; rowIndex++) {
                for (let colIndex = 0; colIndex < watchCols; colIndex++) {
                    if (seatMatrix?.[floorIndex]?.[rowIndex]?.[colIndex]) {
                        const seat = seatMatrix?.[floorIndex]?.[rowIndex]?.[colIndex] ?? null;
                        if (seat) newSeats.push(seat);
                    }
                }
            }
        }
        busForm.setValue("seats", newSeats, { shouldValidate: true });
    }, [seatMatrix]);

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

    const seatMatrixRef = useRef(seatMatrix);
    useEffect(() => {
        seatMatrixRef.current = seatMatrix;
    }, [seatMatrix]);

    // drag end callback
    useEffect(() => {
        if (!ds) return;
        const id = ds.subscribe("DS:end", (e) => {
            if (e.isDragging) return;
            const isAltKey = e.event?.altKey ?? false;
            const currentSeatMatrix = seatMatrixRef.current;
            const dragSelectedSeats = [] as Seat[];

            for (const element of e.items) {
                const seatId = element.dataset.id as string;
                const regex = /^(\d+)-(\d+)-(\d+)$/;
                const match = seatId.match(regex);
                if (match) {
                    const floorIndex = parseInt(match[1], 10);
                    const rowIndex = parseInt(match[2], 10);
                    const colIndex = parseInt(match[3], 10);
                    dragSelectedSeats.push({
                        floor: floorIndex,
                        row: rowIndex,
                        col: colIndex,
                        seatType: SeatTypeEnum.PASSENGER,
                    });
                }
            }
            if (dragSelectedSeats.length < 1)
                return;

            const newSeatMatrix = currentSeatMatrix.map(floor =>
                floor.map(row => [...row])
            );
            for (const dragSelectedSeat of dragSelectedSeats) {
                if (isAltKey)  // remove seat
                    newSeatMatrix[dragSelectedSeat.floor][dragSelectedSeat.row][dragSelectedSeat.col] = null;
                else newSeatMatrix[dragSelectedSeat.floor][dragSelectedSeat.row][dragSelectedSeat.col] = dragSelectedSeat;
            }
            setSeatMatrix(newSeatMatrix);
        });

        return () => ds.unsubscribe("DS:end", undefined, id!);
    }, [ds]);

    const [currentFloorIndex, setCurrentFloorIndex] = useState(0);
    const onSeatClick = (rowIndex: number, colIndex: number, isLeftMouse: boolean) => {
        const newSeatMatrix = seatMatrix.map(floor =>
            floor.map(row => [...row])
        );

        // toggle seat
        const newSeat = {
            floor: currentFloorIndex,
            row: rowIndex,
            col: colIndex,
            seatType: isLeftMouse ? SeatTypeEnum.PASSENGER : SeatTypeEnum.DRIVER,
        };
        const oldSeat = newSeatMatrix[currentFloorIndex][rowIndex][colIndex];
        if (oldSeat) {
            if (oldSeat.seatType !== newSeat.seatType) {
                newSeatMatrix[currentFloorIndex][rowIndex][colIndex] = newSeat;
            }
            else {
                newSeatMatrix[currentFloorIndex][rowIndex][colIndex] = null;
            }
        }
        else {
            newSeatMatrix[currentFloorIndex][rowIndex][colIndex] = newSeat;
        }

        setSeatMatrix(newSeatMatrix);
    };
    const createSeatLayout = () => {
        const floors = seatMatrix.length;
        const rows = seatMatrix.at(0)?.length ?? 0;
        const cols = seatMatrix.at(0)?.at(0)?.length ?? 0;

        if (!rows || !cols || !floors) return null;
        if (rows < 1 || cols < 1 || floors < 1) return null;

        return (
            <>
                <div className="flex flex-col gap-4 mt-4 xl:flex-row">
                    {/* select floor */}
                    <Card className="flex-1">
                        <CardBody className="flex gap-4 items-center">
                            <span className="text-text font-bold text-sm">Select Floor:</span>
                            {Array.from({ length: floors }).map((_, floorIndex) => (
                                <Button key={`floor-btn-${floorIndex}`}
                                    variant={currentFloorIndex === floorIndex ? "accent" : "primary"}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentFloorIndex(floorIndex);
                                    }}
                                >
                                    Floor {floorIndex + 1}
                                </Button>
                            ))}
                        </CardBody>
                    </Card>
                </div>
                <div className="flex flex-col-reverse xl:flex-row gap-4 mt-4 xl:grid-cols-3">
                    {seatMatrix[currentFloorIndex] && (
                        <>
                            {/* seat layout */}
                            <Card className="flex justify-center space-y-2 flex-1 py-2 xl:flex-2">
                                <CardBody className="flex flex-col gap-y-2">
                                    {Array.from({ length: rows }).map((_, rowIndex) => (
                                        <div key={`seat-row-${rowIndex}`} className="flex space-x-2">
                                            {Array.from({ length: cols }).map((_, colIndex) => (
                                                <button
                                                    draggable={false}
                                                    key={`seat-${rowIndex}-${colIndex}`}
                                                    ref={attachRef}
                                                    // data-id for drag select
                                                    data-id={`${currentFloorIndex}-${rowIndex}-${colIndex}`}
                                                    className={`
                                            w-12 h-12 transition-all border-2 hover:border-accent
                                            ${seatMatrix[currentFloorIndex][rowIndex][colIndex] ?
                                                            `${seatMatrix[currentFloorIndex][rowIndex][colIndex]?.seatType === SeatTypeEnum.DRIVER ? "bg-warning dark:bg-warning border-warning!" : "bg-accent dark:bg-accent "}
                                                 text-light-text-button dark:text-light-text-button border-accent scale-105` :
                                                            `bg-primary dark:bg-primary hover:bg-primary/50 text-text dark:text-text border-primary hover:scale-105`
                                                        }
                                            flex items-center justify-center cursor-pointer rounded-lg select-none
                                        `}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        onSeatClick(rowIndex, colIndex, false);
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onSeatClick(rowIndex, colIndex, true);
                                                    }}
                                                >
                                                    {generateSeatCode(rowIndex, colIndex, currentFloorIndex)}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </CardBody>
                            </Card>
                        </>
                    )}

                    <div className="flex-1 flex xl:flex-col gap-4">
                        {/* legend */}
                        <Card className="flex items-center">
                            <CardBody className="flex gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-primary dark:bg-primary "></div>
                                    <span className="text-sm text-secondary-text">Non Seat</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-accent dark:bg-accent"></div>
                                    <span className="text-sm text-secondary-text">New Seat</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-warning dark:bg-warning"></div>
                                    <span className="text-sm text-secondary-text">Driver</span>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="flex-1">
                            <CardBody>
                                <div className="text-text font-bold text-sm mb-2">INSTRUCTIONS</div>
                                <div className="text-sm text-secondary-text"><span className="text-text dark:text-text">Left click</span> to toggle passenger seat</div>
                                <div className="text-sm text-secondary-text"><span className="text-text dark:text-text">Right click</span> to toggle driver seat</div>
                                <div className="text-sm text-secondary-text"><span className="text-text dark:text-text">Drag</span> to select passenger seats</div>
                                <div className="text-sm text-secondary-text"><span className="text-text dark:text-text">Hold Alt and Drag</span> to de-select seats</div>
                            </CardBody>
                        </Card>
                    </div>
                </div >
            </>
        );
    };


    const onSubmit = (data: BusCreateOneWithSeatsDtoType) => {
        createBusMutation.mutate(data);
    }

    return (
        <div className="flex flex-col">

            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Create New Bus</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/buses?tab=0')}>Return</Button>

            <form onSubmit={busForm.handleSubmit(onSubmit)}>
                {/* input things */}
                <Card>
                    <CardBody>
                        {busForm.formState.errors.root && (
                            <div className="col-span-2">
                                <p className="text-danger dark:text-danger font-bold">{busForm.formState.errors.root.message}</p>
                            </div>
                        )}
                    </CardBody>

                    <CardBody className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6">
                        <FormField label="Plate Number" required
                            {...busForm.register("bus.plateNumber")}
                            placeholder="12345"
                        />
                        <Controller control={busForm.control}
                            name="bus.busTypeId"
                            render={({ field: { onChange } }) => (
                                <SelectDropdown label="Bus Type" isClearable required
                                    options={busTypes.map(busType => ({ value: busType.id, label: busType.name }))}
                                    onChange={(newValue, _) => {
                                        const newVal: OptionType<string> = newValue as OptionType<string>;
                                        onChange(newVal ? newVal.value : "");
                                    }}
                                    errorMessage={busForm.formState.errors.bus?.busTypeId?.message}
                                    onMenuScrollToBottom={(_) => {
                                        if (busTypePage < busTypesTotalPageNumber.current) {
                                            setBusTypePage(busTypePage + 1);
                                        }
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            )}
                        />
                        <Controller control={busForm.control}
                            name="bus.driverId"
                            render={({ field: { onChange } }) => (
                                <SelectDropdown label="Driver" isClearable required
                                    options={drivers.map(driver => ({ value: driver.id, label: `${driver.name} - ${driver.email} - ${driver.phone}` }))}
                                    onChange={(newValue, _) => {
                                        const newVal: OptionType<string> = newValue as OptionType<string>;
                                        onChange(newVal ? newVal.value : "");
                                    }}
                                    errorMessage={busForm.formState.errors.bus?.driverId?.message}
                                    onMenuScrollToBottom={(_) => {
                                        if (driverPage < driverTotalPageNumber.current) {
                                            setDriverPage(driverPage + 1);
                                        }
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            )}
                        />

                        <FormField label="Rows" required
                            type="number"
                            min={1}
                            max={15}
                            {...busForm.register("bus.rows", { valueAsNumber: true })}
                            onChange={(e) => e.preventDefault()}
                            onBlur={(e) => {
                                const value = Number(e.target.value);
                                if (isNaN(value)) {
                                    return;
                                }
                                busForm.setValue("bus.rows", Math.max(1, Math.min(value, 15)), { shouldValidate: true });
                            }}
                            error={busForm.formState.errors.bus?.rows?.message}
                            placeholder="0"
                        />
                        <FormField label="Columns" required
                            type="number"
                            min={1}
                            max={15}
                            {...busForm.register("bus.cols", { valueAsNumber: true })}
                            onChange={(e) => e.preventDefault()}
                            onBlur={(e) => {
                                const value = Number(e.target.value);
                                if (isNaN(value)) {
                                    return;
                                }
                                busForm.setValue("bus.cols", Math.max(1, Math.min(value, 15)), { shouldValidate: true });
                            }}
                            error={busForm.formState.errors.bus?.cols?.message}
                            placeholder="0"
                        />
                        <FormField label="Floors" required
                            type="number"
                            min={1}
                            max={3}
                            {...busForm.register("bus.floors", { valueAsNumber: true })}
                            onChange={(e) => e.preventDefault()}
                            onBlur={(e) => {
                                const value = Number(e.target.value);
                                if (isNaN(value)) {
                                    return;
                                }
                                busForm.setValue("bus.floors", Math.max(1, Math.min(value, 3)), { shouldValidate: true });
                            }}
                            error={busForm.formState.errors.bus?.floors?.message}
                            placeholder="0"
                        />
                    </CardBody>
                </Card>

                {/* seat layout here */}
                {createSeatLayout()}
                <Card className="mt-4">
                    <CardFooter>
                        <Button
                            className="transition-all"
                            type="submit"
                            variant="accent"
                            size="md"
                            fullWidth
                            disabled={!busForm.formState.isValid || createBusMutation.isPending || createBusMutation.isSuccess}
                        >
                            {createBusMutation.isPending ? "Creating..." : "Create"}
                        </Button>

                        {createBusMutation.isSuccess && (
                            <>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Create Bus Successfully!</div>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Returning to Buses Page</div>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
};