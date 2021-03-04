import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {Button} from 'primereact/button';
import {Calendar} from 'primereact/calendar';
import {SplitButton} from 'primereact/splitbutton';
import {Dropdown} from 'primereact/dropdown';
import {MultiSelect} from 'primereact/multiselect';
import {ExportToCsv} from 'export-to-csv';
import ReservationDetails from './ReservationDetails';
import {toDate} from 'date-fns-tz';
import {isSameDay, isValid} from 'date-fns';
// @ts-ignore
import {confirmPopup} from 'primereact/confirmpopup';
// @ts-ignore
import styles from './ReservationsTable.css';
// @ts-ignore
import tableStyles from './DataTable.css';
import React from "react";
import globals from '../../globals';
import {BackendUser, CustomerBackendRecord, ReservationRecordBackend, tbkCommonB} from "../../typedefs";

declare const tbkCommon: tbkCommonB;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface ReservationTableProps {
    onUpdate(...props: any): any,

    isBusy: boolean,
    showFilters?: boolean,
    showHeader?: boolean,
    displayedColumns?: string[],
    reservations: ReservationRecordBackend[]
}

interface ReservationTableState {
    globalFilter: null,
    reservationDateFilter: null,
    statusFilter: any[] | null,
    reservationServiceFilter: any[] | null,
    selected: ReservationRecordBackend[] | null,
    expandedRows: { [key: string]: boolean },
}

class ReservationsTable extends React.Component<ReservationTableProps, ReservationTableState> {
    private dt: any;

    constructor(props: ReservationTableProps) {
        super(props);


        this.state = {
            globalFilter            : null,
            reservationDateFilter   : null,
            statusFilter            : null,
            reservationServiceFilter: null,
            selected                : [],
            expandedRows            : null,
        }

    }

    serviceBodyTemplate = (reservation: ReservationRecordBackend) => {
        const service = tbkCommon.services[reservation.serviceId];
        return (
            <div
                className={tableStyles.nameItem}>
                <div
                    className={tableStyles.nameItemAvatar}
                    style={
                        {
                            backgroundColor: service.color
                        }
                    }>
                </div>
                <div>
                    {service.name}
                </div>
            </div>
        )
    }

    customerTemplate = (reservation: ReservationRecordBackend) => {

        const users = tbkCommon.users.filter(user => {
            return user.ID === tbkCommon.customers[reservation.customerId].wpUserId;
        });
        const avatar = typeof users[0] !== 'undefined' ? users[0].avatar : tbkCommon.pluginUrl + 'Admin/Images/user-placeholder.png';

        return (
            <div className={tableStyles.nameItem}>
                <div className={tableStyles.nameItemAvatar}>
                    <img src={avatar}
                         onError={(e: any) => e.target.src = tbkCommon.pluginUrl + 'Admin/Images/user-placeholder.png'
                         }/>
                </div>
                <div>
                    <span>
                        {tbkCommon.customers[reservation.customerId].name}
                    </span>
                    <span className={tableStyles.tableCellDescription}>
                        {tbkCommon.customers[reservation.customerId].email}
                    </span>
                </div>
            </div>
        )
    }

    dateOfReservationBodyTemplate = (reservation: ReservationRecordBackend) => {
        if (typeof reservation.start !== 'undefined') {
            const date = toDate(reservation.start);
            return (
                <>
                <span>
                    {globals.formatDate(date)}
                </span>
                    <span className={tableStyles.tableCellDescription}>
                    {globals.formatTime(date)}
                </span>
                </>
            )
        } else {
            return (
                <>

                </>
            )
        }
    }

    statusBodyTemplate = (reservation: ReservationRecordBackend) => {
        const options = [];
        for (const [key, value] of Object.entries(tbkCommon.statuses)) {
            if (['pending', 'confirmed', 'cancelled'].includes(key)) {
                options.push({
                    label: value,
                    value: key
                })
            }
        }
        return (
            <>
                <Dropdown
                    className={styles.statusBadge}
                    value={reservation.status}
                    options={options}
                    valueTemplate={(option) => (<span className={styles.statusWrapper}><span className={'status' + option.value}></span>{option.label}</span>)}
                    itemTemplate={(option) => (<span className={styles.statusWrapper}><span className={'status' + option.value}></span>{option.label}</span>)}
                    onChange={(e) => {
                        this.props.onUpdate({
                            type   : 'SAVE_RESERVATION_SETTINGS',
                            payload: {
                                settings: {
                                    status: e.value
                                },
                                id      : reservation.uid
                            }
                        })
                    }}
                />
            </>
        )
    }

