declare module "@fissa/tailwind-config" {
    export interface Theme {
        gradient: string[]
        name: "pinkey" | "orangy" | "greeny" | "blueey" | "sunny" | "limey"
        100: string,
        500: string,
        900: string
    }


    const theme: Theme
    const themes: Theme[]

    export { theme, themes }
}
