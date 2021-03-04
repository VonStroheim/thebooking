import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {InputText} from 'primereact/inputtext';
import {Button} from 'primereact/button';
import {InputSwitch} from 'primereact/inputswitch';
import {Dialog} from 'primereact/dialog';
import {ProgressBar} from 'primereact/progressbar';
import React from "react";
// @ts-ignore
import styles from './LocationsTable.css';
// @ts-ignore
import tableStyles from './DataTable.css';
import {ServiceRecordBackend, StateAction, tbkCommonB, Location} from "../../typedefs";
// @ts-ignore
import {confirmPopup} from 'primereact/confirmpopup';

declare const tbkCommon: tbkCommonB;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface SProps {
    isBusy: boolean,

    onUpdate(action: StateAction): any
}

interface SState {
    selected: Location[],
    globalFilter: null,
    displayNewDialog: boolean,
    current: string | null,
    newLocationData: newLocationData
}

interface newLocationData {
    name: string,
    address: string
}

class LocationsTable extends React.Component<SProps, SState> {
    private dt: any;

    constructor(props: SProps) {
        super(props);

        this.state = {
            selected        : [],
            globalFilter    : null,
            displayNewDialog: false,
            current         : null,
            newLocationData : {
                name   : '',
                address: ''
            }
        }

    }

    renderHeader() {
        return (
            <div className={tableStyles.tableHeader}>
                <div>
                    <Button
                        label={__('New location', 'thebooking')}
                        icon={'pi pi-plus'}
                        className={styles.newLocationButton}
                        onClick={(e) => this.setState({displayNewDialog: true})}
                    />
                    <Button
                        className={'p-button-secondary'}
                        icon={'pi pi-trash'}
                        onClick={
                            (event) => this.confirm(
                                event,
                                () => this.deleteLocations(
                                    this.state.selected.length > 0 ? this.state.selected : Object.values(tbkCommon.locations)
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
            message: __('Are you sure you want to proceed?', 'thebooking'),
            header : __('Confirmation', 'thebooking'),
            icon   : 'pi pi-exclamation-triangle',
            accept : callback,
            reject : null
        })
    }

    createLocation = () => {
        this.props.onUpdate({
            type   : 'CREATE_LOCATION',
            payload: this.state.newLocationData
        });
        this.setState({
            displayNewDialog: false,
            newLocationData : {
                name   : '',
                address: '',
            }
        })
    }

    newLocationDialog = () => {

        const locationData = this.state.newLocationData;

        const id = this.state.current;

        let nameTaken = false;
        Object.values(tbkCommon.locations).forEach(location => {
            if (locationData.name.length
                && locationData.name.toLocaleLowerCase() === location.l_name.toLocaleLowerCase()
                && locationData.name.toLocaleLowerCase() !== tbkCommon.locations[id].l_name.toLocaleLowerCase()) {
                nameTaken = true;
            }
        })

        return (
            <Dialog
                contentStyle={{
                    overflowY: 'visible'
                }}
                header={id ? tbkCommon.locations[id].l_name : __('New location', 'thebooking')}
                baseZIndex={100000}
                onHide={() => this.setState({
                    displayNewDialog: false,
                    newLocationData : {
                        name   : '',
                        address: '',
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
                                <Button label={nameTaken ? __('Name already used', 'thebooking') : (id ? __('Save', 'thebooking') : __('Create location', 'thebooking'))}
                                        icon="pi pi-check"
                                        disabled={!locationData.name.length || !locationData.address.length || nameTaken}
                                        onClick={this.createLocation}
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
                        <label>{__('Name', 'thebooking')} *</label>
                        <InputText id={'newLocationName'} required={true} type={'text'}
                                   value={locationData.name}
                                   onChange={(e: any) => {
                                       this.setState({
                                           newLocationData: {
                                               ...this.state.newLocationData,
                                               ...{
                                                   name: e.target.value,
                                               }
                                           }
                                       })
                                   }}/>
                    </div>
                    <div className={'p-field'}>
                        <label>{__('Address', 'thebooking')} *</label>
                        <InputText id={'newLocationName'} required={true} type={'text'}
                                   value={locationData.address}
                                   onChange={(e: any) => {
                                       this.setState({
                                           newLocationData: {
                                               ...this.state.newLocationData,
                                               ...{
                                                   address: e.target.value,
                                               }
                                           }
                                       })
                                   }}/>
                    </div>
                </div>
            </Dialog>
        );
    }

    actionsBodyTemplate = (location: Location) => {
        return (
            <>
                <Button
                    icon={'pi pi-trash'}
                    className={'p-button-rounded p-button-text p-button-danger'}
                    disabled={this.props.isBusy}
                    onClick={(event) => this.confirm(event, () => this.deleteLocations([location]))}
                />
                <Button
                    icon={'pi pi-cog'}
                    className={'p-button-rounded p-button-text'}
                    disabled={this.props.isBusy}
                    onClick={() => this.setState({
                        displayNewDialog: true,
                        current         : location.uid,
                        newLocationData : {
                            name   : location.l_name,
                            address: location.address
                        }
                    })}/>
            </>
        )
    }

    deleteLocations = (locations: Location[]) => {
        this.props.onUpdate({
            type   : 'DELETE_LOCATIONS',
            payload: locations.map(location => location.uid)
        });
        this.setState({
            selected: []
        })
    }

    onSelection = (e: any) => {
        this.setState({selected: e.value});
    }

    sortFunction = (e: any) => {
        const value = Object.values(tbkCommon.locations);
        switch (e.field) {
            case 'l_name':
                value.sort((a, b) => {
                    if (a.l_name === b.l_name) return 0;
                    return e.order * a.l_name.localeCompare(b.l_name);
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

    nameBodyTemplate = (location: Location) => {
        return (
            <div className={tableStyles.nameItem}>
                <div className={tableStyles.nameItemAvatar}>
                    <i className={'pi pi-map-marker'}/>
                </div>
                <div>
                    <span>
                       {location.l_name}
                    </span>
                    <span className={tableStyles.tableCellDescription}>
                        {location.address}
                    </span>
                </div>
            </div>
        )
    }

    render() {
        return this.renderTable();
    }

    renderTable = () => {
        return (
            <div className={tableStyles.dataTable}>
                <DataTable
                    ref={(el) => this.dt = el}
                    paginator
                    rows={25}
                    currentPageReportTemplate={sprintf(__('Showing %1$s to %2$s of %3$s locations', 'thebooking'), '{first}', '{last}', '{totalRecords}')}
                    rowsPerPageOptions={[10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    globalFilter={this.state.globalFilter}
                    header={this.renderHeader()}
                    value={Object.values(tbkCommon.locations)}
                    selection={this.state.selected}
                    onSelectionChange={this.onSelection}
                    loading={this.props.isBusy}
                >
                    <Column selectionMode={'multiple'} style={{width: '3em'}}/>
                    <Column
                        sortFunction={this.sortFunction}
                        field={'l_name'}
                        sortable
                        header={__('Location', 'thebooking')}
                        body={this.nameBodyTemplate}/>
                    <Column
                        body={this.actionsBodyTemplate}
                    />
                </DataTable>
                {this.newLocationDialog()}
            </div>
        )
    }

}

export default LocationsTable;