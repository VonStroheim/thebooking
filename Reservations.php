<?php

namespace TheBooking;

use TheBooking\Bus\Commands\ChangeReservationCustomer;
use TheBooking\Bus\Commands\ChangeReservationLocation;
use TheBooking\Bus\Commands\ChangeReservationService;
use TheBooking\Bus\Commands\ChangeReservationStatus;
use TheBooking\Classes\DateTimeTbk;
use TheBooking\Classes\Reservation;
use TheBooking\Classes\ValueTypes\Status;
use TheBooking\Classes\ValueTypes\UserInput;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * Class Reservations
 *
 * @package TheBooking
 */
class Reservations
{
    /**
     * @var Reservation[]
     */
    private $reservations = [];

    /**
     * @var string
     */
    public static $table_name = 'tbkl_reservations';

    /**
     * @var string
     */
    public static $table_name_meta = 'tbkl_reservations_meta';

    /**
     * @var array
     */
    protected static $install_columns = [
        'service_id'      => ['type' => 'varchar', 'null' => TRUE],
        'r_status'        => 'varchar',
        'customer_id'     => 'int',
        'reservation_uid' => 'varchar',
        'created'         => 'int',
        'r_start'         => ['type' => 'varchar', 'null' => TRUE],
        'r_end'           => ['type' => 'varchar', 'null' => TRUE],
        'r_start_utc'     => 'datetime',
        'r_end_utc'       => 'datetime',
        'updated'         => 'timestamp'
    ];

    /**
     * @var array
     */
    protected static $relevant_columns = [
        'id', 'service_id', 'r_status', 'customer_id', 'reservation_uid', 'created', 'updated', 'r_start', 'r_end', 'r_start_utc', 'r_end_utc'
    ];

    /**
     * @var array
     */
    protected static $install_columns_meta = [
        'reservation_uid' => 'varchar',
        'meta_key'        => 'text',
        'meta_value'      => ['type' => 'text', 'null' => TRUE],
        'meta_type'       => 'varchar',
        'created'         => 'int',
        'updated'         => 'timestamp'
    ];

    protected function __construct()
    {
        tbkg()->loader->add_action('tbk-backend-settings-save', $this, 'save_settings_callback', 10, 2);
        tbkg()->loader->add_action('tbk-loaded', $this, 'gather');
        tbkg()->loader->add_action('tbk_location_deleted', $this, 'location_deleted');
    }

    /**
     * @return array
     */
    public static function getSchema()
    {
        return static::$install_columns;
    }

    public function location_deleted($id)
    {
        foreach ($this->reservations as $reservation) {
            if ($reservation->getMeta('location') === $id) {
                $reservation->dropMeta('location');
                $this->sync_meta($reservation->id());
            }
        }
    }

    public function save_settings_callback($settings, $meta)
    {
        if ($meta['type'] === 'reservation') {
            $reservation = $this->reservations[ $meta['id'] ];
            foreach ($settings as $settingId => $value) {
                switch ($settingId) {
                    case 'status':
                        $command = new ChangeReservationStatus($reservation->id(), $value);
                        tbkg()->bus->dispatch($command);
                        break;
                    case 'customer':
                        $command = new ChangeReservationCustomer($reservation->id(), $value);
                        tbkg()->bus->dispatch($command);
                        break;
                    case 'location':
                        $command = new ChangeReservationLocation($reservation->id(), $value);
                        tbkg()->bus->dispatch($command);
                        break;
                    case 'service':
                        $command = new ChangeReservationService($reservation->id(), $value);
                        tbkg()->bus->dispatch($command);
                        break;
                    default:
                        if (strpos($settingId, 'meta::') === 0) {
                            $metaKey = str_replace('meta::', '', $settingId);
                            switch ($value['type']) {
                                case 'UserInput':
                                    $reservation->addMeta($metaKey, new UserInput($value['value']));
                                    break;
                                default:
                                    $reservation->addMeta($metaKey, $value['value']);
                                    break;
                            }
                        }
                        break;
                }
            }

            db::update(self::$table_name, [
                'service_id'  => $reservation->service_id(),
                'r_status'    => $reservation->status()->getValue(),
                'customer_id' => $reservation->customer_id(),
                'r_start'     => $reservation->start(),
                'r_end'       => $reservation->end(),
            ], ['reservation_uid' => $reservation->id()]);
            $this->sync_meta($reservation->id());

            add_filter('tbk-backend-settings-save-response', static function ($response) {
                $response['reservations'] = array_values(array_map(static function (Reservation $reservation) {
                    return $reservation->as_array();
                }, tbkg()->reservations->all()));

                return $response;
            });
        }
    }

    public function delete_all()
    {
        db::truncate_table(self::$table_name);
        db::truncate_table(self::$table_name_meta);
        $this->reservations = [];
    }

    public function delete($reservation_uid)
    {
        db::delete(self::$table_name, ['reservation_uid' => $reservation_uid]);
        db::delete(self::$table_name_meta, ['reservation_uid' => $reservation_uid]);
        unset($this->reservations[ $reservation_uid ]);
    }

    /**
     * @return int
     */
    public function count()
    {
        return count($this->reservations);
    }

