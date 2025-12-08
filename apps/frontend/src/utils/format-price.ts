export function formatPrice(price: number) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency", currency: "VND", currencyDisplay: "code"
    }).format(Math.ceil(price));
};