<?php

namespace TheBooking;

use TheBooking\Bus\Commands\CleanFiles;
use TheBooking\Bus\Commands\DeletePastReservations;
use TheBooking\Bus\Commands\DeleteReservation;
use TheBooking\Classes\Customer;
use TheBooking\Classes\DateTimeTbk;
use TheBooking\Classes\Reservation;
use TheBooking\Classes\Service;
use TheBooking\Classes\ValueTypes;
use TheBooking\Classes\ValueTypes\UserInput;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * @return bool
 */
function plugin_install()
{
    /**
     * extra safe-guard, the current user must have
     * activate_plugins capability
     */
    if (!current_user_can('activate_plugins')) {
        return FALSE;
    }

    /**
     * Set admin capability
     */
    foreach (wp_roles()->roles as $name => $role) {
        if ($name === 'administrator') {
            wp_roles()->add_cap($name, TheBookingClass::admin_cap());
        }
    }

    return TRUE;
}

/**
 * @return bool
 */
function plugin_deactivate()
{
    /**
     * extra safe-guard, the current user must have
     * activate_plugins capability
     */
    if (!current_user_can('activate_plugins')) {
        return FALSE;
    }

    /**
     * Remove the cronjobs
     */
    wp_clear_scheduled_hook('tbk_daily_cron');
    wp_clear_scheduled_hook('tbk_hourly_cron');

    do_action('tbk_deactivate');

    return TRUE;
}

/**
 * @return bool
 */
function plugin_uninstall()
{
    /**
     * extra safe-guard, the current user must have
     * activate_plugins capability
     */
    if (!current_user_can('activate_plugins')) {
        return FALSE;
    }

    do_action('tbk_uninstall');

    if (tbkg()->settings->_clean_uninstall()) {
        do_action('tbk_clean_uninstall');

        db::drop_table(Reservations::$table_name);
        db::drop_table(Reservations::$table_name_meta);
        db::drop_table(Services::$table_name);
        db::drop_table(Services::$table_name_meta);
        db::drop_table(Customers::$table_name);
        db::drop_table(Availability::$table_name);
        db::drop_table(Availability::$l_table_name);
        db::drop_table('tbkl_uploaded_files');

        delete_option(Settings::tag());

        foreach (wp_roles()->roles as $name => $role) {
            wp_roles()->remove_cap($name, TheBookingClass::admin_cap());
        }
    }

    return TRUE;
}

/**
 * Cronjobs that should run daily.
 */
function daily_jobs()
{
    /**
     * Cleaning reservation orphan uploaded files older than 1 hour
     */
    tbkg()->bus->dispatch(new CleanFiles(3600));

    /**
     * Removing old reservations from db
     */
    if (tbkg()->settings->reservation_records_lifecycle() > 0) {
        tbkg()->bus->dispatch(new DeletePastReservations(tbkg()->settings->reservation_records_lifecycle()));
    }
}

/**
 * Cronjobs that should run hourly.
 */
function hourly_jobs()
{
}

/**
 * @param $exporters
 *
 * @return mixed
 */
function personal_data_exporter_register($exporters)
{
    $exporters['thebooking'] = [
        'exporter_friendly_name' => __('TheBooking'),
        'callback'               => 'TheBooking\personal_data_exporter',
    ];

    return $exporters;
}

/**
 * @param $erasers
 *
 * @return mixed
 */
function personal_data_eraser_register($erasers)
{
    $erasers['thebooking'] = [
        'eraser_friendly_name' => __('TheBooking'),
        'callback'             => 'TheBooking\personal_data_eraser',
    ];

    return $erasers;
}

/**
 * @param string $email_address
 * @param int    $page
 *
 * @return array
 */
