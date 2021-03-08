<?php

namespace TheBooking;

use TheBooking\Admin\UI_Services;
use TheBooking\Bus\Commands\SaveReservationForm;
use TheBooking\Classes\Service;
use TheBooking\Classes\Service_Appointment;
use TheBooking\Classes\ValueTypes;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * Class Services
 *
 * @package TheBooking
 */
class Services
{
    /**
     * @var Service[]
     */
    private $services = [];

    /**
     * @var string
     */
    public static $table_name = 'tbkl_services';

    /**
     * @var string
     */
    public static $table_name_meta = 'tbkl_services_meta';

    /**
     * @var array
     */
    protected static $install_columns = [
        'service_uid'       => ['type' => 'varchar', 'null' => TRUE],
        'service_name'      => ['type' => 'varchar', 'null' => TRUE],
        'description'       => ['type' => 'text', 'null' => TRUE],
        'short_description' => ['type' => 'text', 'null' => TRUE],
        'image'             => ['type' => 'int', 'null' => TRUE],
        'duration'          => ['type' => 'int', 'null' => TRUE],
        'color'             => ['type' => 'varchar', 'null' => TRUE],
        'active'            => 'int',
        'registered_only'   => 'int',
        'created'           => 'int',
        'updated'           => 'timestamp'
    ];

    /**
     * @var array
     */
    protected static $relevant_columns = [
        'id', 'service_uid', 'service_name', 'description', 'short_description',
        'color', 'active', 'image', 'registered_only', 'duration'
    ];

    /**
     * @var array
     */
    protected static $install_columns_meta = [
        'service_uid' => 'varchar',
        'meta_key'    => 'text',
        'meta_value'  => ['type' => 'text', 'null' => TRUE],
        'meta_type'   => 'varchar',
        'created'     => 'int',
        'updated'     => 'timestamp'
    ];

    protected function __construct()
    {
        tbkg()->loader->add_action('tbk-loaded', $this, 'gather');
        tbkg()->loader->add_action('tbk-backend-settings-save', self::class, 'save_settings_callback', 10, 2);
        tbkg()->loader->add_action('tbk_location_deleted', $this, 'location_deleted');
    }

    public function location_deleted($uid)
    {
        foreach ($this->services as $service) {
            $locations = $service->getMeta('locations');
            if ($locations) {
                $to_remove = array_search($uid, $locations, TRUE);
                if ($to_remove !== FALSE) {
                    unset($locations[ $to_remove ]);
                    $service->addMeta('locations', $locations);
                    self::update($service);
                }
            }
        }
    }

