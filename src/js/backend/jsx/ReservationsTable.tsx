import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {Button} from 'primereact/button';
import {Calendar} from 'primereact/calendar';
import {SplitButton} from 'primereact/splitbutton';
import {Dropdown} from 'primereact/dropdown';
import {MultiSelect} from 'primereact/multiselect';
import {Skeleton} from 'primereact/skeleton';
import {ExportToCsv} from 'export-to-csv';
import ReservationDetails from './ReservationDetails';
import {toDate} from 'date-fns-tz';
import {addSeconds, isSameDay, isValid} from 'date-fns';
// @ts-ignore
import {confirmPopup} from 'primereact/confirmpopup';
import {OverlayPanel} from 'primereact/overlaypanel';
import {ListBox} from 'primereact/listbox';
import {Checkbox} from 'primereact/checkbox';
// @ts-ignore
import styles from './ReservationsTable.css';
// @ts-ignore
import tableStyles from './DataTable.css';
import React from "react";
import globals from '../../globals';
import {AvailabilityRecord, BackendUser, CustomerBackendRecord, ReservationRecordBackend, ReservationStatuses, tbkCommonB} from "../../typedefs";
import CustomersDropdown from "./CustomersDropdown";
import Scheduler from "../../scheduler";
import Rescheduler from "./Rescheduler";
import {Badge} from "primereact/badge";

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
    columns: string[],
    editMode: boolean
}

class ReservationsTable extends React.Component<ReservationTableProps, ReservationTableState> {
    private dt: any;
    private readonly columnFilter: React.RefObject<OverlayPanel>;
    private readonly rescheduleOverlay: React.RefObject<OverlayPanel>;
    private readonly rescheduleOverlayId: string;

    constructor(props: ReservationTableProps) {
        super(props);

        this.columnFilter = React.createRef();
        this.rescheduleOverlay = React.createRef();
        this.rescheduleOverlayId = globals.uuidDOM();

        this.state = {
            globalFilter            : null,
            reservationDateFilter   : null,
            statusFilter            : null,
            reservationServiceFilter: null,
            selected                : [],
            expandedRows            : null,
            editMode                : false,
            columns                 : tbkCommon.userPrefs.reservationsTableColumns || ['service', 'customer', 'startDate', 'status']
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
            <>
                {!this.state.editMode && (
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
                )}
                {this.state.editMode && (
                    <CustomersDropdown
                        customers={tbkCommon.customers}
                        selected={reservation.customerId}
                        onChange={(e) => {
                            this.props.onUpdate({
                                type   : 'SAVE_RESERVATION_SETTINGS',
                                payload: {
                                    settings: {
                                        customer: e.value
                                    },
                                    id      : reservation.uid
                                }
                            })
                        }}
                    />
                )}

            </>
        )
    }

    dateOfReservationBodyTemplate = (reservation: ReservationRecordBackend) => {
        const date = toDate(reservation.start);

        const availability: AvailabilityRecord[] = [];

        for (const serviceId of Object.keys(tbkCommon.services)) {
            for (const availabilityRecord of Object.values(tbkCommon.availability) as any) {
                availability.push({
                    serviceId        : serviceId,
                    rrule            : availabilityRecord.rrule,
                    uid              : availabilityRecord.uid,
                    containerDuration: {
                        minutes: availabilityRecord.duration
                    }
                })
            }
        }

        const scheduler = new Scheduler({
            services    : tbkCommon.services,
            availability: availability,
            reservations: tbkCommon.reservations
        })


        return (
            <div className={'p-d-inline-flex p-ai-center'}>
                <div style={{flexShrink: 0}}>
                    <span>
                        {globals.formatDate(date)}
                    </span>
                    <span className={tableStyles.tableCellDescription}>
                        {globals.formatTime(date)}
                    </span>
                </div>
                {this.state.editMode && (
                    <div className="p-ml-3">
                        <Button
                            tooltip={__('Reschedule', 'thebooking')}
                            className="p-button-rounded p-button-text p-button-plain"
                            icon={'pi pi-calendar'}
                            onClick={(e) => {
                                this.rescheduleOverlay.current.toggle(e);
                                setTimeout(() => {
                                    const target = document.getElementById(this.rescheduleOverlayId);
                                    if (target) {
                                        // @ts-ignore
                                        ReactDOM.render(
                                            <Rescheduler onConfirm={(date: Date) => {
                                                this.reschedule(date, reservation)
                                                this.rescheduleOverlay.current.hide();
                                            }} serviceId={reservation.serviceId} date={date}/>,
                                            document.getElementById(this.rescheduleOverlayId)
                                        )
                                    }
                                }, 250)
                            }}
                        />
                    </div>
                )
                }
            </div>
        )
    }