function personal_data_exporter($email_address, $page = 1)
{
    $number = 50;
    $page   = (int)$page;

    $export_items         = [];
    $total                = tbkg()->reservations->count();
    $current_reservations = tbkg()->reservations->paginate('created', 'ASC', $number, $page);
    foreach ($current_reservations as $reservation) {
        if (tbkg()->customers->get($reservation->customer_id())->email() !== $email_address) {
            continue;
        }
        $service = tbkg()->services->get($reservation->service_id());
        $data    = [
            [
                'name'  => __('Service', 'team-booking'),
                'value' => $service->name()
            ],
            [
                'name'  => __('Date', 'team-booking'),
                'value' => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->start())->localized_time()
            ],
            [
                'name'  => __('Created', 'team-booking'),
                'value' => DateTimeTbk::createFromFormatSilently('U', $reservation->created())->localized_date_time()
            ]
        ];
        foreach ($reservation->metadata() as $key => $item) {
            if ($item instanceof UserInput) {
                $data[] = [
                    'name'  => $item->getLabel(),
                    'value' => $item->getValue()
                ];
            }
        }
        $export_items[] = [
            'group_id'    => 'tbk-reservations',
            'group_label' => __('TheBooking reservations', 'thebooking'),
            'item_id'     => 'tbk-reservation-' . $reservation->id(),
            'data'        => $data
        ];
    }

    if (count($current_reservations) + (($page - 1) * $number) < $total) {
        $done = FALSE;
    } else {
        $done = TRUE;
    }

    return [
        'data' => $export_items,
        'done' => $done,
    ];
}

/**
 * @param string $email_address
 * @param int    $page
 *
 * @return array
 */
function personal_data_eraser($email_address, $page = 1)
{
    $number = 50;
    $page   = (int)$page;

    $items_removed = FALSE;
    $total         = tbkg()->reservations->count();

    $current_reservations = tbkg()->reservations->paginate('created', 'ASC', $number, $page);

    foreach ($current_reservations as $reservation) {
        if (tbkg()->customers->get($reservation->customer_id())->email() !== $email_address) {
            continue;
        }
        tbkg()->bus->dispatch(new DeleteReservation($reservation->id()));
        $items_removed = TRUE;
    }

    if (count($current_reservations) + (($page - 1) * $number) < $total) {
        $done = FALSE;
    } else {
        $done = TRUE;
    }

    return [
        'items_removed'  => $items_removed,
        'items_retained' => FALSE,
        'messages'       => [],
        'done'           => $done,
    ];
}

/**
 * Show row meta on the plugin screen
 *
 * @param mixed $links Plugin Row Meta.
 * @param mixed $file  Plugin Base file.
 *
 * @return array
 */
function plugin_row_meta($links, $file)
{
    if (strpos(TBKG_FILE__, pathinfo($file)['basename'])) {
        $new_links = array(
            'docs' => '<a href="https://docs.thebookingplugin.com/" target="_blank">' . esc_html__('Docs', 'team-booking') . '</a>'
        );

        $links = array_merge($links, $new_links);
    }

    return (array)$links;
}

/**
 * @return array
 */
function localize_backend_script()
{
    return apply_filters('tbk_backend_js_data_common', [
        'adminUrl'            => admin_url('admin.php?'),
        'pluginUrl'           => TBKG_URL__,
        'pluginVersion'       => TBKG_VERSION,
        'restRouteRoot'       => \VSHM_Framework\REST_Controller::get_root_rest_url(),
        'tbk_nonce'           => wp_create_nonce('tbk_nonce'),
        'saveSettingsRoute'   => \VSHM_Framework\REST_Controller::get_root_rest_url() . '/save/settings',
        'weekDaysLabels'      => \VSHM_Framework\Tools::i18n_weekdays_labels(),
        'shortWeekDaysLabels' => \VSHM_Framework\Tools::i18n_weekdays_labels('D'),
        'monthLabels'         => \VSHM_Framework\Tools::i18n_months_labels(),
        'shortMonthLabels'    => \VSHM_Framework\Tools::i18n_months_labels('M'),
        'firstDayOfWeek'      => (int)get_option('start_of_week'),
        'services'            => array_map(static function (Service $service) {
            return $service->as_array();
        }, tbkg()->services->all()),
        'reservations'        => array_values(array_map(static function (Reservation $reservation) {
            return $reservation->as_array();
        }, tbkg()->reservations->all())),
        'customers'           => array_map(static function (Customer $customer) {
            return $customer->as_array();
        }, tbkg()->customers->all()),
        'users'               => array_map(
            static function ($user) {
                $user->avatar = get_avatar_url($user->ID);
                $user->ID     = (int)$user->ID;

                return $user;
            },
            get_users([
                'fields' => [
                    'ID', 'display_name', 'user_email', 'user_login'
                ]
            ])
        ),
        'availability'        => tbkg()->availability->all(),
        'locations'           => tbkg()->availability->locations(),
        'i18n'                => [
            'locale' => str_replace('_', '-', get_locale()),
        ],
        'mainMenuItems'       => _main_menu_items(),
        'settings'            => _tbk_settings(),
        'statuses'            => [
            ValueTypes\Status::DRAFT     => __('Draft', 'thebooking'),
            ValueTypes\Status::PENDING   => __('Pending', 'thebooking'),
            ValueTypes\Status::CONFIRMED => __('Confirmed', 'thebooking'),
            ValueTypes\Status::CANCELLED => __('Canceled', 'thebooking'),
            ValueTypes\Status::ARCHIVED  => __('Archived', 'thebooking'),
            ValueTypes\Status::OPEN      => __('Open', 'thebooking'),
            ValueTypes\Status::CLOSED    => __('Closed', 'thebooking'),
        ]
    ]);
}

