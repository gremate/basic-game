export class Utilities {
    public static randomColor() {
        return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    }

    public static randomInteger(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);

        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}
