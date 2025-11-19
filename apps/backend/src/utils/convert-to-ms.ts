import ms, { type StringValue } from 'ms';

export const convertToMs = (value: string) => {
    return ms(value as StringValue);
}