<?php

namespace TheBooking;

use TheBooking\Admin\UI_Availability;
use TheBooking\Admin\UI_CoreSettings;
use TheBooking\Admin\UI_Services;
use TheBooking\Classes\Reservation;
use TheBooking\Classes\Service;
use TheBooking\Classes\Shortcode_Booking;
use TheBooking\Frontend\UI;

defined('ABSPATH') || exit;

/**
 * Class Admin
 *
 * @package TheBooking
 * @author  VonStroheim
 */
class Admin
{
    const SLUG_DEFAULT           = 'thebooking';
    const SLUG_CORE_PAGE         = 'thebooking-core';
    const SLUG_AVAILABILITY_PAGE = 'thebooking-availability';
    const SLUG_SERVICES_PAGE     = 'thebooking-services';
    const SLUG_CUSTOMERS_PAGE    = 'thebooking-customers';

    public static function backend_menu()
    {
        if (isset($_GET['page'])) {
            $page = sanitize_text_field($_GET['page']);
            add_filter('tbk_backend_js_data_common', function ($data) use ($page) {
                switch ($page) {
                    case self::SLUG_CORE_PAGE:
                        $data['UIx']['panels'] = apply_filters('tbk_backend_core_settings_panels', UI_CoreSettings::_settings_panels());
                        break;
                    case self::SLUG_AVAILABILITY_PAGE:
                        $data['UIx']['panels'] = apply_filters('tbk_backend_availability_settings_panels', UI_Availability::_settings_panels());
                        break;
                    case self::SLUG_SERVICES_PAGE:
                        $data['UIx']['panels'] = apply_filters('tbk_backend_service_settings_panels', UI_Services::_settings_panels());
                        break;
                }

                return $data;
            });
        }

        $page_hook = add_menu_page(
            'TheBooking',
            'TheBooking',
            TheBookingClass::admin_cap(),
            'thebooking',
            [__CLASS__, 'admin_backend_page'],
            'data:image/svg+xml;base64,PHN2ZyBpZD0iTGl2ZWxsb18xIiBkYXRhLW5hbWU9IkxpdmVsbG8gMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTA0LjI5IDgwLjI4Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6bm9uZTt9LmNscy0ye2ZpbGw6I2I5MjQyNDt9LmNscy0ze2ZpbGw6I2ZmZGIwNTt9LmNscy00e2ZpbGw6IzEzODZjOTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPmljb248L3RpdGxlPjxyZWN0IGNsYXNzPSJjbHMtMSIgeD0iMTIuNTUiIHk9IjU3LjIxIiB3aWR0aD0iMjkuMjUiIGhlaWdodD0iMTguMjgiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xOC45NCAtMTYuMikgcm90YXRlKC02LjUpIi8+PHJlY3QgY2xhc3M9ImNscy0yIiB4PSIxMi41NSIgeT0iNTcuMjEiIHdpZHRoPSIyOS4yNSIgaGVpZ2h0PSIxOC4yOCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE4Ljk0IC0xNi4yKSByb3RhdGUoLTYuNSkiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjUzLjc5IiB5PSI4MC4xMSIgd2lkdGg9IjI5LjI1IiBoZWlnaHQ9IjE4LjI4IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjEuMjcgLTExLjM4KSByb3RhdGUoLTYuNSkiLz48cmVjdCBjbGFzcz0iY2xzLTQiIHg9Ijg1LjcyIiB5PSIyMS4yOSIgd2lkdGg9IjI5LjI1IiBoZWlnaHQ9IjE4LjI4IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTQuNDEgLTguMTUpIHJvdGF0ZSgtNi41KSIvPjwvc3ZnPg=='
        );

        add_submenu_page(
            'thebooking',
            'TheBooking',
            'Reservations',
            'tbk_can_admin',
            'thebooking',
            [
                __CLASS__,
                'admin_backend_page',
            ]
        );

        add_submenu_page(
            'thebooking',
            'Services - TheBooking',
            'Services',
            'tbk_can_admin',
            self::SLUG_SERVICES_PAGE,
            [
                __CLASS__,
                'admin_backend_page',
            ]
        );

        add_submenu_page(
            'thebooking',
            'Customers - TheBooking',
            'Customers',
            'tbk_can_admin',
            self::SLUG_CUSTOMERS_PAGE,
            [
                __CLASS__,
                'admin_backend_page',
            ]
        );

        add_submenu_page(
            'thebooking',
            'Availability - TheBooking',
            'Availability',
            'tbk_can_admin',
            self::SLUG_AVAILABILITY_PAGE,
            [
                __CLASS__,
                'admin_backend_page',
            ]
        );

        add_submenu_page(
            'thebooking',
            'Core - TheBooking',
            'Core settings',
            'tbk_can_admin',
            self::SLUG_CORE_PAGE,
            [
                __CLASS__,
                'admin_backend_page',
            ]
        );
    }

