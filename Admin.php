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
    const SLUG_DEFAULT           = 'the-booking';
    const SLUG_CORE_PAGE         = 'the-booking-core';
    const SLUG_AVAILABILITY_PAGE = 'the-booking-availability';
    const SLUG_SERVICES_PAGE     = 'the-booking-services';
    const SLUG_CUSTOMERS_PAGE    = 'the-booking-customers';

    public static function backend_menu()
    {
        if (isset($_GET['page'])) {
            $page = $_GET['page'];
            add_filter('tbk_backend_js_data_common', function ($data) use ($page) {
                switch ($page) {
                    case self::SLUG_CORE_PAGE:
                        $data['UIx']['panels'] = apply_filters('tbk_backend_core_setting_panels', UI_CoreSettings::_settings_panels());
                        break;
                    case self::SLUG_AVAILABILITY_PAGE:
                        $data['UIx']['panels'] = apply_filters('tbk_backend_availability_setting_panels', UI_Availability::_settings_panels());
                        break;
                    case self::SLUG_SERVICES_PAGE:
                        $data['UIx']['panels'] = apply_filters('tbk_backend_service_setting_panels', UI_Services::_settings_panels());
                        break;
                }

                return $data;
            });
        }

        $page_hook = add_menu_page(
            'TheBooking',
            'TheBooking',
            TheBooking::admin_cap(),
            'the-booking',
            [__CLASS__, 'admin_backend_page']
        );

        add_submenu_page(
            'the-booking',
            'TheBooking',
            'Reservations',
            'manage_options',
            'the-booking',
            [
                __CLASS__,
                'admin_backend_page',
            ]
        );

        add_submenu_page(
            'the-booking',
            'Services - TheBooking',
            'Services',
            'manage_options',
            self::SLUG_SERVICES_PAGE,
            [
                __CLASS__,
                'admin_backend_page',
            ]
        );

        add_submenu_page(
            'the-booking',
            'Customers - TheBooking',
            'Customers',
            'manage_options',
            self::SLUG_CUSTOMERS_PAGE,
            [
                __CLASS__,
                'admin_backend_page',
            ]
        );

        add_submenu_page(
            'the-booking',
            'Availability - TheBooking',
            'Availability',
            'manage_options',
            self::SLUG_AVAILABILITY_PAGE,
            [
                __CLASS__,
                'admin_backend_page',
            ]
        );

        add_submenu_page(
            'the-booking',
            'Core - TheBooking',
            'Core settings',
            'manage_options',
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
        ob_start();
        ?>
        <script>
            jQuery(document).ready(function () {
                tbkCommon.custom = [];
                tbkCommon.custom.push(
                    function () {
                        alert('evviva!!!!');
                    }
                );
            })
        </script>
        <?php
        echo ob_get_clean();
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
        if (strpos($hook, 'page_the-booking') !== FALSE) {
            wp_enqueue_style('wp-color-picker');
            wp_enqueue_style('wp-components');
            wp_enqueue_media();
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style-prime-theme', '/css/theme.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style-primeflex', '/css/primeflex.min.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style-prime', '/css/primereact.min.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style-prime-icons', '/css/primeicons.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-nouislider-style', '/css/nouislider.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-daypicker-style', '/css/react-day-picker.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-phone-input-style', '/css/phoneInputStyle.css');
            \VSHM_Framework\Tools::enqueue_style('tbk-admin-style', '/css/backend.css');
            \VSHM_Framework\Tools::enqueue_script('tbk-admin-nouislider-script', '/js/backend/nouislider.js');
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
            \VSHM_Framework\Tools::enqueue_script('tbk-admin-daypicker-script', '/js/backend/react-day-picker.min.js', [], TRUE);
            wp_add_inline_script('tbk-admin-script', 'var tbkCommon=' . json_encode(localize_backend_script()), 'before');

            /**
             * JS translations
             */
            wp_set_script_translations('tbk-admin-script', 'the-booking', WP_LANG_DIR . '/plugins/');
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
                    'title' => __('Booking tools', 'the-booking')
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
            __TBK_URL__ . 'Admin/Blocks/blockNext.js',
            ['wp-blocks', 'wp-element', 'wp-editor', 'wp-components'],
            filemtime(__TBK_DIR__ . DIRECTORY_SEPARATOR . 'Admin' . DIRECTORY_SEPARATOR . 'Blocks' . DIRECTORY_SEPARATOR . 'blockNext.js')
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
            $serviceArray                        = tbk()->services->mapToFrontend($service->id());
            $serviceArray['meta']['blocksOther'] = [
                [
                    'by'   => 'serviceId',
                    'rule' => 'all'
                ]
            ];

            return $serviceArray;
        }, tbk()->services->all());

        $availability = [];

        foreach ($services as $service) {
            foreach (tbk()->availability->all() as $element) {
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
                return tbk()->reservations->mapToFrontend($reservation->id());
            }, tbk()->reservations->all())),
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