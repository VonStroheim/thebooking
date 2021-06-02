// @ts-ignore
import styles from './ReservationDetails.css';
import React from "react";
import {toDate} from 'date-fns-tz';
import {differenceInMinutes} from 'date-fns';
import {Button} from 'primereact/button';
import {Dropdown} from 'primereact/dropdown';
import {InputText} from 'primereact/inputtext';
import {Checkbox} from 'primereact/checkbox';
import {Column} from 'primereact/column';
import {DataTable} from 'primereact/datatable';
import globals from '../../globals';
import {CustomerBackendRecord, ReservationRecordBackend, tbkCommonB} from "../../typedefs";
import LocationsDropdown from "./LocationsDropdown";
// @ts-ignore
import tableStyles from "./DataTable.css";
import {TabMenu} from "primereact/tabmenu";
import classNames from "classnames";
import {Card} from "primereact/card";

declare const tbkCommon: tbkCommonB;
declare const lodash: any;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface ReservationDetailsProps {
    item: ReservationRecordBackend,
    isBusy: boolean,

    onUpdate(...props: any): any,
}

interface ReservationDetailsState {
    bookingData: {
        [key: string]: any
    },
    activeTab: string
}

export default class ReservationDetails extends React.Component<ReservationDetailsProps, ReservationDetailsState> {

    constructor(props: ReservationDetailsProps) {
        super(props);

        this.state = {
            bookingData: {},
            activeTab  : 'general'
        }

    }

    propertyTemplate = (data: any) => {
        let selected;
        switch (data.propertyType) {
            case 'string':
                return data.value;
            case 'dateTime':
                return (
                    <div className={styles.detailsRecord}>
                                <span>
                                    {globals.formatDate(data.value)}
                                </span>
                        <span className={tableStyles.tableCellDescription}>
                                    {globals.formatTime(data.value)}
                                </span>
                    </div>
                )
            case 'LocationsDropdown':
                selected = (data.value in tbkCommon.locations) ? data.value : null;
                return <LocationsDropdown
                    locations={tbkCommon.locations}
                    selected={selected}
                    onChange={(e) => {
                        this.props.onUpdate({
                            type   : 'SAVE_RESERVATION_SETTINGS',
                            payload: {
                                settings: {
                                    location: e.value
                                },
                                id      : this.props.item.uid
                            }
                        })
                    }}
                />
            case 'text':
            case 'number':
                return (
                    <InputText type={data.propertyType} value={data.value} onChange={(e: any) => {
                        this.setState({
                            bookingData: {
                                ...this.state.bookingData,
                                ...{
                                    ['meta::' + data.propertyId]: e.target.value
                                }
                            }
                        })
                    }}/>
                )
            case 'boolean':
                return (
                    <Checkbox
                        checked={data.value}
                        onChange={(e: any) => {
                            this.setState({
                                bookingData: {
                                    ...this.state.bookingData,
                                    ...{
                                        ['meta::' + data.propertyId]: e.checked
                                    }
                                }
                            })
                        }}
                    />
                )
            case 'options':
                const options = tbkCommon.services[this.props.item.serviceId].meta.reservationForm.elements[data.propertyId].options;
                return (
                    <Dropdown
                        value={data.value}
                        options={options}
                        onChange={(e: any) => {
                            this.setState({
                                bookingData: {
                                    ...this.state.bookingData,
                                    ...{
                                        ['meta::' + data.propertyId]: e.value
                                    }
                                }
                            })
                        }}
                    />
                )
            case 'file':
                if (!data.value) {
                    return __('No uploaded file.', 'thebooking')
                }
                return (
                    <Button
                        className={'p-button-text p-button-plain'}
                        icon={'pi pi-download'}
                        label={data.value.url.split('/').pop()}
                        onClick={() => window.open(data.value.url, '_blank')}
                    />
                )
        }
    }

    tinyCal = (date: Date) => {
        return (
            <div className={styles.tinyCal}>
                <div className={styles.tinyCalWeek}>
                    {globals.formatDate(date, {weekday: "short"})}
                </div>
                <div className={styles.tinyCalDay}>
                    {date.getDate()}
                </div>
                <div className={styles.tinyCalMonth}>
                    {globals.formatDate(date, {month: "short"})}
                </div>
            </div>
        )
    }