    confirm = (event: any, callback: any) => {
        confirmPopup({
            target : event.currentTarget,
            message: __('Are you sure you want to proceed?', 'thebooking'),
            icon   : 'pi pi-exclamation-triangle',
            accept : callback,
            reject : null
        })
    }

    actionsBodyTemplate = (reservation: ReservationRecordBackend) => {
        return (
            <>
                <Button
                    icon={'pi pi-trash'}
                    className={'p-button-rounded p-button-text p-button-danger'}
                    onClick={(event) => this.confirm(event, () => this.deleteReservations([reservation]))}
                />
                {tbkCommon.reservationStatusUpdate.includes(reservation.uid) && (
                    <Button
                        icon={'pi pi-info-circle'}
                        disabled={true}
                        className={'p-button-rounded p-button-text'}
                        tooltip={__('Status is changed.', 'thebooking')}
                    />
                )}
            </>
        )
    }

    deleteReservations = (reservations: ReservationRecordBackend[]) => {
        this.props.onUpdate({
            type   : 'DELETE_RESERVATIONS',
            payload: reservations.map(reservation => {
                return reservation.uid;
            })
        })
        this.setState({
            selected: []
        })
    }

    sortFunction = (e: any) => {
        const value = [...this.props.reservations];
        switch (e.field) {
            case 'serviceId':
                value.sort((a, b) => {
                    if (tbkCommon.services[a.serviceId].name === tbkCommon.services[b.serviceId].name) return 0;
                    return e.order * tbkCommon.services[a.serviceId].name.localeCompare(tbkCommon.services[b.serviceId].name);
                })
                break;
            case 'customerId':
                value.sort((a, b) => {
                    const aUser: BackendUser = tbkCommon.users.filter(user => {
                        return user.ID === a.customerId
                    })[0] || {
                        ID          : 0,
                        display_name: __('Unregistered', 'thebooking'),
                        user_email  : null,
                        user_login  : null,
                        avatar      : null
                    };
                    const bUser: BackendUser = tbkCommon.users.filter(user => {
                        return user.ID === b.customerId
                    })[0] || {
                        ID          : 0,
                        display_name: __('Unregistered', 'thebooking'),
                        user_email  : null,
                        user_login  : null,
                        avatar      : null
                    };
                    if (aUser.display_name === bUser.display_name) return 0;
                    return e.order * aUser.display_name.localeCompare(bUser.display_name);
                })
                break;
            case 'dateOfReservation':
                value.sort((a, b) => {
                    if (a.start === b.start) return 0;
                    if (a.start < b.start) {
                        return e.order * 1;
                    } else {
                        return e.order * -1;
                    }
                })
                break;
            case 'status':
                value.sort((a, b) => {
                    if (a.status === b.status) return 0;
                    return e.order * a.status.localeCompare(b.status);
                })
                break;
        }
        return value;
    }

    /**
     * https://github.com/alexcaza/export-to-csv#readme
     */
    exportCsv = () => {

        let reservations = JSON.parse(JSON.stringify(this.state.selected.length > 0 ? this.state.selected : this.props.reservations));

        reservations = reservations.map((reservation: ReservationRecordBackend) => {
            delete reservation.meta;
            return reservation;
        })

        const csvExporter = new ExportToCsv({
            fieldSeparator  : ',',
            quoteStrings    : '"',
            decimalSeparator: '.',
            showLabels      : true,
            filename        : __('Reservations', 'thebooking'),
            useTextFile     : false,
            useKeysAsHeaders: true,
        });
        csvExporter.generateCsv(reservations);
    }

    renderHeader() {
        return (
            <div className={tableStyles.tableHeader}>
                <SplitButton
                    icon={'pi pi-download'}
                    onClick={this.exportCsv}
                    label={this.state.selected.length > 0 ? __('Export selected', 'thebooking') + ' (' + this.state.selected.length + ')' : __('Export all', 'thebooking')}
                    model={[
                        {
                            label  : this.state.selected.length > 0 ? __('Delete selected', 'thebooking') + ' (' + this.state.selected.length + ')' : __('Delete all', 'thebooking'),
                            icon   : 'pi pi-trash',
                            command: (event: any) => {
                                this.confirm(event, () => this.deleteReservations(this.state.selected.length > 0 ? this.state.selected : this.props.reservations))
                            }
                        },
                    ]}
                />
                <div>
                    <span className="p-input-icon-left">
                    <i className="pi pi-search"/>
                    <InputText type="search"
                               value={this.state.globalFilter || ''}
                               onChange={(e: any) => {
                                   if (e.target.value !== null) {
                                       this.dt.filter(e.target.value, 'uid', 'custom');
                                   } else
                                       this.dt.filter(null, 'uid', 'equals');
                                   this.setState({
                                       globalFilter: e.target.value
                                   })
                               }}
                               placeholder={__('Search all', 'thebooking')}/>
                    </span>
                </div>
            </div>
        );
    }

