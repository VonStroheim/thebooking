import {SelectOption} from "./frontend/jsx/FormElements/Select";
import {RulesLogic} from "json-logic-js";
import {Theme} from "@material-ui/core";

export interface TimeSlot {
    id: string,
    serviceId: string,
    availabilityId: string,
    start: string,
    end: string,
    location?: string,
    variants?: TimeslotVariant[],
    capacity?: number
}

export interface TimeslotVariant {
    id: string,
    start: string,
    end: string,
    capacity?: number
}

export interface StateAction {
    type: string,
    payload?: any
}

export type availableViews = 'monthlyCalendar' | 'userMessage' | 'stepper' | 'reservations';

export type ReservationStatuses = 'pending' | 'confirmed' | 'cancelled' | 'declined';

export interface ReservationRecordCustomer {
    name: string,
    hash: string
}

export interface ReservationRecordBackend {
    serviceId: string,
    customerId: number,
    uid: string,
    status: ReservationStatuses,
    created: number,
    updated: string,
    start: string,
    end: string,
    meta: {
        [key: string]: any
    }
}

export interface ReservationRecord {
    serviceId: string,
    customer: ReservationRecordCustomer,
    uid: string,
    status: ReservationStatuses,
    start: string,
    end: string,
    meta: {
        [key: string]: any
    }
}

export interface ServiceRecordDescription {
    long: string,
    short: string
}

export type AllFields = ServiceRecordReservationFormElement
    | ServiceRecordReservationFormElementText
    | ServiceRecordReservationFormElementOptions
    | ServiceRecordReservationFormElementNumber
    | ServiceRecordReservationFormElementFile;

export interface ServiceRecordReservationFormElementBackend {
    type: string,
    label: string,
    description: string,
    defaultValue?: string | number | boolean,
    hook?: string,
    hideIfRegistered: boolean,
    metakey?: string,
    uiType?: UiTypesText | UiTypesOptions,
    required?: boolean,
    pattern?: string,
    minimum?: number,
    maximum?: number,
    options?: SelectOption[],
    maxSize?: number,
    mimeTypes?: string[],
}

export interface ServiceRecordReservationFormElement {
    type: string,
    label: string,
    description: string,
    defaultValue: string | number | boolean,
    hook: string,
    active?: boolean,
    hideIfRegistered: boolean, // necessario?
    metakey?: string, // necessario?
    fields?: { [key: string]: AllFields },
    conditions?: {
        [key: string]: RulesLogic
    }
}

export interface mimeTypeOpt {
    desc: string,
    ext: string,
    mime: string
}

export type FormFieldConditionalStates = 'hidden' | 'required' | 'visible' | 'notRequired';

export type UiTypesText = 'multiline' | 'text';

export type UiTypesOptions = 'radio' | 'select' | 'address';

export interface ServiceRecordReservationFormElementText extends ServiceRecordReservationFormElement {
    uiType: UiTypesText,
    required: boolean,
    pattern?: string
}

export interface ServiceRecordReservationFormElementNumber extends ServiceRecordReservationFormElement {
    minimum: number,
    maximum: number,
    required: boolean
}

export interface ServiceRecordReservationFormElementOptions extends ServiceRecordReservationFormElement {
    options: SelectOption[],
    uiType: UiTypesOptions,
    required: boolean
}

export interface ServiceRecordReservationFormElementFile extends ServiceRecordReservationFormElement {
    maxSize: number,
    mimeTypes: string[],
    required: boolean
}

export interface ServiceRecordReservationFormBackend {
    conditions: {
        /**
         * Parent key: current fieldID
         */
        [key: string]: {
            /**
             * Child keys: fieldIDs on which parent depends (AND condition implied)
             */
            [key: string]: RulesLogic
        }
    },
    elements: {
        [key: string]: ServiceRecordReservationFormElementBackend
    },
    order: string[],
    required: string[],
    active: string[]
}

export interface ServiceRecordBackend {
    active: boolean,
    uid: string,
    type: string,
    typeLabel: string,
    color: string,
    image: string,
    duration: number,
    name: string,
    description: string,
    shortDescription: string,
    meta: {
        reservationForm?: ServiceRecordReservationFormBackend,
        [key: string]: any
    }
}

export interface ServiceRecord {
    uid: string,
    color: string,
    image: any[],
    duration: number,
    name: string,
    description: ServiceRecordDescription,
    registeredOnly: boolean,
    meta: {
        [key: string]: any
    }
}

export interface DurationObject {
    hours?: number,
    minutes?: number,
    days?: number
}

export interface AvailabilityRecord {
    containerDuration: DurationObject,
    serviceId: string,
    rrule: string,
    meta?: object[]
}

export interface MiddlewareAction {
    type: 'async',
    endpoint?: string
}

export interface FrontendMiddleware {
    changeMonth: MiddlewareAction[]
}

export interface BackendMiddleware {
    reschedulerChangeMonth: MiddlewareAction[]
}

