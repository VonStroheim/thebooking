import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {Button} from 'primereact/button';
import {Calendar} from 'primereact/calendar';
import {SplitButton} from 'primereact/splitbutton';
import {SelectButton} from 'primereact/selectbutton';
import {Dropdown} from 'primereact/dropdown';
import {MultiSelect} from 'primereact/multiselect';
import {Skeleton} from 'primereact/skeleton';
import {ExportToCsv} from 'export-to-csv';
import ReservationDetails from './ReservationDetails';
import {toDate} from 'date-fns-tz';
import {addSeconds, isFuture, isSameDay, isValid, startOfToday, startOfTomorrow} from 'date-fns';
// @ts-ignore
import {confirmPopup} from 'primereact/confirmpopup';
import {OverlayPanel} from 'primereact/overlaypanel';
// @ts-ignore
import styles from './ReservationsTable.css';
// @ts-ignore
import tableStyles from './DataTable.css';
import React from "react";
import globals from '../../globals';
import {BackendUser, CustomerBackendRecord, ReservationRecordBackend, ReservationStatuses, tbkCommonB} from "../../typedefs";
import CustomersDropdown from "./CustomersDropdown";
import Rescheduler from "./Rescheduler";
import ServicesDropdown from "./ServicesDropdown";
import TableColumnsFilter from "./TableColumnsFilter";
import classNames from "classnames";
import TableUserPrefs from "./TableUserPrefs";
import ReservationsTableMeetingButton from "./ReservationsTableMeetingButton";

declare const tbkCommon: tbkCommonB;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface ReservationTableProps {
    onUpdate(...props: any): any,

    isBusy: boolean
    showFilters?: boolean
    showHeader?: boolean
    displayedColumns?: string[]
    reservations: ReservationRecordBackend[]
    showPast?: boolean
}

interface ReservationTableState {
    globalFilter: string
    reservationDateFilter: Date
    statusFilter: any[] | null
    priceFilter: any[] | null
    reservationServiceFilter: any[] | null
    selected: ReservationRecordBackend[] | null
    expandedRows: { [key: string]: boolean }
    columns: string[]
    editMode: boolean
    groupByDate: boolean
    showPast: boolean
    showFilters: boolean
}

class ReservationsTable extends React.Component<ReservationTableProps, ReservationTableState> {
    private dt: any;
    private readonly rescheduleOverlay: React.RefObject<OverlayPanel>;
    private readonly rescheduleOverlayId: string;

    constructor(props: ReservationTableProps) {
        super(props);

        this.rescheduleOverlay = React.createRef();
        this.rescheduleOverlayId = globals.uuidDOM();

        this.state = {
            globalFilter            : null,
            reservationDateFilter   : null,
            statusFilter            : null,
            priceFilter             : null,
            reservationServiceFilter: null,
            selected                : [],
            expandedRows            : null,
            editMode                : false,
            columns                 : tbkCommon.userPrefs.reservationsTableColumns || ['service', 'customer', 'startDate', 'status'],
            groupByDate             : tbkCommon.userPrefs.reservationsTableGroupByDate || false,
            showPast                : typeof props.showPast !== 'undefined' ? props.showPast : (tbkCommon.userPrefs.reservationsTableShowPast || false),
            showFilters             : props.showFilters ? (tbkCommon.userPrefs.reservationsTableShowFilters || false) : false,
        }

    }

