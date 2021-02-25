<?php

namespace TheBooking;

use TheBooking\Bus\Bus;
use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\CleanFiles;
use TheBooking\Bus\Commands\DeletePastReservations;
use TheBooking\Classes\Shortcode_Booking;
use TheBooking\Integrations\Elementor_Widget;
use VSHM_Framework\Abstracts\Single;

defined('ABSPATH') || exit;

/**
 * Class TheBooking
 *
 * @package TheBooking
 * @author  VonStroheim
 * @since   1.0.0
 */
final class TheBooking extends Single
{
    /**
     * @var Loader
     */
    public $loader;

    /**
     * @var Settings
     */
    public $settings;

    /**
     * @var Services
     */
    public $services;

    /**
     * @var Customers
     */
    public $customers;

    /**
     * @var Bus
     */
    public $bus;

    /**
     * @var Reservations
     */
    public $reservations;

    /**
     * @var Availability
     */
    public $availability;

    protected function __construct()
    {
        $this->loader   = Loader::instance();
        $this->settings = Settings::instance();
        $this->bus      = new Bus();
    }

    /**
     * Loads the text domain on plugin load.
     *
     * @return bool
     */
    protected static function _load_textdomain()
    {
        $rel_path = plugin_basename(__TBK_FILE__) . '/languages/';

        return load_plugin_textdomain('the-booking', FALSE, $rel_path);
    }

    public function init()
    {
        $this->services     = Services::instance();
        $this->reservations = Reservations::instance();
        $this->customers    = Customers::instance();
        $this->availability = Availability::instance();

        #var_dump(\VSHM_Framework\Tools::get_ip_address());

        /**
         * Set scheduled hooks
         */
        if (!wp_get_schedule('tbk_daily_cron')) {
            wp_schedule_event(time(), 'daily', 'tbk_daily_cron');
        }
        if (!wp_get_schedule('tbk_hourly_cron')) {
            wp_schedule_event(time(), 'hourly', 'tbk_hourly_cron');
        }

        /**
         * Load textdomain
         */
        self::_load_textdomain();

        if (\VSHM_Framework\Tools::is_request('admin')) {
            $this->loader->add_action('admin_menu', Admin::class, 'backend_menu', 9);
            $this->loader->add_action('admin_enqueue_scripts', Admin::class, 'load_backend_resources');
            $this->loader->add_filter('plugin_row_meta', NULL, '\TheBooking\plugin_row_meta', 10, 2);

            /* Block editor support */
            $this->loader->add_action('enqueue_block_editor_assets', Admin::class, 'load_block_editor_scripts');
            Frontend\UI::load_actions();
            $this->loader->add_filter('block_categories', Admin::class, 'load_block_editor_category', 10, 2);
        } elseif (\VSHM_Framework\Tools::is_request('rest')) {

            Routes\SaveSettingsRoute::register();
            Routes\DeleteServiceRoute::register();
            Routes\GetServicePropertyRoute::register();
            Routes\SelectServiceRoute::register();
            Routes\CreateServiceRoute::register();
            Routes\UploadFileRoute::register();
            Routes\SubmitBookingRoute::register();
            Routes\DeleteReservationRoute::register();
            Routes\CreateCustomerRoute::register();
            Routes\EditCustomerRoute::register();
            Routes\SaveAvailabilityRoute::register();
            Routes\DeleteCustomerRoute::register();
            Routes\CreateLocationRoute::register();
            Routes\DeleteLocationRoute::register();
            Routes\CleanReservationStatusChangesRoute::register();

        } elseif (\VSHM_Framework\Tools::is_request('frontend')) {
            $this->loader->add_action('wp_enqueue_scripts', Frontend\UI::class, 'load_resources');
            Frontend\UI::load_actions();
        }

        if (!\VSHM_Framework\Tools::is_request('cron')) {
            add_shortcode(Shortcode_Booking::SHORTCODE, [
                Shortcode_Booking::class,
                'render',
            ]);
            $this->loader->add_action('init', Admin::class, 'load_block_editor_blocks');
            $this->loader->add_filter('wp_privacy_personal_data_exporters', NULL, 'TheBooking\personal_data_exporter_register');
            $this->loader->add_filter('wp_privacy_personal_data_erasers', NULL, 'TheBooking\personal_data_eraser_register');

            /* Elementor support */
            if (did_action('elementor/loaded')) {
                add_action('elementor/widgets/widgets_registered', static function () {
                    \Elementor\Plugin::instance()->widgets_manager->register_widget_type(new Elementor_Widget());
                });
                add_action('elementor/editor/before_enqueue_scripts', static function () {
                    Frontend\UI::load_resources();
                    wp_enqueue_script('tbkl-elementor-editor',
                        __TBK_URL__ . 'Integrations/elementor.js',
                        [],
                        filemtime(__TBK_DIR__ . DIRECTORY_SEPARATOR . 'Integrations' . DIRECTORY_SEPARATOR . 'elementor.js')
                    );
                    wp_enqueue_style('tbk-elementor-styles',
                        __TBK_URL__ . 'Integrations/elementor.css',
                        [],
                        filemtime(__TBK_DIR__
                            . DIRECTORY_SEPARATOR . 'Integrations'
                            . DIRECTORY_SEPARATOR . 'elementor.css')
                    );
                });
            }
        }

        if (\VSHM_Framework\Tools::is_request('cron')) {
            $this->loader->add_action('tbk_daily_cron', NULL, '\TheBooking\daily_jobs');
            $this->loader->add_action('tbk_hourly_cron', NULL, '\TheBooking\hourly_jobs');
        }

        Modules::load_modules();

        do_action('tbk-init');

        $this->loader->run();

        do_action('tbk-loaded');
    }

    /**
     * @return bool
     */
    public static function isAdministrator()
    {
        return current_user_can(self::admin_cap());
    }

    /**
     * @return mixed|void
     */
    public static function admin_cap()
    {
        return apply_filters('tbk_admin_capability', 'tbk_can_admin');
    }
}