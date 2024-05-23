interface DataFilterOptions {
    classes?: {
        container?: string,
        fields?: string,
    },
    fields?: boolean | any[],
    excludeColumns?: boolean | any[],
    selectFields?: string[],
}

export {
    DataFilterOptions
}