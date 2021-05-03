// @ts-ignore
import styles from './App.css';
import React from 'react';
import MainMenu from './MainMenu';
import SideMenu from './SideMenu';
import SettingsPanel from './SettingsPanel';
import ReservationsTable from './ReservationsTable';
import ServicesTable from './ServicesTable';
import CustomersTable from './CustomersTable';
// @ts-ignore
import {Editor} from '@tinymce/tinymce-react';
import {Toast} from 'primereact/toast';
import {Panel} from 'primereact/panel';
import {Button} from 'primereact/button';
import Api from '../../Api';
// @ts-ignore
import * as SettingComponents from './SettingComponents/components';
import globals from "../../globals";
import {NotificationHook, ReservationRecordBackend, SettingPanelBackend, StateAction, tbkCommonB} from "../../typedefs";
import LocationsTable from "./LocationsTable";
import {formatRFC3339} from "date-fns";

declare const tbkCommon: tbkCommonB;
declare const lodash: any;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface AppProps {

}

interface AppState {
    currentHash: string,
    page: string,
    UI: tbkCommonB,
    isBusy: boolean,
    actionsToCommit: {
        SAVE_SETTINGS: {
            [key: string]: any
        }
    },
    isStickyShown: boolean
}

export default class App extends React.Component<AppProps, AppState> {
    private toast: any;
    private stickyToast: any;

    constructor(props: AppProps) {

        super(props);

        this.state = {
            currentHash    : window.location.hash.substr(1),
            page           : new URLSearchParams(window.location.search).get('page'),
            UI             : tbkCommon,
            isBusy         : false,
            actionsToCommit: {
                SAVE_SETTINGS: {}
            },
            isStickyShown  : false
        }

    }

