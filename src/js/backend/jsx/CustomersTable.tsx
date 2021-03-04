import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {Button} from 'primereact/button';
import {Dialog} from 'primereact/dialog';
// @ts-ignore
import {confirmPopup} from 'primereact/confirmpopup';
import {ProgressBar} from 'primereact/progressbar';
import PhoneInput from 'react-phone-input-2';
import React from "react";
// @ts-ignore
import styles from './DataTable.css';
import {CustomerBackendRecord, SettingPanelBackend, StateAction, tbkCommonB} from "../../typedefs";
import CustomersDropdown from "./CustomersDropdown";
import globals from "../../globals";
import {ExportToCsv} from "export-to-csv";
import ReservationsTable from "./ReservationsTable";

declare const tbkCommon: tbkCommonB;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface SProps {
    isBusy: boolean,
    currentHash: string,

    renderSettingPanel(panel: SettingPanelBackend, dataSource: CustomerBackendRecord, action: { type: string, id: number }): any,

    onUpdate(action: StateAction): any
}

interface SState {
    selected: CustomerBackendRecord[],
    globalFilter: null,
    displayNewDialog: boolean,
    expandedRows: { [key: string]: boolean },
    current: number | null,
    newCustomerData: newCustomerData
}

interface newCustomerData {
    name: string,
    email: string,
    phone: string,
    birthday?: string,
    wpUserId: number
}

const newCustomerReducer = (state: SState, action: StateAction) => {
    switch (action.type) {
        case 'UPDATE':
            return {
                ...state, newCustomerData: {
                    ...state.newCustomerData,
                    ...action.payload
                }
            }
        default:
            return state;
    }
}
const redux = globals.combineReducers({
    newCustomerReducer
});

export default class CustomersTable extends React.Component<SProps, SState> {
    private dt: any;

    constructor(props: SProps) {
        super(props);

        this.state = {
            selected        : [],
            globalFilter    : null,
            displayNewDialog: false,
            expandedRows    : null,
            current         : null,
            newCustomerData : {
                name    : '',
                email   : '',
                phone   : '',
                birthday: '',
                wpUserId: 0
            }
        }

    }

    /**
     * https://github.com/alexcaza/export-to-csv#readme
     */
    exportCsv = () => {

        let customers = JSON.parse(JSON.stringify(this.state.selected.length > 0 ? this.state.selected : Object.values(tbkCommon.customers)));

        const csvExporter = new ExportToCsv({
            fieldSeparator  : ',',
            quoteStrings    : '"',
            decimalSeparator: '.',
            showLabels      : true,
            filename        : __('Customers', 'thebooking'),
            useTextFile     : false,
            useKeysAsHeaders: true,
        });
        csvExporter.generateCsv(customers);
    }

    renderHeader() {
        return (
            <div className={styles.tableHeader}>
                <div>
                    <Button label={__('New customer', 'thebooking')}
                            icon={'pi pi-plus'}
                            className={styles.newResourceButton}
                            onClick={(e) => this.setState({displayNewDialog: true})}
                    />
                    <Button
                        className={'p-button-secondary'}
                        icon={'pi pi-download'}
                        onClick={this.exportCsv}
                        label={this.state.selected.length > 0 ? __('Export selected', 'thebooking') + ' (' + this.state.selected.length + ')' : __('Export all', 'thebooking')}
                    />
                </div>
                <div>
                    <span className="p-input-icon-left">
                    <i className="pi pi-search"/>
                    <InputText type="search"
                               onInput={(e: any) => this.setState({globalFilter: e.target.value})}
                               placeholder={__('Search all', 'thebooking')}/>
                    </span>
                </div>
            </div>
        );
    }

