export function formatVNWithAMPM(d: Date) {
    return `${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}, ${d.toLocaleDateString("vi-VN")}`;
}