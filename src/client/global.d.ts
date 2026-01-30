// handles importing scss as modules
declare module '*.scss' {
    const content: string
    export default content
}

// ServiceNow global types
declare global {
    interface Window {
        g_ck: string
    }

    class GlideAjax {
        constructor(scriptInclude: string)
        addParam(name: string, value: string): void
        getXMLAnswer(callback: (response: string) => void): void
    }
}

export {}