    filterGlobal = (value: string, filter: string) => {
        const item = this.props.reservations.find(item => item.uid === value);
        if (!item) return false;

        if (this.filterCustomer(item.customerId, filter)) {
            return true;
        }
        const guessDate = new Date(filter);
        if (isValid(guessDate)) {
            if (this.filterReservationDate(item.start, guessDate)) {
                return true;
            }
        }
        if (tbkCommon.statuses[item.status].toLocaleLowerCase(tbkCommon.i18n.locale).includes(filter.toLocaleLowerCase(tbkCommon.i18n.locale))) {
            return true;
        }
        if (tbkCommon.services[item.serviceId].name.toLocaleLowerCase(tbkCommon.i18n.locale).includes(filter.toLocaleLowerCase(tbkCommon.i18n.locale))) {
            return true;
        }

        return false;
    }

    filterCustomer = (value: number, filter: string) => {
        const user: CustomerBackendRecord = tbkCommon.customers[value] || {
            name    : 'Unregistered',
            email   : null,
            phone   : null,
            wpUserId: 0,
            birthday: null,
            id      : null
        }
        const searchString = user.name + '*' + user.email;
        return searchString.toLocaleLowerCase(tbkCommon.i18n.locale).includes(filter.toLocaleLowerCase(tbkCommon.i18n.locale));
    }

    filterService = (value: string, filter: string[]) => {
        return filter.includes(value);
    }

    filterReservationDate = (value: string, filter: Date) => {
        return isSameDay(filter, toDate(value));
    }

    filterStatus = (value: string, filter: string[]) => {
        return filter.includes(value);
    }

    rowExpansionTemplate = (data: ReservationRecordBackend) => {
        return <ReservationDetails
            item={data}
            isBusy={this.props.isBusy}
            onUpdate={(settings) => {
                this.props.onUpdate({
                    type   : 'SAVE_RESERVATION_SETTINGS',
                    payload: {
                        settings: settings,
                        id      : data.uid
                    }
                })
            }}/>;
    }

    renderReservationDateFilter = () => {
        return (
            <Calendar
                value={this.state.reservationDateFilter}
                onChange={this.onReservationDateFilterChange}
                placeholder={__('Date', 'thebooking')}
                showButtonBar
                className={'p-column-filter'}
            />
        );
    }

    renderReservationServiceFilter = () => {
        const options = [];
        for (const [key, value] of Object.entries(tbkCommon.services)) {
            options.push({
                label: value.name,
                value: key
            })
        }
        return (
            <MultiSelect value={this.state.reservationServiceFilter}
                         options={options}
                         onChange={this.onServiceFilterChange}
                         className={styles.statusBadge}
                         placeholder={__('Service', 'thebooking')}
                         maxSelectedLabels={4}
                         selectedItemTemplate={
                             (option) => {
                                 if (option) return (<span className={styles.statusWrapper}><span style={{background: tbkCommon.services[option].color}}/></span>)
                             }
                         }
                         itemTemplate={
                             (option) => {
                                 if (option) return (<span className={styles.statusWrapper}><span
                                     style={{background: tbkCommon.services[option.value].color}}/>{tbkCommon.services[option.value].name}</span>)
                             }
                         }
            />
        )
    }

    renderReservationStatusFilter = () => {
        const options = [];
        for (const [key, value] of Object.entries(tbkCommon.statuses)) {
            if (['pending', 'confirmed', 'cancelled'].includes(key)) {
                options.push({
                    label: value,
                    value: key
                })
            }
        }
        return (
            <MultiSelect value={this.state.statusFilter}
                         options={options}
                         onChange={this.onStatusFilterChange}
                         className={styles.statusBadge}
                         placeholder={__('Status', 'thebooking')}
                         maxSelectedLabels={4}
                         selectedItemTemplate={
                             (option) => {
                                 if (option) return (<span className={styles.statusWrapper}><span className={'status' + option}/></span>)
                             }
                         }
                         itemTemplate={
                             (option) => {
                                 if (option) return (<span className={styles.statusWrapper}><span className={'status' + option.value}/>{option.label}</span>)
                             }
                         }
            />
        )
    }