    /**
     * @param $reservation_uid
     */
    public function sync_meta($reservation_uid)
    {
        /**
         * Fetching existent meta. We are not going to just wipe out and re-insert
         * the whole metadata, as we need to keep the "created" field meaningful.
         */
        $meta_rows = db::select(self::$table_name_meta, 'meta_key', ['reservation_uid' => $reservation_uid], FALSE, 'ARRAY_A');
        $metas     = [];
        foreach ($meta_rows as $meta) {
            $metas[ $meta['meta_key'] ] = $meta['meta_key'];
        }

        /**
         * Comparing current service metadata. Insert or update each
         * record.
         */
        foreach ($this->reservations[ $reservation_uid ]->metadata() as $key => $metadatum) {
            $before_storage = meta_to_storage($metadatum);
            if (in_array($key, $metas, TRUE)) {
                db::update(
                    self::$table_name_meta,
                    [
                        'meta_value' => \VSHM_Framework\Tools::maybe_serialize($before_storage['value']),
                        'meta_type'  => $before_storage['type']
                    ],
                    ['reservation_uid' => $reservation_uid, 'meta_key' => $key]
                );
                unset($metas[ $key ]);
            } else {
                db::insert(self::$table_name_meta, [
                    'meta_value'      => \VSHM_Framework\Tools::maybe_serialize($before_storage['value']),
                    'meta_key'        => $key,
                    'meta_type'       => $before_storage['type'],
                    'reservation_uid' => $reservation_uid,
                    'created'         => time()
                ]);
            }
        }

        /**
         * Cleaning leftovers.
         */
        foreach ($metas as $meta_key) {
            db::delete(self::$table_name_meta, ['reservation_uid' => $reservation_uid, 'meta_key' => $meta_key]);
        }
    }

    /**
     * @param string $order_by
     * @param string $order
     * @param int    $items
     * @param int    $page
     *
     * @return Reservation[]
     */
    public function paginate($order_by = 'created', $order = 'ASC', $items = 10, $page = 1)
    {
        $records = db::paginate(self::$table_name, self::$relevant_columns, $order_by, $order, $items, $page);

        $reservations = [];
        foreach ($records as $record) {
            $reservations[ $record->reservation_uid ] = $this->_map_record($record);
        }

        return $reservations;

    }

    /**
     * @return Reservation[]
     */
    public function getNextConfirmed()
    {
        global $wpdb;
        $table_name = $wpdb->prefix . self::$table_name;
        $records    = $wpdb->get_results("SELECT * FROM " . esc_sql($table_name) . " WHERE r_start_utc >= NOW() AND r_status = 'confirmed'");
        $return     = [];
        foreach ($records as $record) {
            $return[ $record->reservation_uid ] = $this->_map_record($record);
        }

        return $return;
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
            $this->reservations[ $record->reservation_uid ] = $this->_map_record($record);
        }
    }

    /**
     * @param $record
     *
     * @return Reservation
     */
    private function _map_record($record)
    {
        $reservation = new Reservation();
        $reservation->id($record->reservation_uid);
        $reservation->service_id($record->service_id);
        $reservation->status(new Status($record->r_status));
        $reservation->customer_id($record->customer_id);
        $reservation->created($record->created);
        $reservation->start($record->r_start);
        $reservation->end($record->r_end);
        $reservation->updated($record->updated);

        $metadata = db::select(self::$table_name_meta, ['meta_key', 'meta_value', 'meta_type'], ['reservation_uid' => $reservation->id()], FALSE, 'ARRAY_A');

        foreach ($metadata as $metadatum) {
            $reservation->addMeta($metadatum['meta_key'], meta_from_storage(maybe_unserialize($metadatum['meta_value']), $metadatum['meta_type']));
        }

        return $reservation;
    }

    /**
     * @param Reservation $reservation
     */
    public function insert(Reservation $reservation)
    {
        $startDate = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->start());
        $endDate   = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->end());
        db::insert(self::$table_name,
            [
                'created'         => time(),
                'reservation_uid' => $reservation->id(),
                'service_id'      => $reservation->service_id(),
                'customer_id'     => $reservation->customer_id(),
                'r_start'         => $reservation->start(),
                'r_end'           => $reservation->end(),
                'r_start_utc'     => $startDate->toDB(),
                'r_end_utc'       => $endDate->toDB(),
                'r_status'        => $reservation->status()->getValue()
            ]
        );
        $this->reservations[ $reservation->id() ] = $reservation;
        $this->sync_meta($reservation->id());
    }

    /**
     * @return Reservation[]
     */
    public function all()
    {
        return $this->reservations;
    }

    /**
     * @return Reservation
     */
    public function get_new()
    {
        return new Reservation();
    }

    /**
     * @param $reservationId
     *
     * @return array
     */
    public function mapToFrontend($reservationId)
    {
        $res          = $this->reservations[ $reservationId ];
        $customer     = tbkg()->customers->get($res->customer_id());
        $customerData = [
            'id'   => $res->customer_id(),
            'wpId' => $customer->wp_user(),
            'hash' => md5($customer->access_token())
        ];

        $meta = [];

        if ($res->getMeta('location')) {
            $meta['location'] = $res->getMeta('location');
        }

        if ($res->getMeta('availabilityId')) {
            $meta['availabilityId'] = $res->getMeta('availabilityId');
        }

        return apply_filters('tbk_reservation_frontend_map', [
            'uid'       => $res->id(),
            'serviceId' => $res->service_id(),
            'customer'  => $customerData,
            'status'    => $res->status()->getValue(),
            'start'     => $res->start() ?: '',
            'end'       => $res->end() ?: '',
            'meta'      => $meta,
        ], $reservationId);
    }

    /**
     * @return self
     */
    public static function instance()
    {
        return new self();
    }
}