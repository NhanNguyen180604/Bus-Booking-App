export function generateSeatCode(rowIndex: number, colIndex: number, floorIndex: number) {
    return `${(floorIndex + 10).toString(36).toUpperCase()}${rowIndex + 1}${colIndex + 1}`;
}