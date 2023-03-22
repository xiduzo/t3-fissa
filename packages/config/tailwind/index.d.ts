declare module "@fissa/tailwind-config" {
    interface Theme {
        gradient: string[]
        100: string,
        500: string,
        900: string
    }

    
    const theme: Theme

    export {theme}
}