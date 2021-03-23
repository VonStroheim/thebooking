import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {Button} from 'primereact/button';
import {InputSwitch} from 'primereact/inputswitch';
import {Dialog} from 'primereact/dialog';
import {SplitButton} from 'primereact/splitbutton';
import {ProgressBar} from 'primereact/progressbar';
import SideMenu from './SideMenu';
import React from "react";
// @ts-ignore
import styles from './ServicesTable.css';
// @ts-ignore
import tableStyles from './DataTable.css';
import {ServiceRecordBackend, SettingPanelBackend, StateAction, tbkCommonB} from "../../typedefs";
// @ts-ignore
import {confirmPopup} from 'primereact/confirmpopup';
import BigAvatar from "./BigAvatar";

declare const tbkCommon: tbkCommonB;
declare const wp: any;
declare const _: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface SProps {
    isBusy: boolean,
    panels: SettingPanelBackend[],
    currentHash: string,

    renderSettingPanel(panel: SettingPanelBackend, dataSource: ServiceRecordBackend, action: { type: string, id: string }): any,

    onUpdate(action: StateAction): any
}

interface SState {
    selected: ServiceRecordBackend[],
    globalFilter: null,
    displayNewDialog: boolean,
    current: string | null,
    newServiceData: newServiceData
}

interface newServiceData {
    name: string
}

class ServicesTable extends React.Component<SProps, SState> {
    private dt: any;

    constructor(props: SProps) {
        super(props);

        this.state = {
            selected        : [],
            globalFilter    : null,
            displayNewDialog: false,
            current         : null,
            newServiceData  : {
                name: ''
            }
        }

    }