export interface UiInstance {
    availability: AvailabilityRecord[],
    groupSlots: boolean,
    middleware: FrontendMiddleware,
    monthlyViewAverageDots: number,
    monthlyViewShowAllDots: boolean,
    reservations: ReservationRecord[],
    busyIntervals: { start: string, end: string }[]
    services: {
        [key: string]: ServiceRecord
    }
}

export interface BackendUser {
    ID: number,
    avatar: string,
    display_name: string,
    user_email: string,
    user_login: string
}

export interface BackendMainMenuItem {
    href: string,
    icon: string,
    label: string,
    slug: string
}

export interface NotificationHook {
    value: string,
    label: string,
    context: string,
    contextLabel: string
}

export interface CustomerBackendRecord {
    name: string,
    email: string,
    phone: string,
    wpUserId: number,
    birthday: string,
    id: number,
    timezone: string
}

export interface Location {
    l_name: string,
    address: string,
    uid: string
}

export interface tbkCommonB {
    UIx?: any,
    adminUrl: string,
    restRouteRoot: string,
    pluginUrl: string,
    pluginVersion: string,
    wpTimezone: string,
    timezoneList: {
        city: string,
        continent: string,
        subcity: string,
        t_city: string,
        t_continent: string,
        t_subcity: string
    }[],
    tbk_nonce: string,
    saveSettingsRoute: string,
    weekDaysLabels: string[],
    shortWeekDaysLabels: string[],
    monthLabels: string[],
    shortMonthLabels: string[],
    firstDayOfWeek: number,
    services: {
        [key: string]: ServiceRecordBackend
    },
    customers: {
        [key: number]: CustomerBackendRecord
    },
    availability: {
        [key: string]: {
            rrule: string
            duration: number
        }[]
    },
    locations: {
        [key: string]: Location
    },
    reservations: ReservationRecordBackend[],
    busyIntervals: { start: string, end: string }[],
    middleware: BackendMiddleware,
    users: BackendUser[],
    i18n: {
        locale: string,
    },
    mainMenuItems: BackendMainMenuItem[],
    userPrefs: { [key: string]: any },
    settings: {
        load_calendar_at_closest_slot: boolean,
        frontend_days_in_week: boolean,
        load_gmaps_library: boolean,
        gmaps_api_key: string | null,
        login_url: string | null,
        frontend_primary_color: string | null,
        frontend_secondary_color: string | null,
        registration_url: string | null,
        order_status_page: string | null,
        retain_plugin_data: boolean,
        reservation_records_lifecycle: number,
        cart_is_active: boolean,
        show_cart_in_menu: boolean,
        show_cart_in_widget: boolean,
        cart_expiration_time: number,
        admin_roles: {
            [key: string]: boolean
        },
        [x: string]: any
    },
    statuses: {
        draft: string,
        pending: string,
        confirmed: string,
        declined: string,
        cancelled: string,
        archived: string,
        open: string,
        closed: string,
    },
    modules: string[]
}

export interface tbkCommonF {
    weekDaysLabels: string[],
    hideWeekends: boolean,
    registrationUrl: string,
    currentUser: number,
    currentUserHash: string,
    loginUrl: string,
    currency?: string,
    currencySymbol?: string,
    shortWeekDaysLabels: string[],
    monthLabels: string[],
    shortMonthLabels: string[],
    firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6,
    restRouteRoot: string,
    nonce: string,
    gMapsApiKey: string,
    loadAtClosestSlot: boolean;
    locations: {
        [key: string]: Location
    },
    i18n: {
        locale: string
    },
    UI: {
        instances: {
            [key: string]: UiInstance
        },
        theme: Theme,
        [key: string]: any
    },
    statuses: {
        draft: string,
        pending: string,
        declined: string,
        confirmed: string,
        cancelled: string,
        archived: string,
        open: string,
        closed: string,
    },
    modules: string[]
}

export interface SettingPanelBlockComponentDependencyBackend {
    on: string,
    being: boolean | string | number,
    to?: string | boolean | number
}

export interface SettingPanelBlockComponentBackend {
    showDays?: boolean
    showMinutes?: boolean
    min?: number
    max?: number
    step?: number
    showButtons?: boolean
    currency?: string
    showHours?: boolean
    daysLabel?: string
    minutesLabel?: string
    hoursLabel?: string
    minDays?: number
    maxDays?: number
    label?: string
    settingId: string
    type: string
    text?: string
    options?: any
    showClear?: boolean
    href?: string
    post?: string
    postData?: { [key: string]: any }
    toFetchFrom?: string
    placeholder?: string
    intent?: string
    templateHooks?: NotificationHook[]
    templateHooksSpec?: { [key: string]: NotificationHook[] }
    dependencies?: SettingPanelBlockComponentDependencyBackend[]
}

export interface SettingPanelBlockBackend {
    title: string,
    description?: string,
    components: SettingPanelBlockComponentBackend[],
    dependencies?: SettingPanelBlockComponentDependencyBackend[]
}

export interface SettingPanelBackend {
    panelRef: string,
    panelLabel?: string,
    noSave?: boolean,
    icon?: string,
    blocks: SettingPanelBlockBackend[]
}