    newCustomerDialog = () => {

        const customerData = this.state.newCustomerData;
        const id = this.state.current;

        const takenUsers: number[] = [];
        Object.values(tbkCommon.customers).forEach(customer => {
            if (customer.wpUserId !== 0 && customer.id !== id) {
                takenUsers.push(customer.wpUserId);
            }

        })
        const users: { [key: number]: CustomerBackendRecord } = {};
        tbkCommon.users.forEach(user => {
            if (!takenUsers.includes(user.ID)) {
                users[user.ID] = {
                    name    : user.display_name,
                    email   : user.user_email,
                    phone   : '',
                    wpUserId: user.ID,
                    birthday: null,
                    id      : user.ID
                }
            }
        })

        return (
            <Dialog
                contentStyle={{
                    overflowY: 'visible'
                }}
                header={id ? tbkCommon.customers[id].name : __('New customer', 'thebooking')}
                baseZIndex={100000}
                onHide={() => this.setState({
                    displayNewDialog: false,
                    current         : null,
                    newCustomerData : {
                        name    : '',
                        email   : '',
                        phone   : '',
                        birthday: '',
                        wpUserId: 0
                    }
                })}
                visible={this.state.displayNewDialog}
                footer={
                    <div>
                        {!this.props.isBusy && (
                            <div>
                                <Button label={__('Cancel', 'thebooking')}
                                        icon="pi pi-times"
                                        onClick={() => this.setState({displayNewDialog: false})}
                                        className="p-button-text"/>
                                <Button label={id ? __('Save', 'thebooking') : __('Create customer', 'thebooking')}
                                        icon="pi pi-check"
                                        disabled={!customerData.name.length || !customerData.email.length}
                                        onClick={id ? this.editCustomer : this.createCustomer}
                                        autoFocus/>
                            </div>
                        )}
                        {this.props.isBusy && (
                            <ProgressBar mode="indeterminate"/>
                        )}
                    </div>
                }>
                <div className={'p-fluid'}>
                    <div className={'p-field'}>
                        <label>{__('Map the customer to a WordPress user', 'thebooking')}</label>
                        <CustomersDropdown
                            customers={{
                                ...{
                                    0       : {
                                        name    : __('Do not map the customer.', 'thebooking'),
                                        email   : '',
                                        phone   : '',
                                        wpUserId: 0,
                                        birthday: null,
                                        id      : 0
                                    },
                                    99999999: {
                                        name    : __('Create a new WordPress user.', 'thebooking'),
                                        email   : '',
                                        phone   : '',
                                        wpUserId: 0,
                                        birthday: null,
                                        id      : -1
                                    }
                                }, ...users
                            }}
                            onChange={(e) => {
                                const payload: { [key: string]: any } = {
                                    wpUserId: e.value
                                }
                                if (e.value > 0) {
                                    payload.name = users[e.value].name;
                                    payload.email = users[e.value].email;
                                    payload.phone = users[e.value].phone;
                                }
                                this.setState(redux([{type: 'UPDATE', payload: payload}], this.state))
                            }}
                            selected={customerData.wpUserId}
                        />
                    </div>
                    <div className={'p-field'}>
                        <label htmlFor={'newCustomerName'}>{__('Name', 'thebooking')} *</label>
                        <InputText id={'newCustomerName'} required={true} type={'text'}
                                   disabled={customerData.wpUserId > 0}
                                   value={customerData.name}
                                   onChange={(e: any) => {
                                       this.setState(redux([{
                                           type: 'UPDATE', payload: {
                                               name: e.target.value
                                           }
                                       }], this.state))
                                   }}/>
                    </div>
                    <div className={'p-field'}>
                        <label htmlFor={'newCustomerEmail'}>{__('Email', 'thebooking')} *</label>
                        <InputText id={'newCustomerEmail'} required={true}
                                   disabled={customerData.wpUserId > 0}
                                   type={'text'}
                                   value={customerData.email}
                                   onChange={(e: any) => {
                                       this.setState(redux([{
                                           type: 'UPDATE', payload: {
                                               email: e.target.value.trim()
                                           }
                                       }], this.state))
                                   }}/>
                    </div>
                    <div className={'p-field'}>
                        <label htmlFor={'newCustomerPhone'}>{__('Phone', 'thebooking')}</label>
                        <PhoneInput
                            country={tbkCommon.i18n.locale.slice(-2)}
                            inputProps={{id: 'newCustomerPhone'}}
                            specialLabel={null}
                            value={customerData.phone}
                            onChange={(phone: any) => {
                                this.setState(redux([{
                                    type: 'UPDATE', payload: {
                                        phone: phone
                                    }
                                }], this.state))
                            }}
                        />
                    </div>
                </div>
            </Dialog>
        );
    }

    confirm = (event: any, callback: any) => {
        confirmPopup({
            target : event.currentTarget,
            message: __('Are you sure you want to proceed?', 'thebooking'),
            header : __('Confirmation', 'thebooking'),
            icon   : 'pi pi-exclamation-triangle',
            accept : callback,
            reject : null
        })
    }

    actionsBodyTemplate = (customer: CustomerBackendRecord) => {
        const customerReservations = tbkCommon.reservations.filter(reservation => {
            return reservation.customerId === customer.id;
        })
        return (
            <>
                <Button
                    icon={'pi pi-trash'}
                    className={'p-button-rounded p-button-text p-button-danger'}
                    disabled={this.props.isBusy || customerReservations.length > 0}
                    onClick={(event) => this.confirm(event, () => this.deleteCustomer(customer.id))}
                />
                <Button
                    icon={'pi pi-cog'}
                    className={'p-button-rounded p-button-text'}
                    disabled={this.props.isBusy}
                    onClick={() => this.setState({
                        newCustomerData : {
                            name    : customer.name,
                            email   : customer.email,
                            phone   : customer.phone,
                            wpUserId: customer.wpUserId,
                            birthday: customer.birthday
                        },
                        displayNewDialog: true,
                        current         : customer.id
                    })}
                />
            </>
        )
    }

    deleteCustomer = (customerId: number) => {
        this.props.onUpdate({
            type   : 'DELETE_CUSTOMER',
            payload: customerId
        });
        this.setState({
            selected: []
        })
    }