    public static function save_settings_callback($settings, $meta)
    {
        if ($meta['type'] === 'service') {
            $service = tbkg()->services->get($meta['id']);
            foreach ($settings as $settingId => $value) {
                switch ($settingId) {
                    case 'service_active':
                        $service->active(filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        break;
                    case 'color':
                        $service->color($value);
                        break;
                    case 'image':
                        $service->image($value, TRUE);
                        break;
                    case 'duration':
                        $service->duration($value);
                        break;
                    case 'description':
                        $service->description(trim($value));
                        break;
                    case 'name':
                        $service->name(trim($value));
                        break;
                    case 'shortDescription':
                        $service->short_description(trim($value));
                        break;
                    case 'meta::reservationForm':
                        $command = new SaveReservationForm(
                            $service->id(),
                            $value['elements'],
                            $value['required'],
                            $value['order'],
                            $value['conditions'],
                            $value['active']
                        );
                        tbkg()->bus->dispatch($command);
                        break;
                    case 'meta::closeReservations':
                        if (!filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                            $service->dropMeta('closeReservations');
                            $service->dropMeta('closeReservationsPeriod');
                        } else {
                            $service->addMeta('closeReservations', filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        }
                        break;
                    case 'meta::closeReservationsPeriod':
                        if (!(int)$value || !$service->getMeta('closeReservations')) {
                            $service->dropMeta('closeReservationsPeriod');
                        } else {
                            $service->addMeta('closeReservationsPeriod', (int)$value);
                        }
                        break;
                    case 'meta::openReservations':
                        if (!filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                            $service->dropMeta('openReservations');
                            $service->dropMeta('openReservationsPeriod');
                        } else {
                            $service->addMeta('openReservations', filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        }
                        break;
                    case 'meta::openReservationsPeriod':
                        if (!(int)$value || !$service->getMeta('openReservations')) {
                            $service->dropMeta('openReservationsPeriod');
                        } else {
                            $service->addMeta('openReservationsPeriod', (int)$value);
                        }
                        break;
                    case 'registeredOnly':
                        $service->registered_only(filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        break;
                    case 'meta::saveIp':
                        if (!filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                            $service->dropMeta('saveIp');
                        } else {
                            $service->addMeta('saveIp', filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        }
                        break;
                    case 'meta::locations':
                        if (!$value) {
                            $service->dropMeta('locations');
                        } else {
                            $service->addMeta('locations', $value);
                        }
                        break;
                    default:
                        do_action('tbk_save_service_settings', $settingId, $value, $service->id());
                        break;
                }
                self::update($service);
            }
            add_filter('tbk-backend-settings-save-response', static function ($response) {
                $response['services']      = array_map(static function (Service $service) {
                    return $service->as_array();
                }, tbkg()->services->all());
                $response['UIx']['panels'] = apply_filters('tbk_backend_service_setting_panels', UI_Services::_settings_panels());

                return $response;
            });
        }
    }

    /**
     * @param $service
     */
    public static function update($service)
    {
        db::update(self::$table_name, [
            'service_name'      => $service->name(),
            'description'       => $service->description(),
            'short_description' => $service->short_description(),
            'color'             => $service->color(),
            'image'             => $service->image(),
            'duration'          => $service->duration(),
            'active'            => $service->active(),
            'registered_only'   => $service->registered_only(),
        ], ['service_uid' => $service->id()]);
        self::sync_meta($service);
    }

    public function gather()
    {
        $records = db::select(self::$table_name, self::$relevant_columns, [], FALSE);
        if ($records instanceof \WP_Error) {
            switch ($records->get_error_code()) {
                case 404:
                    /**
                     * Database table is not found
                     */
                    db::create_table(self::$table_name, self::$install_columns);
                    db::create_table(self::$table_name_meta, self::$install_columns_meta);
                    break;
                default:
                    break;
            }

            return;
        }

        foreach ($records as $record) {
            $service = new Service_Appointment();
            $service->id($record->service_uid);
            $service->name($record->service_name);
            $service->description($record->description);
            $service->short_description($record->short_description);
            $service->color($record->color);
            $service->image($record->image);
            $service->duration($record->duration);
            $service->active((bool)$record->active);
            $service->registered_only((bool)$record->registered_only);

            $metadata = db::select(self::$table_name_meta,
                ['meta_key', 'meta_value', 'meta_type'],
                ['service_uid' => $service->id()], FALSE, 'ARRAY_A');

            foreach ($metadata as $metadatum) {
                $service->addMeta($metadatum['meta_key'], meta_from_storage(maybe_unserialize($metadatum['meta_value']), $metadatum['meta_type']));
            }

            $this->services[ $service->id() ] = $service;
        }
    }

    /**
     * @param Service $service
     */
    public function insert(Service $service)
    {
        db::insert(self::$table_name,
            [
                'created'           => time(),
                'service_uid'       => $service->id(),
                'service_name'      => $service->name(),
                'description'       => $service->description(),
                'short_description' => $service->short_description(),
                'color'             => $service->color(),
                'image'             => $service->image(),
                'duration'          => $service->duration(),
                'active'            => $service->active(),
                'registered_only'   => $service->registered_only(),
            ]
        );
        $this->services[ $service->id() ] = $service;
        self::sync_meta($service);
    }

    /**
     * @param Service $service
     */
    private static function sync_meta(Service $service)
    {
        /**
         * Fetching existent meta. We are not going to just wipe out and re-insert
         * the whole metadata, as we need to keep the "created" field meaningful.
         */
        $meta_rows = db::select(self::$table_name_meta, 'meta_key', ['service_uid' => $service->id()], FALSE, 'ARRAY_A');
        $metas     = [];
        foreach ($meta_rows as $meta) {
            $metas[ $meta['meta_key'] ] = $meta['meta_key'];
        }

        /**
         * Comparing current service metadata. Insert or update each
         * record.
         */
        foreach ($service->metadata() as $key => $metadatum) {
            $before_storage = meta_to_storage($metadatum);
            if (in_array($key, $metas, TRUE)) {
                db::update(self::$table_name_meta,
                    [
                        'meta_value' => \VSHM_Framework\Tools::maybe_serialize($before_storage['value']),
                        'meta_type'  => $before_storage['type']
                    ],
                    ['service_uid' => $service->id(), 'meta_key' => $key]);
                unset($metas[ $key ]);
            } else {
                db::insert(self::$table_name_meta, [
                    'meta_value'  => \VSHM_Framework\Tools::maybe_serialize($before_storage['value']),
                    'meta_type'   => $before_storage['type'],
                    'meta_key'    => $key,
                    'service_uid' => $service->id(),
                    'created'     => time()
                ]);
            }
        }

        /**
         * Cleaning leftovers.
         */
        foreach ($metas as $meta_key) {
            db::delete(self::$table_name_meta, ['service_uid' => $service->id(), 'meta_key' => $meta_key]);
        }
    }

    public function delete($service_uid)
    {
        db::delete(self::$table_name, ['service_uid' => $service_uid]);
        db::delete(self::$table_name_meta, ['service_uid' => $service_uid]);
        unset($this->services[ $service_uid ]);
    }

    public function delete_all()
    {
        db::truncate_table(self::$table_name);
        db::truncate_table(self::$table_name_meta);
        $this->services = [];
    }

    /**
     * @return Service[]
     */
    public function all()
    {
        return $this->services;
    }

    /**
     * @param string $service_uid
     *
     * @return FALSE|Service
     */
    public function get($service_uid)
    {
        if (!isset($this->services[ $service_uid ])) {
            return FALSE;
        }

        return $this->services[ $service_uid ];
    }

    /**
     * @param array $params
     *
     * @return Service[]
     */
    public function filter_by(array $params)
    {
        $returned = $this->services;
        foreach ($returned as $id => $service) {
            foreach ($params as $key => $value) {
                if ($service->{$key}() !== $value) {
                    unset($returned[ $id ]);
                }
            }
        }

        return $returned;
    }

    /**
     * @return int
     */
    public function count()
    {
        return count($this->services);
    }

    /**
     * @param string $serviceId
     *
     * @return array
     */
    public function mapToFrontend($serviceId)
    {
        $service = $this->services[ $serviceId ];

        /**
         * Removing form fields and related metadata (reservation form is loaded via Ajax).
         */
        $filteredMeta = array_filter($service->metadata(), static function ($meta, $key) {
            return !$meta instanceof ValueTypes\FormField
                && $key !== 'formFieldsOrder'
                && $key !== 'formFieldsRequired'
                && $key !== 'formFieldsActive'
                && $key !== 'formFieldsConditions';
        }, ARRAY_FILTER_USE_BOTH);

        if ($service->image()) {
            $imageUrl = wp_get_attachment_image_src($service->image(), 'full');
        } else {
            $imageUrl = NULL;
        }

        return [
            'uid'            => $service->id(),
            'color'          => $service->color(),
            'image'          => $imageUrl,
            'duration'       => $service->duration(),
            'name'           => $service->name(),
            'registeredOnly' => $service->registered_only(),
            'description'    => [
                'long'  => $service->description(),
                'short' => $service->short_description()
            ],
            'meta'           => $filteredMeta
        ];
    }

    /**
     * @return self
     */
    public static function instance()
    {
        return new self();
    }
}