    customerPicture = (customer: CustomerBackendRecord) => {
        const users = tbkCommon.users.filter(user => {
            return user.ID === customer.wpUserId;
        });
        const avatar = typeof users[0] !== 'undefined' ? users[0].avatar : tbkCommon.pluginUrl + 'Admin/Images/user-placeholder.png';
        return <img style={{borderRadius: '50%'}} width={96} src={avatar} onError={(e: any) => e.target.src = tbkCommon.pluginUrl + 'Admin/Images/user-placeholder.png'}/>
    }

    render() {
        const data = this.props.item;
        const bookingData = [];
        const service = tbkCommon.services[this.props.item.serviceId];

        const customer = tbkCommon.customers[data.customerId];

        const serviceExpectedFields = service.meta.reservationForm.elements;
        for (const [key, value] of Object.entries(serviceExpectedFields)) {
            if (key.startsWith('formField_')) {
                const parsedField: any = {
                    value: '',
                    type : value.type,
                    label: value.label
                }
                bookingData.push({
                    id   : key,
                    value: parsedField
                })
            }
        }

        for (const [key, value] of Object.entries(data.meta)) {
            if (typeof key === 'string') {
                if (key.startsWith('formField_') && typeof value !== 'string') {
                    const found = bookingData.find(obj => {
                        return obj.id === key;
                    });
                    if (found) {
                        found.value = (typeof this.state.bookingData['meta::' + key] !== 'undefined')
                            ? {...value, ...{value: this.state.bookingData['meta::' + key]}}
                            : value
                    }
                }
            }
        }

        const bookingDataRows = bookingData.map(record => {
            return {
                'label'       : record.value.label,
                'value'       : record.value.value,
                'propertyType': record.value.type,
                'propertyId'  : record.id
            }
        })

        return (
            <>
                <div className={styles.reservationDetails + ' p-grid'}>
                    <div className="p-col-fixed" style={{width: '150px', padding: '2rem 0 0 0.5rem'}}>
                        {this.tinyCal(toDate(data.start))}
                    </div>
                    <div className={'p-col'}>
                        <div className={classNames(styles.header, 'p-mb-5')}>
                            <h2>{service.name}</h2>
                            <h1>
                                {globals.formatDate(toDate(data.start), {weekday: 'short', month: 'long', day: 'numeric'})}
                                <span className={styles.times}>
                                    {globals.formatTime(toDate(data.start))} - {globals.formatTime(toDate(data.end))}
                                </span>
                            </h1>
                            <div className={classNames([styles.subInfo, 'status' + data.status])}>
                                <i className="pi pi-circle-on p-mr-2"/>
                                {tbkCommon.statuses[data.status]}
                            </div>
                            <div className={styles.subInfo}>
                                <i className="pi pi-user p-mr-2"/>
                                {customer.name}
                            </div>
                            <div className={styles.subInfo}>
                                <i className="pi pi-clock p-mr-2"/>
                                {globals.minutesToDhms(differenceInMinutes(toDate(data.end), toDate(data.start)))}
                            </div>
                        </div>
                    </div>
                </div>
                <TabMenu className={'p-mb-6'} model={
                    [
                        {
                            label  : __('General', 'thebooking'),
                            command: () => {
                                this.setState({activeTab: 'general'})
                            }
                        },
                        {
                            label   : __('Reservation data', 'thebooking'),
                            disabled: bookingData.length < 1,
                            command : () => {
                                this.setState({activeTab: 'res_data'})
                            }
                        },
                        {
                            label  : __('Customer', 'thebooking'),
                            command: () => {
                                this.setState({activeTab: 'customer'})
                            }
                        }
                    ]
                }/>

                {this.state.activeTab === 'general' && (
                    <div className={classNames(styles.reservationDetails, ' p-grid', 'p-mb-6')}>
                        <div className={'p-col-12 p-md-12 p-lg-12 p-xl-6'}>
                            <Card
                                className={classNames(styles.detailsCard, 'p-mb-4')}
                                title={__('Details', 'thebooking')}
                            >
                                <ul className={styles.cardListEntries}>

                                    <li className={styles.cardListEntry}>
                                        <label>
                                            {__('Submit date', 'thebooking')}
                                        </label>
                                        <span className={styles.cardListEntryValue}>
                                        {globals.formatDate(toDate(data.created * 1000), {weekday: 'short', month: 'long', day: 'numeric'})}
                                            <span>, {globals.formatTime(toDate(data.created * 1000))}</span>
                                    </span>
                                    </li>

                                    {'user_ip' in data.meta && (
                                        <li className={styles.cardListEntry}>
                                            <label>
                                                {__('User IP', 'thebooking')}
                                            </label>
                                            <span className={styles.cardListEntryValue}>
                                            {data.meta.user_ip}
                                        </span>
                                        </li>
                                    )}

                                </ul>
                            </Card>

                            {'location' in data.meta && (!data.meta.zoomMeetingId || !tbkCommon.modules.includes('zoom')) && (
                                <Card
                                    className={classNames(styles.locationCard, 'p-mb-4')}
                                    title={__('Location', 'thebooking')}
                                >
                                    <LocationsDropdown
                                        locations={tbkCommon.locations}
                                        selected={(data.meta.location in tbkCommon.locations) ? data.meta.location : null}
                                        onChange={(e) => {
                                            this.props.onUpdate({
                                                type   : 'SAVE_RESERVATION_SETTINGS',
                                                payload: {
                                                    settings: {
                                                        location: e.value
                                                    },
                                                    id      : data.uid
                                                }
                                            })
                                        }}
                                    />
                                </Card>
                            )}

                            {data.meta.zoomMeetingId && tbkCommon.modules.includes('zoom') && (
                                <Card
                                    className={classNames(styles.zoomCard, 'p-mb-4')}
                                    title={__('Zoom meeting', 'thebooking')}
                                    subTitle={data.meta.zoomMeetingId.status === 'waiting'
                                        ? <span className={styles.waiting}>{__('Waiting', 'thebooking')}</span>
                                        : <span className={styles.started}>{__('Started', 'thebooking')}</span>}
                                >
                                    <ul className={styles.cardListEntries}>
                                        <li className={styles.cardListEntry}>
                                            <label>
                                                {__('Start meeting URL', 'thebooking')}
                                            </label>
                                            <span className={styles.cardListEntryValue}>
                                                <a href={data.meta.zoomMeetingId.start_url}>{__('Start the meeting', 'thebooking')}</a>
                                        </span>
                                        </li>
                                        <li className={styles.cardListEntry}>
                                            <label>
                                                {__('Join meeting URL', 'thebooking')}
                                            </label>
                                            <span className={styles.cardListEntryValue}>
                                            <a href={data.meta.zoomMeetingId.join_url}>{__('Join the meeting', 'thebooking')}</a>
                                        </span>
                                        </li>
                                        <li className={styles.cardListEntry}>
                                            <label>
                                                {__('Password', 'thebooking')}
                                            </label>
                                            <span className={styles.cardListEntryValue}>
                                            {data.meta.zoomMeetingId.password}
                                        </span>
                                        </li>
                                    </ul>
                                </Card>
                            )}

                            {data.meta.gcal_meet_link && (
                                <Card
                                    className={classNames(styles.zoomCard, 'p-mb-4')}
                                    title={__('Google Meet', 'thebooking')}
                                >
                                    <ul className={styles.cardListEntries}>
                                        <li className={styles.cardListEntry}>
                                            <label>
                                                {__('Join meeting URL', 'thebooking')}
                                            </label>
                                            <span className={styles.cardListEntryValue}>
                                                <a href={data.meta.gcal_meet_link}>{__('Join the meeting', 'thebooking')}</a>
                                        </span>
                                        </li>
                                    </ul>
                                </Card>
                            )}

                        </div>
                        {service.meta.hasPrice && (
                            <div className={'p-col-12 p-md-12 p-lg-12 p-xl-6'}>
                                <Card
                                    className={styles.priceCard}
                                    title={service.meta.price + ('price_currency' in tbkCommon.settings && (' ' + tbkCommon.settings.price_currency))}
                                    subTitle={
                                        data.meta.isPaid
                                            ? <span className={styles.paid}>{__('Paid', 'thebooking')}</span>
                                            : <span className={styles.notPaid}>{__('Not paid', 'thebooking')}</span>
                                    }
                                    footer={
                                        <>
                                            <Button label={
                                                data.meta.isPaid
                                                    ? __('Mark as not paid', 'thebooking')
                                                    : __('Mark as paid', 'thebooking')
                                            } className="p-button-text"
                                                    onClick={() => {
                                                        this.props.onUpdate({
                                                            type   : 'CHANGE_PAYMENT_STATUS',
                                                            payload: {
                                                                status: !data.meta.isPaid,
                                                                id    : data.uid
                                                            }
                                                        })
                                                    }}
                                            />
                                        </>
                                    }
                                >
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {this.state.activeTab === 'res_data' && bookingData.length > 0 && (
                    <div className={classNames(styles.reservationDetails, ' p-grid', 'p-mb-6')}>
                        <div className={'p-col-12 p-md-12 p-lg-12 p-xl-6'}>
                            <Card
                                className={styles.cardWithTable}
                                title={__('Form', 'thebooking')}
                                footer={<Button
                                    label={__('Save', 'thebooking')}
                                    className={'p-ml-auto'}
                                    disabled={this.props.isBusy || lodash.isEmpty(this.state.bookingData)}
                                    onClick={() => {
                                        const toUpdate: any = {};
                                        for (const [key, value] of Object.entries(this.state.bookingData)) {
                                            toUpdate[key] = {
                                                type : 'UserInput',
                                                value: {
                                                    ...this.props.item.meta[key.replace('meta::', '')],
                                                    ...{value: value}
                                                }
                                            }
                                        }
                                        console.log(toUpdate);
                                        this.props.onUpdate({
                                            type   : 'SAVE_RESERVATION_SETTINGS',
                                            payload: {
                                                settings: toUpdate,
                                                id      : data.uid
                                            }
                                        })
                                    }}
                                />}
                            >
                                <DataTable autoLayout={false} value={bookingDataRows}>
                                    <Column field={'label'}/>
                                    <Column field={'value'} body={this.propertyTemplate} className={styles.propertyValue}/>
                                </DataTable>
                            </Card>
                        </div>
                    </div>
                )}

                {this.state.activeTab === 'customer' && bookingData.length > 0 && (
                    <div className={classNames(styles.reservationDetails, ' p-grid', 'p-mb-6')}>
                        <div className={'p-col-12 p-md-12 p-lg-12 p-xl-6'}>
                            <Card
                                title={customer.name}
                                subTitle={customer.email}
                                className={styles.cardCustomer}
                            >
                                <div className={classNames(' p-grid')}>
                                    <div className={'p-col-fixed'} style={{width: '150px'}}>
                                        {this.customerPicture(customer)}
                                    </div>
                                    <div className={'p-col'}>
                                        <ul className={styles.cardListEntries}>

                                            <li className={styles.cardListEntry}>
                                                <label>
                                                    {__('Phone', 'thebooking')}
                                                </label>
                                                <span className={styles.cardListEntryValue}>
                                                    {customer.phone || '-'}
                                                </span>
                                            </li>

                                            <li className={styles.cardListEntry}>
                                                <label>
                                                    {__('Timezone', 'thebooking')}
                                                </label>
                                                <span className={styles.cardListEntryValue}>
                                                    {customer.timezone || '-'}
                                                </span>
                                            </li>

                                            <li className={styles.cardListEntry}>
                                                <label>
                                                    {__('Total reservations', 'thebooking')}
                                                </label>
                                                <span className={styles.cardListEntryValue}>
                                                    {tbkCommon.reservations.filter((res) => {
                                                        return res.customerId === customer.id
                                                    }).length}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </>
        );
    }

}