    onStatusFilterChange = (event: any) => {
        if (event.value !== null) {
            this.dt.filter(event.value, 'status', 'custom');
        } else
            this.dt.filter(null, 'status', 'equals');

        this.setState({statusFilter: event.value});
    }

    onServiceFilterChange = (event: any) => {
        if (event.value !== null) {
            this.dt.filter(event.value, 'serviceId', 'custom');
        } else
            this.dt.filter(null, 'serviceId', 'equals');

        this.setState({reservationServiceFilter: event.value});
    }

    onReservationDateFilterChange = (event: any) => {
        if (event.value !== null) {
            this.dt.filter(event.value, 'start', 'custom');
        } else
            this.dt.filter(null, 'start', 'equals');

        this.setState({reservationDateFilter: event.value});
    }

    onSelection = (e: any) => {
        this.setState({selected: e.value});
    }

    renderColumn = (columnId: string) => {
        switch (columnId) {
            case 'selector':
                return <Column selectionMode={'multiple'} style={{width: '3em'}}/>
            case 'expander':
                return <Column expander style={{width: '3em'}}/>
            case 'service':
                return <Column
                    sortFunction={this.sortFunction}
                    field={'serviceId'}
                    sortable
                    filterFunction={this.filterService}
                    filterMatchMode={'custom'}
                    filterElement={this.renderReservationServiceFilter()}
                    filter={this.props.showFilters}
                    header={__('Service', 'thebooking')}
                    body={this.serviceBodyTemplate}
                />
            case 'customer':
                return <Column
                    sortable
                    sortFunction={this.sortFunction}
                    field={'customerId'}
                    filter={this.props.showFilters}
                    filterFunction={this.filterCustomer}
                    filterMatchMode={'custom'}
                    header={__('Customer', 'thebooking')}
                    body={this.customerTemplate}
                />
            case 'startDate':
                return <Column
                    sortable
                    sortFunction={this.sortFunction}
                    field={'dateOfReservation'}
                    filterField={'start'}
                    filter={this.props.showFilters}
                    filterMatchMode={'custom'}
                    filterFunction={this.filterReservationDate}
                    filterElement={this.renderReservationDateFilter()}
                    header={__('Date and time', 'thebooking')}
                    body={this.dateOfReservationBodyTemplate}
                />
            case 'status':
                return <Column
                    sortable
                    sortFunction={this.sortFunction}
                    field={'status'}
                    filter={this.props.showFilters}
                    filterMatchMode={'custom'}
                    filterFunction={this.filterStatus}
                    filterElement={this.renderReservationStatusFilter()}
                    header={__('Status', 'thebooking')}
                    body={this.statusBodyTemplate}
                />
            case 'actions':
                return <Column
                    field={'uid'}
                    filterMatchMode={'custom'}
                    filterFunction={this.filterGlobal}
                    body={this.actionsBodyTemplate}
                />
        }
    }

    render() {
        const columns = this.props.displayedColumns ? this.props.displayedColumns : [
            'selector', 'expander', 'service', 'customer', 'startDate', 'status', 'actions'
        ]
        return (
            <div className={tableStyles.dataTable + ' ' + styles.reservationsTable}>
                <DataTable
                    ref={(el) => this.dt = el}
                    paginator
                    rows={25}
                    currentPageReportTemplate={sprintf(__('Showing %1$s to %2$s of %3$s reservations', 'thebooking'), '{first}', '{last}', '{totalRecords}')}
                    rowsPerPageOptions={[10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    expandedRows={this.state.expandedRows as unknown as any[]}
                    header={this.props.showHeader && this.renderHeader()}
                    value={this.props.reservations}
                    selection={this.state.selected}
                    onSelectionChange={this.onSelection}
                    onRowToggle={e => this.setState({expandedRows: e.data as any})}
                    dataKey={'uid'}
                    rowExpansionTemplate={this.rowExpansionTemplate}
                    loading={this.props.isBusy}
                >
                    {columns.map(column => (this.renderColumn(column)))}
                </DataTable>
            </div>
        )
    }
}

export default ReservationsTable;