    public static function admin_backend_page($current)
    {
        echo '<div id="tbkl"></div>';
    }

    /**
     * Loads the backend scripts and styles.
     *
     * @param $hook
     */
    public static function load_backend_resources($hook)
    {
        /**
         * let's load only if we're on TheBooking dashboard
         */
        if (strpos($hook, 'page_thebooking') !== FALSE) {
            wp_enqueue_style('wp-color-picker');
            wp_enqueue_style('wp-components');
            wp_enqueue_media();
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style-prime-theme', '/css/theme.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style-primeflex', '/css/primeflex.min.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style-prime', '/css/primereact.min.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style-prime-icons', '/css/primeicons.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-nouislider-style', '/css/nouislider.min.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-phone-input-style', '/css/phoneInputStyle.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-clock-style', '/css/clock.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style', '/css/backend.css');
            \VSHM_Framework\Tools::enqueue_script('tbk-admin-nouislider-script', '/js/backend/nouislider.min.js');
            \VSHM_Framework\Tools::enqueue_script('tbk-admin-script', '/js/backend/tbk.js',
                [
                    'jquery',
                    'wp-api',
                    'wp-color-picker',
                    'wp-blocks',
                    'wp-element',
                    'wp-editor',
                    'wp-components',
                    'lodash'
                ],
                TRUE);
            wp_add_inline_script('tbk-admin-script', 'var tbkCommon=' . json_encode(localize_backend_script()), 'before');

            /**
             * JS translations
             */
            wp_set_script_translations('tbk-admin-script', 'thebooking', WP_LANG_DIR . '/plugins/');
        }
    }

    /**
     * @param $categories
     *
     * @return array
     */
    public static function load_block_editor_category($categories)
    {
        return array_merge(
            $categories,
            [
                [
                    'slug'  => 'tbkl-bookings',
                    'title' => __('Booking tools', 'thebooking')
                ],
            ]
        );
    }

    /**
     *
     */
    public static function load_block_editor_blocks()
    {
        register_block_type('tbkl/widget', [
            'render_callback' => [Shortcode_Booking::class, 'render']
        ]);
    }

    /**
     *
     */
    public static function load_block_editor_scripts()
    {
        UI::load_resources();

        wp_enqueue_script('tbkl-block-editor',
            TBKG_URL__ . 'Admin/Blocks/blockNext.js',
            ['wp-blocks', 'wp-element', 'wp-editor', 'wp-components'],
            filemtime(TBKG_DIR__ . DIRECTORY_SEPARATOR . 'Admin' . DIRECTORY_SEPARATOR . 'Blocks' . DIRECTORY_SEPARATOR . 'blockNext.js')
        );
        wp_localize_script(
            'tbkl-block-editor',
            'tbkData', apply_filters('tbkl_gutemberg_block_data', [
                'bookingWidget' => [
                    'customElements' => []
                ]
            ])
        );

        $services = array_map(static function (Service $service) {
            return tbkg()->services->mapToFrontend($service->id());
        }, tbkg()->services->all());

        $availability = [];

        foreach ($services as $service) {
            foreach (tbkg()->availability->all() as $element) {
                $availability[] = [
                    'uid'               => $element['uid'],
                    'rrule'             => $element['rrule'],
                    'serviceId'         => $service['uid'],
                    'containerDuration' => [
                        'minutes' => $element['duration']
                    ],
                ];
            }
        }

        $tbk_resources = [
            'services'     => $services,
            'reservations' => array_values(array_map(static function (Reservation $reservation) {
                return tbkg()->reservations->mapToFrontend($reservation->id());
            }, tbkg()->reservations->all())),
            'availability' => $availability
        ];

        wp_localize_script(
            'tbkl-block-editor',
            'TBK_RESOURCES', $tbk_resources
        );

        wp_localize_script(
            'tbkl-block-editor',
            'tbkCommon', localize_backend_script()
        );
    }
}