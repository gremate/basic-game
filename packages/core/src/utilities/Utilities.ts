export class Utilities {
    public static randomColor() {
        return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    }
}