    statusBodyTemplate = (reservation: ReservationRecordBackend) => {
        const options = [];
        const service = tbkCommon.services[reservation.serviceId];

        const allowedStatuses = ['confirmed', 'cancelled'];
        if (service.meta.requiresApproval) {
            allowedStatuses.push('pending', 'declined');
        }

        for (const [key, value] of Object.entries(tbkCommon.statuses)) {
            // the second part of the conditional avoids the script to break if the service setting changes
            if (allowedStatuses.includes(key) || reservation.status === key) {
                options.push({
                    label: value,
                    value: key
                })
            }
        }
        return (
            <>
                {this.state.editMode && (
                    <Dropdown
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
                )}
                {!this.state.editMode && (
                    <span className={styles.statusWrapper}><span className={'status' + reservation.status}></span>{tbkCommon.statuses[reservation.status]}</span>
                )}
            </>
        )
    }

    confirmDeletion = (event: any, callback: any) => {
        confirmPopup({
            target : event.currentTarget,
            message: __('Are you sure you want to proceed?', 'thebooking'),
            icon   : 'pi pi-exclamation-triangle',
            accept : callback,
            reject : null
        })
    }

    confirmStatusChange = (event: any, callback: any) => {
        confirmPopup({
            target     : event.currentTarget,
            message    : __('Notifications of the new status will be sent according to the service settings.', 'thebooking'),
            icon       : 'pi pi-info-circle',
            accept     : callback,
            acceptLabel: __('Proceed', 'thebooking'),
            rejectLabel: __('Cancel', 'thebooking'),
            reject     : null
        })
    }

    confirmReSendNotifications = (event: any, callback: any) => {
        confirmPopup({
            target     : event.currentTarget,
            message    : __('Notifications of the current status will be sent again, according to the service settings.', 'thebooking'),
            icon       : 'pi pi-info-circle',
            accept     : callback,
            acceptLabel: __('Proceed', 'thebooking'),
            rejectLabel: __('Cancel', 'thebooking'),
            reject     : null
        })
    }