    serviceBodyTemplate = (reservation: ReservationRecordBackend) => {
        const service = tbkCommon.services[reservation.serviceId];

        if (this.state.editMode && Object.keys(tbkCommon.services).length > 1) {
            return (
                <ServicesDropdown
                    services={tbkCommon.services}
                    selected={reservation.serviceId}
                    onChange={(e) => {
                        // TODO: check if the change requires a re-scheduling
                        this.props.onUpdate({
                            type   : 'SAVE_RESERVATION_SETTINGS',
                            payload: {
                                settings: {
                                    service: e.value
                                },
                                id      : reservation.uid
                            }
                        })
                    }}
                />
            )
        }

        return (
            <div className={tableStyles.nameItem}>
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

        if (this.state.editMode && Object.keys(tbkCommon.customers).length > 1) {
            return (
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
            )
        }

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
        const date = toDate(reservation.start);

        return (
            <div className={'p-d-inline-flex p-ai-center'}>
                <div style={{flexShrink: 0}}>
                    <span>
                        {this.state.groupByDate ? globals.formatTime(date) : globals.formatDate(date)}
                    </span>
                    {!this.state.groupByDate && (
                        <span className={tableStyles.tableCellDescription}>
                            {globals.formatTime(date)}
                        </span>
                    )}
                </div>
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
                        valueTemplate={(option) => (<span className={styles.statusWrapper}><span className={'status' + option.value}/>{option.label}</span>)}
                        itemTemplate={(option) => (<span className={styles.statusWrapper}><span className={'status' + option.value}/>{option.label}</span>)}
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
                    <span className={styles.statusWrapper}><span className={'status' + reservation.status}/>{tbkCommon.statuses[reservation.status]}</span>
                )}
            </>
        )
    }

    priceBodyTemplate = (reservation: ReservationRecordBackend) => {
        const service = tbkCommon.services[reservation.serviceId];
        return (
            <>
                {service.meta.hasPrice && (
                    <div className={'p-d-inline-flex p-ai-center'}>
                        <div style={{flexShrink: 0}}>
                            <span>{service.meta.price} {'price_currency' in tbkCommon.settings && tbkCommon.settings.price_currency}</span>
                            <span className={classNames(tableStyles.tableCellDescription, styles.priceWrapper, (reservation.meta.isPaid ? 'paid' : ''))}>
                                {reservation.meta.isPaid ? __('Paid', 'thebooking') : __('Not paid', 'thebooking')}
                            </span>
                        </div>
                    </div>

                )}
            </>
        )
    }

    confirmDeletion = (event: any, callback: any) => {
        let target = event.currentTarget;
        if (typeof target === 'undefined' && 'originalEvent' in event) {
            target = event.originalEvent.currentTarget;
        }
        confirmPopup({
            target : target,
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
        const date = toDate(reservation.start);
        return (
            <>
                <Button
                    icon={'pi pi-trash'}
                    tooltip={__('Delete', 'thebooking')}
                    tooltipOptions={{
                        position: 'top'
                    }}
                    className={'p-button-rounded p-button-text p-button-danger'}
                    onClick={(event) => this.confirmDeletion(event, () => this.deleteReservations([reservation]))}
                />
                {['pending', 'confirmed'].includes(reservation.status) && (
                    <Button
                        tooltip={__('Reschedule', 'thebooking')}
                        tooltipOptions={{
                            position: 'top'
                        }}
                        className="p-button-rounded p-button-text"
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
                )}
                {reservation.status === 'confirmed' && (
                    <Button
                        icon={'pi pi-times'}
                        tooltip={__('Cancel', 'thebooking')}
                        tooltipOptions={{
                            position: 'top'
                        }}
                        className={'p-button-rounded p-button-text p-button-danger'}
                        onClick={(event) => this.confirmStatusChange(event, () => this.changeStatus('cancelled', reservation.uid))}
                    />
                )}
                {reservation.status === 'pending' && service.meta.requiresApproval && (
                    <>
                        <Button
                            icon={'pi pi-thumbs-up'}
                            tooltip={__('Approve', 'thebooking')}
                            tooltipOptions={{
                                position: 'top'
                            }}
                            className={'p-button-rounded p-button-text p-button-success'}
                            onClick={(event) => this.confirmStatusChange(event, () => this.changeStatus('confirmed', reservation.uid))}
                        />
                        <Button
                            icon={'pi pi-thumbs-down'}
                            tooltip={__('Decline', 'thebooking')}
                            tooltipOptions={{
                                position: 'top'
                            }}
                            className={'p-button-rounded p-button-text p-button-plain'}
                            onClick={(event) => this.confirmStatusChange(event, () => this.changeStatus('declined', reservation.uid))}
                        />
                    </>
                )}
                {tbkCommon.modules.includes('notifications') && (
                    <Button
                        icon={'pi pi-envelope'}
                        tooltip={__('Re-send notifications', 'thebooking')}
                        tooltipOptions={{
                            position: 'top'
                        }}
                        className={'p-button-rounded p-button-text p-button-plain'}
                        onClick={(event) => this.confirmReSendNotifications(event, () => this.changeStatus(reservation.status, reservation.uid))}
                    />
                )}
                {(reservation.meta.zoomMeetingId || reservation.meta.gcal_meet_link) && (
                    <ReservationsTableMeetingButton reservation={reservation}/>
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

    getFilterableColumns = () => {
        const columns = [
            {label: __('Service name', 'thebooking'), value: 'service'},
            {label: __('Customer', 'thebooking'), value: 'customer'},
            {label: __('Date and time', 'thebooking'), value: 'startDate'},
            {label: __('Status', 'thebooking'), value: 'status'},
        ];

        if (tbkCommon.modules.includes('price')) {
            columns.push({
                label: __('Price', 'thebooking'),
                value: 'price'
            })
        }

        return columns;
    }

    renderHeader() {
        const today = startOfToday();
        const tomorrow = startOfTomorrow();
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
                    <SelectButton
                        className={'p-mr-2'}
                        style={{display: 'inline'}}
                        options={[
                            {
                                label: __("Today's", 'thebooking'),
                                value: 'today'
                            },
                            {
                                label: __("Tomorrow's", 'thebooking'),
                                value: 'tomorrow'
                            }
                        ]}
                        value={
                            this.state.reservationDateFilter && this.state.reservationDateFilter.toISOString() === today.toISOString()
                                ? 'today'
                                : (this.state.reservationDateFilter && this.state.reservationDateFilter.toISOString() === tomorrow.toISOString()
                                ? 'tomorrow'
                                : null)}
                        onChange={(e) => {
                            if (e.value === 'today') {
                                this.dt.filter(today, 'start', 'custom');
                                this.setState({reservationDateFilter: today});
                            } else if (e.value === 'tomorrow') {
                                this.dt.filter(tomorrow, 'start', 'custom');
                                this.setState({reservationDateFilter: tomorrow});
                            } else {
                                this.setState({reservationDateFilter: null});
                                this.dt.filter(null, 'start', 'equals');
                            }
                        }}
                    />
                    <Button
                        className={'p-mr-2 p-button-rounded ' + (this.state.editMode ? 'p-button-secondary' : 'p-button-plain p-button-text')}
                        onClick={(e) => this.setState({editMode: !this.state.editMode})}
                        icon={'pi pi-pencil'}
                        tooltip={__('Edit mode', 'thebooking')}
                        tooltipOptions={{
                            position: 'top'
                        }}
                    />
                    <TableColumnsFilter
                        columns={this.getFilterableColumns()}
                        selected={this.state.columns}
                        onChange={(selected) => {
                            this.setState({columns: selected},
                                () => {
                                    this.props.onUpdate({
                                        type   : 'SAVE_USER_PREFS',
                                        payload: [{
                                            name : 'reservationsTableColumns',
                                            value: this.state.columns
                                        }]
                                    })
                                });
                        }}
                    />
                    <TableUserPrefs
                        prefs={[
                            {
                                label: __('Show past reservations', 'thebooking'),
                                value: 'showPast'
                            },
                            {
                                label: __('Group by date', 'thebooking'),
                                value: 'groupByDate'
                            },
                            {
                                label: __('Show filters', 'thebooking'),
                                value: 'showFilters'
                            }
                        ]}
                        selected={['showPast', 'groupByDate', 'showFilters'].filter((value: 'showPast' | 'groupByDate' | 'showFilters') => this.state[value])}
                        onChange={(selected) => {
                            this.setState({
                                showPast   : selected.includes('showPast'),
                                groupByDate: selected.includes('groupByDate'),
                                showFilters: selected.includes('showFilters'),
                            }, () => {
                                this.props.onUpdate({
                                    type   : 'SAVE_USER_PREFS',
                                    payload: [
                                        {
                                            name : 'reservationsTableShowPast',
                                            value: this.state.showPast
                                        },
                                        {
                                            name : 'reservationsTableGroupByDate',
                                            value: this.state.groupByDate
                                        },
                                        {
                                            name : 'reservationsTableShowFilters',
                                            value: this.state.showFilters
                                        }
                                    ]
                                })
                            })
                        }}
                    />
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
            id      : null,
            timezone: ''
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

    filterPrice = (value: any, filter: string[]) => {
        if (value && filter.includes('paid')) {
            return true;
        }
        return !value && filter.includes('not_paid');
    }

    rowExpansionTemplate = (data: ReservationRecordBackend) => {
        return <ReservationDetails
            item={data}
            isBusy={this.props.isBusy}
            onUpdate={this.props.onUpdate}/>;
    }

    renderReservationDateFilter = () => {
        return (
            <Calendar
                value={this.state.reservationDateFilter}
                onChange={this.onReservationDateFilterChange}
                placeholder={__('Date', 'thebooking')}
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

    renderReservationPriceFilter = () => {
        const options = [
            {
                label: __('Paid', 'thebooking'),
                value: 'paid'
            },
            {
                label: __('Not paid', 'thebooking'),
                value: 'not_paid'
            }
        ];
        return (
            <MultiSelect value={this.state.priceFilter}
                         options={options}
                         onChange={this.onPriceFilterChange}
                         placeholder={__('Payment status', 'thebooking')}
                         maxSelectedLabels={4}
                         selectedItemTemplate={
                             (option) => {
                                 const selected = options.find(opt => {
                                     return opt.value === option;
                                 })
                                 const icon = option === 'paid' ? 'pi pi-check' : 'pi pi-times';
                                 if (option) return (<span><span className={icon}/></span>)
                             }
                         }
                         itemTemplate={
                             (option) => {
                                 if (option) return (<span><span className={'status' + option.value}/>{option.label}</span>)
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

    onPriceFilterChange = (event: any) => {
        if (event.value !== null) {
            this.dt.filter(event.value, 'meta.isPaid', 'custom');
        } else
            this.dt.filter(null, 'meta.isPaid', 'equals');

        this.setState({priceFilter: event.value});
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
                    filter={this.state.showFilters}
                    header={__('Service', 'thebooking')}
                    body={this.serviceBodyTemplate}
                />
            case 'customer':
                return <Column
                    sortable
                    key={columnId}
                    sortFunction={this.sortFunction}
                    field={'customerId'}
                    filter={this.state.showFilters}
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
                    filter={this.state.showFilters}
                    filterMatchMode={'custom'}
                    filterFunction={this.filterReservationDate}
                    filterElement={this.renderReservationDateFilter()}
                    header={this.state.groupByDate ? __('Time', 'thebooking') : __('Date and time', 'thebooking')}
                    body={this.dateOfReservationBodyTemplate}
                />
            case 'status':
                return <Column
                    sortable
                    key={columnId}
                    sortFunction={this.sortFunction}
                    field={'status'}
                    filter={this.state.showFilters}
                    filterMatchMode={'custom'}
                    filterFunction={this.filterStatus}
                    filterElement={this.renderReservationStatusFilter()}
                    header={__('Status', 'thebooking')}
                    body={this.statusBodyTemplate}
                />
            case 'price':
                return <Column
                    key={columnId}
                    field={'meta.isPaid'}
                    filter={this.state.showFilters}
                    filterMatchMode={'custom'}
                    filterFunction={this.filterPrice}
                    filterElement={this.renderReservationPriceFilter()}
                    body={this.priceBodyTemplate}
                    header={__('Price', 'thebooking')}
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

    filterReservations = () => {
        let filtered = this.props.reservations.map(res => {
            res.meta.TBKG_INTERNAL = {
                day : globals.formatDate(toDate(res.start)),
                slot: res.start + res.serviceId
            }
            return res;
        });

        if (!this.state.showPast) {
            return filtered.filter(res => {
                return isFuture(toDate(res.start));
            })
        }
        return filtered;
    }

    getColumnsToDisplay = () => {
        const defaultColumns = [
            'selector', 'expander', 'service', 'customer', 'startDate', 'status'
        ];
        if (tbkCommon.modules.includes('price')) {
            defaultColumns.push('price')
        }

        /**
         * Actions must be the last column
         */
        defaultColumns.push('actions');

        const columns = this.props.displayedColumns ? this.props.displayedColumns : defaultColumns
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
                    sortField={'dateOfReservation'}
                    sortOrder={this.state.showPast ? 1 : -1}
                    currentPageReportTemplate={sprintf(__('Showing %1$s to %2$s of %3$s reservations', 'thebooking'), '{first}', '{last}', '{totalRecords}')}
                    rowsPerPageOptions={[10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    expandedRows={this.state.expandedRows as unknown as any[]}
                    header={this.props.showHeader && this.renderHeader()}
                    value={this.filterReservations()}
                    selection={this.state.selected}
                    rowGroupMode={this.state.groupByDate ? 'subheader' : ''}
                    groupField={'meta.TBKG_INTERNAL.day'}
                    rowGroupHeaderTemplate={(res: ReservationRecordBackend) => {
                        return (
                            globals.formatDate(toDate(res.start), {weekday: 'long', month: 'long', day: 'numeric'})
                        )
                    }}
                    rowGroupFooterTemplate={(res: ReservationRecordBackend) => {
                        return (
                            ''
                        )
                    }}
                    selectionMode={'checkbox'}
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
                        <Skeleton width="359px" height="350px"/>
                        <Skeleton width="359px" height="35px" className={'p-mt-3'}/>
                    </div>
                </OverlayPanel>
            </div>
        )
    }
}

export default ReservationsTable;