    editCustomer = () => {
        this.props.onUpdate({
            type   : 'EDIT_CUSTOMER',
            payload: {
                id     : this.state.current,
                newData: this.state.newCustomerData
            }
        });
        this.setState({
            displayNewDialog: false,
            newCustomerData : {
                name    : '',
                email   : '',
                phone   : '',
                birthday: '',
                wpUserId: 0
            }
        })
    }

    createCustomer = () => {
        this.props.onUpdate({
            type   : 'CREATE_CUSTOMER',
            payload: this.state.newCustomerData
        });
        this.setState({
            displayNewDialog: false,
            newCustomerData : {
                name    : '',
                email   : '',
                phone   : '',
                birthday: '',
                wpUserId: 0
            }
        })
    }

    onSelection = (e: any) => {
        this.setState({selected: e.value});
    }

    sortFunction = (e: any) => {
        const value = Object.values(tbkCommon.customers);
        switch (e.field) {
            case 'name':
                value.sort((a, b) => {
                    if (a.name === b.name) return 0;
                    return e.order * a.name.localeCompare(b.name);
                })
                break;
            case 'email':
                value.sort((a, b) => {
                    if (a.email === b.email) return 0;
                    return e.order * a.email.localeCompare(b.email);
                })
                break;
            case 'phone':
                value.sort((a, b) => {
                    if (a.phone === b.phone) return 0;
                    return e.order * a.phone.localeCompare(b.phone);
                })
                break;
        }
        return value;
    }

    phoneBodyTemplate = (customer: CustomerBackendRecord) => {
        return <div className={styles.readOnlyPhone}>
            <PhoneInput
                country={tbkCommon.i18n.locale.slice(-2)}
                disabled={true}
                specialLabel={null}
                value={customer.phone}
                placeholder={''}
            />
        </div>
    }

    nameBodyTemplate = (customer: CustomerBackendRecord) => {
        const users = tbkCommon.users.filter(user => {
            return user.ID === customer.wpUserId;
        });
        const avatar = typeof users[0] !== 'undefined' ? users[0].avatar : tbkCommon.pluginUrl + 'Admin/Images/user-placeholder.png';
        return (
            <div className={styles.nameItem}>
                <div className={styles.nameItemAvatar}>
                    <img src={avatar}
                         onError={(e: any) => e.target.src = tbkCommon.pluginUrl + 'Admin/Images/user-placeholder.png'
                         }/>
                </div>
                <div>
                    {customer.name}
                </div>
            </div>
        )
    }

    prepareReservations = (data: CustomerBackendRecord) => {
        return tbkCommon.reservations
            .filter(reservation => {
                return reservation.customerId === data.id
            })
            .sort((a, b) => {
                if (a.start === b.start) return 0;
                if (a.start < b.start) {
                    return 1;
                } else {
                    return -1;
                }
            })
    }

    rowExpansionTemplate = (data: CustomerBackendRecord) => {
        return <ReservationsTable
            reservations={this.prepareReservations(data)}
            onUpdate={this.props.onUpdate}
            isBusy={this.props.isBusy}
            showFilters={false}
            showHeader={false}
            displayedColumns={['expander', 'service', 'startDate', 'status', 'actions']}
        />;
    }

    render() {
        return this.renderTable();
    }

    renderTable = () => {
        return (
            <div className={styles.dataTable}>
                <DataTable
                    ref={(el) => this.dt = el}
                    paginator
                    rows={25}
                    currentPageReportTemplate={sprintf(__('Showing %1$s to %2$s of %3$s customers', 'thebooking'), '{first}', '{last}', '{totalRecords}')}
                    expandedRows={this.state.expandedRows as unknown as any[]}
                    rowsPerPageOptions={[10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    globalFilter={this.state.globalFilter}
                    header={this.renderHeader()}
                    value={Object.values(tbkCommon.customers)}
                    selection={this.state.selected}
                    onSelectionChange={this.onSelection}
                    rowExpansionTemplate={this.rowExpansionTemplate}
                    onRowToggle={e => this.setState({expandedRows: e.data as any})}
                    loading={this.props.isBusy}
                >
                    <Column selectionMode={'multiple'} style={{width: '3em'}}/>
                    <Column expander style={{width: '3em'}}/>
                    <Column
                        sortFunction={this.sortFunction}
                        field={'name'}
                        sortable
                        header={__('Name', 'thebooking')}
                        body={this.nameBodyTemplate}
                    />
                    <Column
                        sortFunction={this.sortFunction}
                        field={'email'}
                        sortable
                        header={__('Email', 'thebooking')}
                    />
                    <Column
                        sortFunction={this.sortFunction}
                        field={'phone'}
                        sortable
                        header={__('Phone', 'thebooking')}
                        body={this.phoneBodyTemplate}
                    />
                    <Column
                        body={this.actionsBodyTemplate}
                    />
                </DataTable>
                {this.newCustomerDialog()}
            </div>
        )
    }

}