    actionsBodyTemplate = (reservation: ReservationRecordBackend) => {
        const service = tbkCommon.services[reservation.serviceId];
        return (
            <>
                <Button
                    icon={'pi pi-trash'}
                    tooltip={__('Delete', 'thebooking')}
                    className={'p-button-rounded p-button-text p-button-danger'}
                    onClick={(event) => this.confirmDeletion(event, () => this.deleteReservations([reservation]))}
                />
                {reservation.status === 'confirmed' && (
                    <Button
                        icon={'pi pi-times'}
                        tooltip={__('Cancel', 'thebooking')}
                        className={'p-button-rounded p-button-text p-button-danger'}
                        onClick={(event) => this.confirmStatusChange(event, () => this.changeStatus('cancelled', reservation.uid))}
                    />
                )}
                {reservation.status === 'pending' && service.meta.requiresApproval && (
                    <>
                        <Button
                            icon={'pi pi-thumbs-up'}
                            tooltip={__('Approve', 'thebooking')}
                            className={'p-button-rounded p-button-text p-button-success'}
                            onClick={(event) => this.confirmStatusChange(event, () => this.changeStatus('confirmed', reservation.uid))}
                        />
                        <Button
                            icon={'pi pi-thumbs-down'}
                            tooltip={__('Decline', 'thebooking')}
                            className={'p-button-rounded p-button-text p-button-plain'}
                            onClick={(event) => this.confirmStatusChange(event, () => this.changeStatus('declined', reservation.uid))}
                        />
                    </>
                )}
                <Button
                    icon={'pi pi-replay'}
                    tooltip={__('Re-send notifications', 'thebooking')}
                    className={'p-button-rounded p-button-text p-button-plain'}
                    onClick={(event) => this.confirmReSendNotifications(event, () => this.changeStatus(reservation.status, reservation.uid))}
                />
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

    /**
     * Function called when a reservation status changes due to explicit actions
     * such as approval, cancel and so on. As opposed to a status edit, this allows
     * the backend to trigger actions.
     */
    changeStatus = (status: ReservationStatuses, reservationId: string) => {
        this.props.onUpdate({
            type   : 'CHANGE_RESERVATION_STATUS',
            payload: {
                status: status,
                id    : reservationId
            }
        })
    }

    reschedule = (date: Date, reservation: ReservationRecordBackend) => {
        this.props.onUpdate({
            type   : 'RESCHEDULE_RESERVATION',
            payload: {
                start: date,
                end  : addSeconds(date, tbkCommon.services[reservation.serviceId].duration),
                id   : reservation.uid
            }
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
                <div>
                    <SplitButton
                        className={'p-mr-2'}
                        disabled={this.props.reservations.length < 1}
                        icon={'pi pi-download'}
                        onClick={this.exportCsv}
                        label={this.state.selected.length > 0 ? __('Export selected', 'thebooking') + ' (' + this.state.selected.length + ')' : __('Export all', 'thebooking')}
                        model={[
                            {
                                label  : this.state.selected.length > 0 ? __('Delete selected', 'thebooking') + ' (' + this.state.selected.length + ')' : __('Delete all', 'thebooking'),
                                icon   : 'pi pi-trash',
                                command: (event: any) => {
                                    this.confirmDeletion(event, () => this.deleteReservations(this.state.selected.length > 0 ? this.state.selected : this.props.reservations))
                                }
                            },
                        ]}
                    />
                    <Button
                        className={'p-mr-2 p-button-rounded ' + (this.state.editMode ? 'p-button-secondary' : 'p-button-plain p-button-text')}
                        onClick={(e) => this.setState({editMode: !this.state.editMode})}
                        icon={'pi pi-pencil'}
                        tooltip={__('Edit mode', 'thebooking')}
                    />
                    <Button
                        className="p-button-rounded p-button-text p-button-plain p-overlay-badge"
                        icon="pi pi-filter"
                        style={{overflow: 'visible'}}
                        tooltip={__('Filter columns', 'thebooking')}
                        onClick={(event) => this.columnFilter.current.toggle(event)}
                    >
                        {this.state.columns.length < 4 && (
                            <Badge severity="info" style={
                                {
                                    width   : '0.5rem',
                                    minWidth: '0.5rem',
                                    height  : '0.5rem',
                                    top     : '4px',
                                    right   : '4px'
                                }
                            }/>
                        )}
                    </Button>
                    <OverlayPanel
                        ref={this.columnFilter}
                    >
                        <label className={'p-px-3 p-text-bold'}>
                            {__('Columns to display', 'thebooking')}
                        </label>
                        <ListBox
                            className={tableStyles.columnSelector}
                            style={{border: 'none'}}
                            multiple
                            value={this.state.columns}
                            options={[
                                {label: __('Service name', 'thebooking'), value: 'service'},
                                {label: __('Customer', 'thebooking'), value: 'customer'},
                                {label: __('Date and time', 'thebooking'), value: 'startDate'},
                                {label: __('Status', 'thebooking'), value: 'status'},
                            ]}
                            onChange={(e) => {
                                this.setState({columns: e.value},
                                    () => {
                                        this.props.onUpdate({
                                            type   : 'SAVE_USER_PREFS',
                                            payload: {
                                                name : 'reservationsTableColumns',
                                                value: this.state.columns
                                            }
                                        })
                                    });
                            }}
                            itemTemplate={(option: any) => {
                                return (
                                    <div className="p-field-checkbox" style={{marginBottom: '0'}}>
                                        <Checkbox name="columns" value={option.value} checked={this.state.columns.indexOf(option.value) !== -1}/>
                                        <label>{option.label}</label>
                                    </div>
                                )
                            }
                            }
                        />
                    </OverlayPanel>
                </div>
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
            if (['pending', 'confirmed', 'cancelled', 'declined'].includes(key)) {
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
                return <Column key={columnId} selectionMode={'multiple'} style={{width: '3em'}}/>
            case 'expander':
                return <Column key={columnId} expander style={{width: '3em'}}/>
            case 'service':
                return <Column
                    key={columnId}
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
                    key={columnId}
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
                    key={columnId}
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
                    key={columnId}
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
                    key={columnId}
                    field={'uid'}
                    filterMatchMode={'custom'}
                    filterFunction={this.filterGlobal}
                    body={this.actionsBodyTemplate}
                    header={__('Actions', 'thebooking')}
                />
        }
    }

    getColumnsToDisplay = () => {
        const columns = this.props.displayedColumns ? this.props.displayedColumns : [
            'selector', 'expander', 'service', 'customer', 'startDate', 'status', 'actions'
        ]
        return columns.filter((item) => {
            if (item === 'selector' || item === 'expander' || item === 'actions') {
                return true;
            }
            return this.state.columns.includes(item);
        })
    }

    render() {
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
                    {this.getColumnsToDisplay().map(column => (this.renderColumn(column)))}
                </DataTable>
                <OverlayPanel ref={this.rescheduleOverlay} id={this.rescheduleOverlayId}>
                    <div className={'p-d-inline-flex p-ai-center p-flex-column'}>
                        <Skeleton width="359px" height="350px"></Skeleton>
                        <Skeleton width="359px" height="35px" className={'p-mt-3'}></Skeleton>
                    </div>
                </OverlayPanel>
            </div>
        )
    }
}

export default ReservationsTable;