function print_filters_for($hook = '')
{
    global $wp_filter;
    if (empty($hook) || !isset($wp_filter[ $hook ])) return;

    $ret = '';
    foreach ($wp_filter[ $hook ] as $priority => $realhook) {
        foreach ($realhook as $hook_k => $hook_v) {
            $hook_echo = (is_array($hook_v['function']) ? get_class($hook_v['function'][0]) . ':' . $hook_v['function'][1] : $hook_v['function']);
            $ret       .= "\n$priority $hook_echo";
        }

    }

    return $ret;
}

/**
 * @return array
 */
function localize_frontend_script()
{
    $customer = tbkg()->customers->getByWpId(get_current_user_id());

    return apply_filters('tbk_frontend_js_data_common', [
        'weekDaysLabels'      => \VSHM_Framework\Tools::i18n_weekdays_labels(),
        'shortWeekDaysLabels' => \VSHM_Framework\Tools::i18n_weekdays_labels('D'),
        'monthLabels'         => \VSHM_Framework\Tools::i18n_months_labels(),
        'shortMonthLabels'    => \VSHM_Framework\Tools::i18n_months_labels('M'),
        'firstDayOfWeek'      => (int)get_option('start_of_week'),
        'restRouteRoot'       => \VSHM_Framework\REST_Controller::get_root_rest_url(),
        'loginUrl'            => tbkg()->settings->login_url(),
        'registrationUrl'     => tbkg()->settings->registration_url(),
        'nonce'               => wp_create_nonce('tbk_nonce'),
        'currentUser'         => get_current_user_id(),
        'currentUserHash'     => NULL !== $customer ? md5($customer->access_token()) : '',
        'hideWeekends'        => tbkg()->settings->frontend_days_in_week() !== 7,
        'loadAtClosestSlot'   => tbkg()->settings->load_calendar_at_closest_slot(),
        'locations'           => tbkg()->availability->locations(),
        'gMapsApiKey'         => tbkg()->settings->gmaps_api_key(),
        'i18n'                => [
            'locale' => str_replace('_', '-', get_locale()),
        ],
        'statuses'            => [
            ValueTypes\Status::DRAFT     => __('Draft', 'thebooking'),
            ValueTypes\Status::PENDING   => __('Pending', 'thebooking'),
            ValueTypes\Status::CONFIRMED => __('Confirmed', 'thebooking'),
            ValueTypes\Status::CANCELLED => __('Canceled', 'thebooking'),
            ValueTypes\Status::ARCHIVED  => __('Archived', 'thebooking'),
            ValueTypes\Status::OPEN      => __('Open', 'thebooking'),
            ValueTypes\Status::CLOSED    => __('Closed', 'thebooking'),
        ]
    ]);
}

/**
 * @return array
 */