    renderHeader() {
        return (
            <div className={tableStyles.tableHeader}>
                <div>
                    <Button
                        label={__('New service', 'thebooking')}
                        icon={'pi pi-plus'}
                        className={styles.newServiceButton}
                        onClick={(e) => this.setState({displayNewDialog: true})}
                    />
                    <Button
                        className={'p-button-secondary'}
                        icon={'pi pi-trash'}
                        disabled={_.isEmpty(tbkCommon.services)}
                        onClick={
                            (event) => this.confirm(
                                event,
                                () => this.deleteServices(
                                    this.state.selected.length > 0 ? this.state.selected : Object.values(tbkCommon.services)
                                )
                            )
                        }
                        label={this.state.selected.length > 0 ? __('Delete selected', 'thebooking') + ' (' + this.state.selected.length + ')' : __('Delete all', 'thebooking')}
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

    confirm = (event: any, callback: any) => {
        confirmPopup({
            target : event.currentTarget,
            message: __('Are you sure? All the reservations made for this service will be removed. The action cannot be undone.', 'thebooking'),
            icon   : 'pi pi-exclamation-triangle',
            accept : callback,
            reject : null
        })
    }

    createService = () => {
        this.props.onUpdate({
            type   : 'CREATE_SERVICE',
            payload: this.state.newServiceData
        });
        this.setState({
            displayNewDialog: false,
            newServiceData  : {
                name: '',
            }
        })
    }

    newServiceDialog = () => {

        const serviceData = this.state.newServiceData;
        let nameTaken = false;
        Object.values(tbkCommon.services).forEach(service => {
            if (serviceData.name.length && serviceData.name.toLocaleLowerCase() === service.name.toLocaleLowerCase()) {
                nameTaken = true;
            }
        })

        return (
            <Dialog
                contentStyle={{
                    overflowY: 'visible'
                }}
                header={__('New service', 'thebooking')}
                baseZIndex={100000}
                onHide={() => this.setState({
                    displayNewDialog: false,
                    newServiceData  : {
                        name: '',
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
                                <Button label={nameTaken ? __('Name already used', 'thebooking') : __('Create service', 'thebooking')}
                                        icon="pi pi-check"
                                        disabled={!serviceData.name.length || nameTaken}
                                        onClick={this.createService}
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
                        <label>{__('Service name', 'thebooking')} *</label>
                        <InputText id={'newServiceName'} required={true} type={'text'}
                                   value={serviceData.name}
                                   onChange={(e: any) => {
                                       this.setState({
                                           newServiceData: {
                                               name: e.target.value,
                                           }
                                       })
                                   }}/>
                    </div>
                </div>
            </Dialog>
        );
    }

    actionsBodyTemplate = (service: ServiceRecordBackend) => {
        return (
            <>
                <Button
                    icon={'pi pi-trash'}
                    tooltip={__('Delete', 'thebooking')}
                    className={'p-button-rounded p-button-text p-button-danger'}
                    disabled={this.props.isBusy}
                    onClick={(event) => this.confirm(event, () => this.deleteServices([service]))}
                />
                <Button
                    icon={'pi pi-cog'}
                    tooltip={__('Settings', 'thebooking')}
                    className={'p-button-rounded p-button-text p-button-plain'}
                    disabled={this.props.isBusy}
                    onClick={() => this.setState({current: service.uid})}/>
            </>
        )
    }

    deleteServices = (services: ServiceRecordBackend[]) => {
        this.props.onUpdate({
            type   : 'DELETE_SERVICES',
            payload: services.map(service => service.uid)
        });
        this.setState({
            selected: []
        })
    }

    onSelection = (e: any) => {
        this.setState({selected: e.value});
    }

    renderServiceConfig = () => {
        const service = tbkCommon.services[this.state.current];
        const menuItems = this.props.panels.map(panel => {
            return {
                label: panel.panelLabel,
                ref  : panel.panelRef,
                icon : panel.icon
            }
        })
        return (
            <>
                <div>
                    <div className="p-text-center p-pb-4 p-px-2" style={{fontSize: '1.5rem', fontWeight: 600, lineHeight: '1.2'}}>
                        {service.name}
                    </div>
                    <BigAvatar
                        bgColor={service.color}
                        bgImage={service.image}
                        onUpdate={(attachmentID) => this.props.onUpdate({
                            type   : 'SAVE_SERVICE_SETTINGS',
                            payload: {
                                settings: {
                                    image: attachmentID
                                },
                                id      : this.state.current
                            }
                        })}
                    />
                    <Button
                        className={styles.sidebarButton}
                        icon={'pi pi-arrow-left'}
                        iconPos={'left'}
                        label={__('Back to services', 'thebooking')}
                        onClick={() => {
                            window.location.hash = '';
                            this.setState({current: null})
                        }}
                    />
                    <SideMenu items={menuItems}/>
                </div>
                {this.props.panels.map((panel, i) => {
                    if (this.props.currentHash === panel.panelRef || (!this.props.currentHash && i === 0)) {
                        return this.props.renderSettingPanel(panel, service, {type: 'SAVE_SERVICE_SETTINGS', id: this.state.current})
                    }
                })}
            </>
        )
    }

    sortFunction = (e: any) => {
        const value = Object.values(tbkCommon.services);
        switch (e.field) {
            case 'name':
                value.sort((a, b) => {
                    if (a.name === b.name) return 0;
                    return e.order * a.name.localeCompare(b.name);
                })
                break;
        }
        return value;
    }

    activeBodyTemplate = (service: ServiceRecordBackend) => {
        return (
            <InputSwitch
                checked={service.active}
                disabled={this.props.isBusy}
                onChange={(e) => {
                    this.props.onUpdate({
                        type   : 'SAVE_SERVICE_SETTINGS',
                        payload: {
                            id      : service.uid,
                            settings: {
                                service_active: e.value
                            }
                        }
                    })
                }}
            />
        )
    }

    nameBodyTemplate = (service: ServiceRecordBackend) => {
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

    render() {
        if (this.state.current) {
            return this.renderServiceConfig();
        } else {
            return this.renderTable();
        }
    }

    renderTable = () => {
        return (
            <div className={tableStyles.dataTable}>
                <DataTable
                    ref={(el) => this.dt = el}
                    paginator
                    rows={25}
                    currentPageReportTemplate={sprintf(__('Showing %1$s to %2$s of %3$s services', 'thebooking'), '{first}', '{last}', '{totalRecords}')}
                    rowsPerPageOptions={[10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    globalFilter={this.state.globalFilter}
                    header={this.renderHeader()}
                    value={Object.values(tbkCommon.services)}
                    selection={this.state.selected}
                    onSelectionChange={this.onSelection}
                    loading={this.props.isBusy}
                >
                    <Column selectionMode={'multiple'} style={{width: '3em'}}/>
                    <Column
                        sortFunction={this.sortFunction}
                        field={'name'}
                        sortable
                        header={__('Service', 'thebooking')}
                        body={this.nameBodyTemplate}/>
                    <Column
                        field={'active'}
                        header={__('Active', 'thebooking')}
                        body={this.activeBodyTemplate}
                    />
                    <Column
                        body={this.actionsBodyTemplate}
                    />
                </DataTable>
                {this.newServiceDialog()}
            </div>
        )
    }

}

export default ServicesTable;