    componentDidMount() {
        window.addEventListener('hashchange', this.onHashChange);
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.onHashChange);
    }

    onHashChange = () => {
        this.setState({
            currentHash    : window.location.hash.substr(1),
            actionsToCommit: {
                SAVE_SETTINGS: {}
            }
        })
    }

    haltSettingsChanges = (payload: { [key: string]: any }) => {
        const actionsToCommit = this.state.actionsToCommit;
        actionsToCommit.SAVE_SETTINGS = Object.assign({}, actionsToCommit.SAVE_SETTINGS, payload);
        this.setState({actionsToCommit: actionsToCommit})
    }

    commitChanges = (action: { type: string, id?: string | number }) => {
        this.handleChanges({
            type   : action.type,
            payload: {
                settings: this.state.actionsToCommit.SAVE_SETTINGS,
                id      : action.id
            }
        })
    }

    handleChanges = (action: StateAction) => {
        if (action.type !== 'SAVE_USER_PREFS') {
            this.setState({isBusy: true});
        }
        switch (action.type) {
            case 'SAVE_SETTINGS':
                fetch(this.state.UI.saveSettingsRoute, {
                    method : 'post',
                    headers: globals.getHeaders(),
                    body   : JSON.stringify({
                        settings: action.payload.settings,
                        meta    : {
                            type: 'core'
                        }
                    })
                })
                    .then(res => res.json())
                    .then(res => {
                        tbkCommon.settings = res.settings;
                        this.setState({
                            UI             : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy         : false,
                            actionsToCommit: {
                                SAVE_SETTINGS: {}
                            }
                        })
                        this.showSuccess(__('Settings saved.', 'thebooking'));
                    })
                break;
            case 'SAVE_USER_PREFS':
                Api.post('/save/prefs/', {
                    prefName : action.payload.name,
                    prefValue: action.payload.value
                }).then((res: any) => {
                    console.log(res);
                })
                break;
            case 'SAVE_AVAILABILITY':
                Api.post('/save/availability/', {
                    settings: action.payload.settings,
                    id      : 'availabilityGlobal_1'
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.availability = res.data.availability;
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                        this.showSuccess(__('Availability saved.', 'thebooking'));
                    }

                })
                break;
            case 'SAVE_SERVICE_SETTINGS':
                fetch(this.state.UI.saveSettingsRoute, {
                    method : 'post',
                    headers: globals.getHeaders(),
                    body   : JSON.stringify({
                        settings: action.payload.settings,
                        meta    : {
                            type: 'service',
                            id  : action.payload.id
                        }
                    })
                })
                    .then(res => res.json())
                    .then(res => {
                        tbkCommon.services = res.services;
                        if ('UIx' in res) {
                            tbkCommon.UIx.panels = res.UIx.panels;
                        }
                        this.setState({
                            UI             : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy         : false,
                            actionsToCommit: {
                                SAVE_SETTINGS: {}
                            }
                        })
                        this.showSuccess(__('Settings saved.', 'thebooking'));
                    })
                break;
            case 'DELETE_SERVICES':
                fetch(this.state.UI.restRouteRoot + '/delete/service/', {
                    method : 'post',
                    headers: globals.getHeaders(),
                    body   : JSON.stringify({
                        uids: action.payload,
                    })
                })
                    .then(res => res.json())
                    .then(res => {
                        tbkCommon.services = res.services;
                        this.setState({
                            UI             : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy         : false,
                            actionsToCommit: {
                                SAVE_SETTINGS: {}
                            }
                        })
                        this.showSuccess(__('Service deleted.', 'thebooking'));
                    })

                break;
            case 'DELETE_RESERVATIONS':
                fetch(this.state.UI.restRouteRoot + '/delete/reservation/', {
                    method : 'post',
                    headers: globals.getHeaders(),
                    body   : JSON.stringify({
                        uids: action.payload,
                    })
                })
                    .then(res => res.json())
                    .then(res => {
                        tbkCommon.reservations = res.reservations;
                        this.setState({
                            UI             : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy         : false,
                            actionsToCommit: {
                                SAVE_SETTINGS: {}
                            }
                        })
                        this.showSuccess(__('Reservations deleted.', 'thebooking'));
                    })

                break;
            case 'SAVE_RESERVATION_SETTINGS':
                fetch(this.state.UI.saveSettingsRoute, {
                    method : 'post',
                    headers: globals.getHeaders(),
                    body   : JSON.stringify({
                        settings: action.payload.settings,
                        meta    : {
                            type: 'reservation',
                            id  : action.payload.id
                        }
                    })
                })
                    .then(res => res.json())
                    .then(res => {
                        tbkCommon.reservations = res.reservations;
                        this.setState({
                            UI             : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy         : false,
                            actionsToCommit: {
                                SAVE_SETTINGS: {}
                            }
                        })
                        this.showSuccess(__('Settings saved.', 'thebooking'));
                    })
                break;
            case 'CREATE_CUSTOMER':
                Api.post('/create/customer/', {
                    customer: action.payload
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.customers = res.data.customers;
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                        this.showSuccess(__('Customer created.', 'thebooking'));
                    }

                })
                break;
            case 'CREATE_LOCATION':
                Api.post('/create/location/', {
                    name   : action.payload.name,
                    address: action.payload.address
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.locations = res.data.locations;
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                        this.showSuccess(__('Location created.', 'thebooking'));
                    }

                })
                break;
            case 'EDIT_LOCATION':
                Api.post('/edit/location/', {
                    name   : action.payload.name,
                    address: action.payload.address,
                    uid    : action.payload.uid
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.locations = res.data.locations;
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                        this.showSuccess(__('Location modified.', 'thebooking'));
                    }

                })
                break;
            case 'CREATE_SERVICE':
                Api.post('/create/service/', {
                    service: action.payload
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.services = res.data.services;
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                        this.showSuccess(__('Service created.', 'thebooking'));
                    }

                })
                break;
            case 'EDIT_CUSTOMER':
                Api.post('/edit/customer/', {
                    customer: action.payload.newData,
                    id      : action.payload.id
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.customers = res.data.customers;
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                        this.showSuccess(__('Customer saved.', 'thebooking'));
                    }

                })
                break;
            case 'DELETE_CUSTOMER':
                Api.post('/delete/customer/', {
                    id: action.payload
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.customers = res.data.customers;
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                        this.showSuccess(__('Customer removed.', 'thebooking'));
                    }

                })
                break;
            case 'DELETE_LOCATIONS':
                Api.post('/delete/location/', {
                    uids: action.payload
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.locations = res.data.locations;
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                        this.showSuccess(__('Locations removed.', 'thebooking'));
                    }

                })
                break;
            case 'CHANGE_RESERVATION_STATUS':
                Api.post('/reservation/status/change/', {
                    status: action.payload.status,
                    id    : action.payload.id
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.reservations = res.data.reservations;
                        this.showSuccess(__('Status changed.', 'thebooking'));
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                    }
                })
                break;
            case 'CHANGE_PAYMENT_STATUS':
                Api.post('/reservation/payment/change/', {
                    status: action.payload.status,
                    id    : action.payload.id
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.reservations = res.data.reservations;
                        this.showSuccess(__('Status changed.', 'thebooking'));
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                    }
                })
                break;
            case 'RESCHEDULE_RESERVATION':
                Api.post('/reservation/reschedule/', {
                    start: formatRFC3339(action.payload.start),
                    end  : formatRFC3339(action.payload.end),
                    id   : action.payload.id
                }).then((res: any) => {
                    if (res.data.status === 'KO') {
                        this.showError(res.data.error);
                        this.setState({
                            isBusy: false
                        })
                    } else {
                        tbkCommon.reservations = res.data.reservations;
                        this.showSuccess(__('Date changed.', 'thebooking'));
                        this.setState({
                            UI    : {
                                ...this.state.UI,
                                ...tbkCommon
                            },
                            isBusy: false
                        })
                    }
                })
                break;
        }
    }

    prepareReservations = (reservations: ReservationRecordBackend[]) => {
        return reservations.sort((a, b) => {
            if (a.start === b.start) return 0;
            if (a.start < b.start) {
                return 1;
            } else {
                return -1;
            }
        })
    }

    renderAlt() {
        switch (this.state.page) {
            case 'thebooking':
                return (
                    <ReservationsTable
                        reservations={this.prepareReservations(this.state.UI.reservations)}
                        onUpdate={this.handleChanges}
                        isBusy={this.state.isBusy}
                        showFilters={true}
                        showHeader={true}
                    />
                )
            case 'thebooking-services':
                return (
                    <ServicesTable
                        onUpdate={this.handleChanges}
                        isBusy={this.state.isBusy}
                        panels={this.state.UI.UIx.panels}
                        currentHash={this.state.currentHash}
                        renderSettingPanel={this.renderSettingPanel}
                    />
                )
            case 'thebooking-customers':
                return (
                    <CustomersTable
                        onUpdate={this.handleChanges}
                        isBusy={this.state.isBusy}
                        currentHash={this.state.currentHash}
                        renderSettingPanel={this.renderSettingPanel}
                    />
                )
            case 'thebooking-core':
                const coreMenuItems = this.state.UI.UIx.panels.map((panel: SettingPanelBackend) => {
                    return {
                        label: panel.panelLabel,
                        ref  : panel.panelRef,
                    }
                })
                return (
                    <>
                        <SideMenu items={coreMenuItems}/>

                        {this.state.UI.UIx.panels.map((panel: SettingPanelBackend, i: number) => (
                            <>
                                {(this.state.currentHash === panel.panelRef || (!this.state.currentHash && i === 0)) && (
                                    this.renderSettingPanel(panel, this.state.UI.settings, {type: 'SAVE_SETTINGS'})
                                )}
                            </>
                        ))}
                    </>
                )
            case 'thebooking-availability':
                let avMenuItems = this.state.UI.UIx.panels.map((panel: SettingPanelBackend) => {
                    return {
                        label: panel.panelLabel,
                        ref  : panel.panelRef,
                    }
                })
                return (
                    <>
                        <SideMenu items={avMenuItems}/>

                        {this.state.UI.UIx.panels.map((panel: SettingPanelBackend, i: number) => (
                            <>
                                {(this.state.currentHash === panel.panelRef || (!this.state.currentHash && i === 0)) && (
                                    this.renderSettingPanel(panel, this.state.UI.settings, {type: 'SAVE_AVAILABILITY'})
                                )}
                            </>
                        ))}
                    </>
                )
        }
    }

    showSuccess(message: string) {
        this.toast.show({severity: 'success', summary: __('Success', 'thebooking'), detail: message});
    }

    showError(message: string) {
        this.toast.show({severity: 'error', summary: __('Error', 'thebooking'), detail: message});
    }

    showStickyMessage(message: any) {
        this.stickyToast.show({severity: 'info', content: message, sticky: true, closable: false});
    }

    render() {
        return (
            <div className={styles.container}>
                <MainMenu items={this.state.UI.mainMenuItems}/>
                {this.renderAlt()}
                <Toast ref={(el) => this.toast = el} position="bottom-right"/>
                <Toast ref={(el) => this.stickyToast = el} position="top-right" baseZIndex={100000000}/>
            </div>
        );
    }

    resolveSettingsBlockLogic = (rules: any, values: { [key: string]: any }) => {
        let show = true;
        rules.forEach((rule: any) => {
            let parentValue = this.state.actionsToCommit['SAVE_SETTINGS'][rule.on];
            if (typeof parentValue === 'undefined') {
                parentValue = rule.on.startsWith('meta::')
                    ? values.meta[rule.on.replace('meta::', '')]
                    : values[rule.on];
            }
            switch (rule.being) {
                case '=':
                    if (parentValue !== rule.to) {
                        show = false;
                    }
                    break;
                case 'NOT_EMPTY':
                    if (typeof parentValue === 'string' && parentValue.length < 1 || (typeof parentValue !== 'string' && !parentValue)) {
                        show = false;
                    }
                    break;
                case 'EMPTY':
                    if ((typeof parentValue === 'string' && parentValue.length > 0) || (typeof parentValue !== 'string' && parentValue)) {
                        show = false;
                    }
                    break;
                default:
                    break;
            }
        })
        return show;
    }

    /**
     * It renders a generic setting panel.
     *
     * @param panel
     * @param values The source of values for setting elements.
     * @param commitAction Action to commit when onUpdate is called
     * @returns {JSX.Element}
     */
    renderSettingPanel = (panel: SettingPanelBackend, values: { [key: string]: any }, commitAction: { type: string, id?: string | number }) => {
        return (
            <div>
                <SettingsPanel panelRef={panel.panelRef}
                               key={panel.panelRef}
                               noSave={panel.noSave || false}
                               onUpdate={() => this.commitChanges(commitAction)}
                               isBusy={this.state.isBusy}>
                    {panel.blocks.map((block, i: number) => {

                        /**
                         * Taking care of logic
                         */
                        if ('dependencies' in block) {
                            if (!this.resolveSettingsBlockLogic(block.dependencies, values)) {
                                return;
                            }
                        }

                        return (
                            <SettingComponents.Block
                                key={'block-' + i}
                                title={block.title}
                                description={block.description}
                            >
                                {block.components.map((component) => {

                                    /**
                                     * Taking care of logic
                                     */
                                    if ('dependencies' in component) {
                                        if (!this.resolveSettingsBlockLogic(component.dependencies, values)) {
                                            return;
                                        }
                                    }

                                    /**
                                     * Taking care of metadata and ready-to-commit values.
                                     *
                                     * TODO: this is a mess
                                     *
                                     */
                                    let settingValue;
                                    if (!['notice', 'button'].includes(component.type)) {
                                        const mergedValues = {...values, ...this.state.actionsToCommit['SAVE_SETTINGS']}
                                        settingValue = mergedValues[component.settingId];
                                        if (typeof settingValue === 'undefined' && component.settingId.startsWith('meta::')) {
                                            settingValue = values.meta[component.settingId.replace('meta::', '')];
                                        }
                                    }

                                    switch (component.type) {
                                        case 'toggle':
                                            return (
                                                <SettingComponents.Toggle
                                                    checked={settingValue}
                                                    settingId={component.settingId}
                                                    key={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                    disabled={this.state.isBusy}
                                                />
                                            )
                                        case 'text':
                                            return (
                                                <SettingComponents.TextInput
                                                    value={settingValue}
                                                    placeholder={component.placeholder}
                                                    settingId={component.settingId}
                                                    key={component.settingId}
                                                    label={component.label}
                                                    onChange={this.haltSettingsChanges}
                                                    disabled={this.state.isBusy}
                                                />
                                            )
                                        case 'select':
                                            return (
                                                <SettingComponents.Select
                                                    value={settingValue}
                                                    settingId={component.settingId}
                                                    key={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                    options={component.options}
                                                    showClear={component.showClear}
                                                    placeholder={component.placeholder}
                                                    disabled={this.state.isBusy}
                                                />
                                            )
                                        case 'multiselect':
                                            return (
                                                <SettingComponents.MultiSelect
                                                    value={settingValue}
                                                    settingId={component.settingId}
                                                    key={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                    options={component.options}
                                                    disabled={this.state.isBusy}
                                                />
                                            )
                                        case 'number':
                                            return (
                                                <SettingComponents.NumberInput
                                                    value={settingValue}
                                                    settingId={component.settingId}
                                                    key={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                    disabled={this.state.isBusy}
                                                    showButtons={component.showButtons}
                                                    min={component.min}
                                                    max={component.max}
                                                    step={component.step}
                                                    currency={component.currency}
                                                />
                                            )
                                        case 'durationSelect':
                                            return (
                                                <SettingComponents.DurationSelect
                                                    value={settingValue}
                                                    settingId={component.settingId}
                                                    key={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                    showDays={'showDays' in component ? component.showDays : true}
                                                    showHours={'showHours' in component ? component.showHours : true}
                                                    showMinutes={'showMinutes' in component ? component.showMinutes : true}
                                                    daysLabel={component.daysLabel}
                                                    minutesLabel={component.minutesLabel}
                                                    hoursLabel={component.hoursLabel}
                                                    maxDays={component.maxDays}
                                                    minDays={component.minDays}
                                                    disabled={this.state.isBusy}
                                                />
                                            )
                                        case 'radios':
                                            return (
                                                <SettingComponents.Radios
                                                    options={component.options}
                                                    value={settingValue}
                                                    settingId={component.settingId}
                                                    key={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                    disabled={this.state.isBusy}
                                                />
                                            )
                                        case 'checkboxes':
                                            return (
                                                <SettingComponents.Checkboxes
                                                    options={component.options}
                                                    selected={settingValue}
                                                    settingId={component.settingId}
                                                    key={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                    disabled={this.state.isBusy}
                                                />
                                            )
                                        case 'colorPicker':
                                            return (
                                                <SettingComponents.Color
                                                    value={settingValue}
                                                    settingId={component.settingId}
                                                    key={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                />
                                            )
                                        case 'html':
                                            return (
                                                <Editor
                                                    key={component.settingId}
                                                    tinymceScriptSrc={tbkCommon.pluginUrl + 'js/backend/tiny/tinymce.min.js'}
                                                    init={{
                                                        menubar      : false,
                                                        relative_urls: false,
                                                        plugins      : 'fullscreen preview code link',
                                                        toolbar      : [
                                                            'undo redo',
                                                            'fullscreen preview code',
                                                            'bold italic',
                                                            'forecolor backcolor',
                                                            'alignleft aligncenter alignright alignjustify',
                                                            'outdent indent',
                                                            'removeformat link'
                                                        ].join(' | ')
                                                    }}
                                                    value={settingValue}
                                                    disabled={this.state.isBusy}
                                                    onEditorChange={(content) => this.haltSettingsChanges({
                                                        [component.settingId]: content
                                                    })}
                                                />
                                            )
                                        case 'email':

                                            const specificHooks = (typeof component.templateHooksSpec !== 'undefined')
                                                ? (typeof component.templateHooksSpec[values.uid] !== 'undefined' ? component.templateHooksSpec[values.uid] : [])
                                                : [];
                                            const groupedHooks = lodash.groupBy(component.templateHooks.concat(specificHooks), (x: NotificationHook) => x.contextLabel);

                                            return (
                                                <Panel toggleable header={__('Email content', 'thebooking')} collapsed={true} className={styles.settingPanelEmail}>
                                                    <Editor
                                                        key={component.settingId}
                                                        tinymceScriptSrc={this.state.UI.pluginUrl + 'js/backend/tiny/tinymce.min.js'}
                                                        init={{
                                                            menubar      : false,
                                                            relative_urls: false,
                                                            dynamicHooks : groupedHooks,
                                                            plugins      : 'fullscreen preview code link tbk-hooks',
                                                            toolbar      : [
                                                                'tbk-hooks',
                                                                'undo redo',
                                                                'fullscreen preview code',
                                                                'bold italic',
                                                                'forecolor backcolor',
                                                                'alignleft aligncenter alignright alignjustify',
                                                                'outdent indent',
                                                                'removeformat link'
                                                            ].join(' | ')
                                                        }}
                                                        value={settingValue}
                                                        disabled={this.state.isBusy}
                                                        onEditorChange={(content) => this.haltSettingsChanges({
                                                            [component.settingId]: content
                                                        })}
                                                    />
                                                </Panel>
                                            )
                                        case 'formBuilder':
                                            return (
                                                <SettingComponents.FormBuilder
                                                    key={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                    schema={settingValue}
                                                    settingId={component.settingId}
                                                />
                                            )
                                        case 'hoursPlanner':
                                            return (
                                                <SettingComponents.WorkingHoursPlanner
                                                    key={component.settingId + 'WorkingHoursPlanner'}
                                                    settingId={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                />
                                            )
                                        case 'closingDatesPlanner':
                                            return (
                                                <SettingComponents.ClosingDatesPlanner
                                                    key={component.settingId + 'ClosingDatesPlanner'}
                                                    settingId={component.settingId}
                                                    onChange={this.haltSettingsChanges}
                                                />
                                            )
                                        case 'LocationsTable':
                                            return (<LocationsTable isBusy={this.state.isBusy} onUpdate={this.handleChanges}/>)
                                        case 'notice':
                                            return (
                                                <SettingComponents.Notice
                                                    key={globals.uuidDOM()}
                                                    type={component.intent}
                                                >
                                                    {component.text}
                                                </SettingComponents.Notice>
                                            )
                                        case 'button':
                                            let classes = 'p-button-outlined';
                                            if (component.intent) {
                                                classes += ' p-button-' + component.intent;
                                            }
                                            return (
                                                <Button label={component.label} className={classes} onClick={() => {
                                                    if (this.state.isBusy) {
                                                        return;
                                                    }
                                                    if (component.href) {
                                                        window.location.href = component.href;
                                                    } else if (component.post) {
                                                        this.setState({isBusy: true});
                                                        Api.post(component.post, component.postData).then(res => {
                                                            this.setState({
                                                                isBusy: false,
                                                                UI    : {
                                                                    ...tbkCommon,
                                                                    ...{
                                                                        settings: {
                                                                            ...tbkCommon.settings,
                                                                            ...(res.data.settings || {})
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        })
                                                    }
                                                }}/>
                                            )
                                    }
                                })}
                            </SettingComponents.Block>
                        )
                    })}
                </SettingsPanel>
            </div>
        )
    }

}