function _tbk_settings()
{
    return [
        'load_calendar_at_closest_slot' => tbkg()->settings->load_calendar_at_closest_slot(),
        'frontend_days_in_week'         => tbkg()->settings->frontend_days_in_week() !== 7,
        'load_gmaps_library'            => tbkg()->settings->load_gmaps_library(),
        'gmaps_api_key'                 => tbkg()->settings->gmaps_api_key(),
        'login_url'                     => (tbkg()->settings->login_url() === wp_login_url()) ? '' : tbkg()->settings->login_url(),
        'registration_url'              => (tbkg()->settings->registration_url() === wp_registration_url()) ? '' : tbkg()->settings->registration_url(),
        'order_status_page'             => tbkg()->settings->order_status_page(),
        'frontend_primary_color'        => tbkg()->settings->frontend_primary_color(),
        'frontend_secondary_color'      => tbkg()->settings->frontend_secondary_color(),
        'frontend_background_color'     => tbkg()->settings->frontend_background_color(),
        'frontend_available_color'      => tbkg()->settings->frontend_available_color(),
        'frontend_booked_color'         => tbkg()->settings->frontend_booked_color(),
        'retain_plugin_data'            => tbkg()->settings->retain_plugin_data(),
        'reservation_records_lifecycle' => tbkg()->settings->reservation_records_lifecycle(),
        'cart_is_active'                => tbkg()->settings->cart_is_active(),
        'show_cart_in_menu'             => tbkg()->settings->show_cart_in_menu(),
        'show_cart_in_widget'           => tbkg()->settings->show_cart_in_widget(),
        'cart_expiration_time'          => tbkg()->settings->cart_expiration_time(),
        'admin_roles'                   => _wp_roles(),
    ];
}

/**
 * @return array
 */
function _main_menu_items()
{
    $root_url = admin_url('admin.php?page=thebooking');

    return apply_filters('tbk_backend_main_menu_items',
        [
            [
                'href'  => $root_url,
                'icon'  => 'dashicons-portfolio',
                'label' => __('Reservations', 'thebooking'),
                'slug'  => 'thebooking'
            ],
            [
                'href'  => $root_url . '-services',
                'icon'  => 'dashicons-products',
                'label' => __('Services', 'thebooking'),
                'slug'  => 'thebooking-services'
            ],
            [
                'href'  => $root_url . '-customers',
                'icon'  => 'dashicons-users',
                'label' => __('Customers', 'thebooking'),
                'slug'  => 'thebooking-customers'
            ],
            [
                'href'  => $root_url . '-availability',
                'icon'  => 'dashicons-calendar',
                'label' => __('Availability', 'thebooking'),
                'slug'  => 'thebooking-availability'
            ],
            [
                'href'  => $root_url . '-core',
                'icon'  => 'dashicons-admin-generic',
                'label' => __('Settings', 'thebooking'),
                'slug'  => 'thebooking-core'
            ]
        ]
    );
}

/**
 * Function that prepares meta value types
 * which are not known a-priori to be stored.
 *
 * @param $meta
 *
 * @return array
 */
function meta_to_storage($meta)
{
    switch (TRUE) {
        case $meta instanceof ValueTypes\UserInput:
            return [
                'type'  => 'UserInput',
                'value' => $meta->getData()
            ];
            break;
        case $meta instanceof ValueTypes\Status:
            return [
                'type'  => 'Status',
                'value' => $meta->getValue()
            ];
            break;
        case $meta instanceof ValueTypes\FormField:
            return [
                'type'  => 'FormField',
                'value' => $meta->getData()
            ];
            break;
        case is_array($meta):
            return [
                'type'  => 'array',
                'value' => $meta
            ];
            break;
        case is_bool($meta):
            return [
                'type'  => 'boolean',
                'value' => $meta
            ];
            break;
        default:
            return [
                'type'  => 'string',
                'value' => $meta
            ];
            break;
    }
}

/**
 * Function to revive meta prop types from storage.
 *
 * @param $value
 * @param $type
 *
 * @return mixed
 */
function meta_from_storage($value, $type)
{
    switch ($type) {
        case 'UserInput':
            return new ValueTypes\UserInput($value);
            break;
        case 'FormField':
            return new ValueTypes\FormField($value);
            break;
        case 'Status':
            return new ValueTypes\Status($value);
            break;
        case 'boolean':
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            break;
        default:
            return $value;
            break;
    }
}

function _wp_roles()
{
    $roles = [];
    foreach (wp_roles()->roles as $name => $role) {
        if ($name === 'administrator') {
            continue;
        }
        $roles[ $name ] = isset($role['capabilities'][ TheBookingClass::admin_cap() ]);
    }

    return $roles;
}

/**
 * @param array $file
 *
 * @return string
 */
function file_hash($file)
{
    return md5(md5_file($file['file']) . $file['file']);
}