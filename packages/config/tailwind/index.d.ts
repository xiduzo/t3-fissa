declare module "@fissa/tailwind-config" {
    interface Theme {
        gradient: string[]
        100: string,
        500: string,
        900: string
    }

    /**
     * @deprecated This should only be used when we can not apply tailwind classes
     */
    const theme: Theme

    export {theme}
}