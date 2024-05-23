import {DataTable} from "../datatable"
import {classNamesToSelector, createElement} from "../helpers"

import {
    defaultConfig
} from "./config"

import {DataFilterOptions} from "./types"

class DataFilter {

    dt: DataTable;
    options: DataFilterOptions;
    initialized: any;
    activeColumns: string[];
    containerDOM: HTMLElement;

    events: { change: any; };


    constructor(dataTable: DataTable, options = {}) {
        this.dt = dataTable;
        this.options = {
            ...defaultConfig,
            ...options
        };
    }

    init() {

        if (this.initialized) {
            return
        }

        const activeColumns = this.getActiveColumns();
        this.activeColumns = activeColumns;

        this.containerDOM = createElement('div', {
            class: `datatable-col-filter ${this.options.classes.container}`,
            html:  this.renderFields()
        });

        this.dt.wrapperDOM.insertBefore(
            this.containerDOM,
            this.dt.wrapperDOM.querySelector('div.datatable-container')
        );

        this._bindEvents();

        this.initialized = true;
    }

    getActiveColumns() {
        //get all columns
        const allColumns = Object.keys(this.dt.columns.settings);

        //filter columns
        const activeColumns = allColumns.filter(column => {
            const columnSettings = this.dt.columns.settings[column];
            const isExcluded = Array.isArray(this.options.excludeColumns) ? this.options.excludeColumns.includes(parseInt(column, 10)) : false;
            return columnSettings.searchable && !columnSettings.hidden && !isExcluded;
        });

        return activeColumns;
    }

    renderFields() {
        if (this.options.fields) {
            return this.activeColumns.map((_activeColumnID, idx) => {

                if (this.options.fields.hasOwnProperty(Number(_activeColumnID))) {
                    let columnID = Number(_activeColumnID);
                    let columnData = this.dt.data.data.map(v => v.cells[_activeColumnID].text || v.cells[_activeColumnID].data)
                    let columnHeadData = this.dt.data.headings[columnID];

                    if (this.options.fields[columnID]?.type === 'select') {
                        this.options.selectFields.push(_activeColumnID);
                    }

                    return this.options.fields[_activeColumnID].render(
                        columnData,
                        columnHeadData,
                        columnID,
                        this
                    );
                }

                return this.renderTextField(
                    _activeColumnID,
                    this.options.classes.fields,
                    this.dt.data.headings[ _activeColumnID ].text || this.dt.data.headings[ _activeColumnID ].data
                );
            } ).join('').trim();
        }

        return this.activeColumns.map((_activeColumnID, idx) => {
            return this.renderTextField(
                _activeColumnID,
                this.options.classes.fields,
                this.dt.data.headings[ _activeColumnID ].text || this.dt.data.headings[ _activeColumnID ].data
            );
        } ).join('').trim();
    }

    renderTextField(columnID, cssClass, placeholder = '') {
        return `<div><input type="search" id="#input-filter-${columnID}" data-columns="[${columnID}]" class="datatable-input ${cssClass}" placeholder="${placeholder.trim()}"/></div>`
    }

    _bindEvents() {

        if (this.options.selectFields.length === 0) {
            return;
        }

        this.events = {
            change: this._change.bind(this)
        }

        this.options.selectFields.forEach( (selectField) => {
            document.querySelector(`div.datatable-col-filter #select-filter-${selectField}`).addEventListener("change", this.events.change)
        })
    }

    _change(event) {
        event.preventDefault();

        this.dt.search(event.target.value, event.target.dataset.columns);
    }

    destroy() {

        if (this.options.selectFields.length != 0) {
            this.options.selectFields.forEach( (selectField) => {
                document.querySelector(`div.datatable-col-filter #select-filter-${selectField}`).removeEventListener("change", this.events.change)
            })
        }

        this.initialized = false;
        this.dt.wrapperDOM.querySelector('.datatable-col-filter').remove();
    }

    update() {

        if (this.initialized) {
            this.destroy();
        }

        this.init();
    }

}


export const addDataFilter = function(dataTable: DataTable, options = {}) {
    const dataFilter = new DataFilter(dataTable, options)
    if (dataTable.initialized) {
        dataFilter.init()
    } else {
        dataTable.on("datatable.init", () => dataFilter.init())
    }

    return dataFilter
}
