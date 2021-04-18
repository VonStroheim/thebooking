// @ts-ignore
import styles from './ReservationDetails.css';
import React from "react";
import {toDate} from 'date-fns-tz';
import {differenceInMinutes} from 'date-fns';
import {Panel} from 'primereact/panel';
import {Button} from 'primereact/button';
import {Dropdown} from 'primereact/dropdown';
import {InputText} from 'primereact/inputtext';
import {Checkbox} from 'primereact/checkbox';
import {Column} from 'primereact/column';
import {DataTable} from 'primereact/datatable';
import globals from '../../globals';
import {ReservationRecordBackend, tbkCommonB} from "../../typedefs";
import LocationsDropdown from "./LocationsDropdown";
// @ts-ignore
import tableStyles from "./DataTable.css";

declare const tbkCommon: tbkCommonB;
declare const lodash: any;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface ReservationDetailsProps {
    item: ReservationRecordBackend,
    isBusy: boolean,

    onUpdate(data: any): any
}

interface ReservationDetailsState {
    bookingData: {
        [key: string]: any
    }
}

export default class ReservationDetails extends React.Component<ReservationDetailsProps, ReservationDetailsState> {

    constructor(props: ReservationDetailsProps) {
        super(props);

        this.state = {
            bookingData: {}
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
                            location: e.value
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
                if (data.value === null) {
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

    render() {
        const data = this.props.item;
        const bookingData = [];

        const serviceExpectedFields = tbkCommon.services[this.props.item.serviceId].meta.reservationForm.elements;
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

        const generalDetails = [
            {
                'label'       : __('Booking ID', 'thebooking'),
                'value'       : data.uid,
                'propertyType': 'string'
            },
            {
                'label'       : __('Date and time', 'thebooking'),
                'value'       : toDate(data.start),
                'propertyType': 'dateTime'
            },
            {
                'label'       : __('Date and time (end)', 'thebooking'),
                'value'       : toDate(data.end),
                'propertyType': 'dateTime'
            },
            {
                'label'       : __('Duration', 'thebooking'),
                'value'       : globals.minutesToDhms(differenceInMinutes(toDate(data.end), toDate(data.start))),
                'propertyType': 'string'
            },
            {
                'label'       : __('Submit date', 'thebooking'),
                'value'       : toDate(data.created * 1000),
                'propertyType': 'dateTime'
            }
        ]

        if ('location' in data.meta) {
            generalDetails.push({
                'label'       : __('Location', 'thebooking'),
                'value'       : data.meta.location,
                'propertyType': 'LocationsDropdown'
            })
        }

        if ('user_ip' in data.meta) {
            generalDetails.push({
                'label'       : __('User IP', 'thebooking'),
                'value'       : data.meta.user_ip,
                'propertyType': 'string'
            })
        }

        return (
            <div className={styles.reservationDetails + ' p-grid'}>
                <div className={'p-col-12 p-md-12 p-lg-12 p-xl-6'}>
                    <Panel header={__('General details', 'thebooking')} className={styles.panelWithTable}>
                        <DataTable autoLayout={false} value={generalDetails}>
                            <Column field={'label'}/>
                            <Column field={'value'} body={this.propertyTemplate} className={styles.propertyValue}/>
                        </DataTable>
                    </Panel>
                </div>
                {bookingData.length > 0 && (
                    <div className={'p-col-12 p-md-12 p-lg-12 p-xl-6'}>
                        <Panel header={__('Reservation data', 'thebooking')} className={styles.panelWithTable}>

                            <DataTable autoLayout={false} value={bookingDataRows}>
                                <Column field={'label'}/>
                                <Column field={'value'} body={this.propertyTemplate} className={styles.propertyValue}/>
                            </DataTable>
                            <div className={'p-d-flex ' + styles.saveProperties}>
                                <Button
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
                                        this.props.onUpdate(toUpdate)
                                    }}
                                />
                            </div>

                        </Panel>
                    </div>
                )}
            </div>
        );
    }

}