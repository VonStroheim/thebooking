<?php

namespace TheBooking;

use VSHM_Framework\db;

defined('ABSPATH') || exit;


/**
 * Class Availability
 *
 * @package TheBooking
 */
class Availability
{

    /**
     * @var
     */
    private $availability = [];

    /**
     * @var array
     */
    private $locations = [];

    /**
     * @var string
     */
    public static $table_name = 'tbkl_availability';

    /**
     * @var string
     */
    public static $l_table_name = 'tbkl_locations';

    /**
     * @var string[]
     */
    public static $table_structure = [
        'uid'      => 'varchar',
        'rrule'    => 'text',
        'duration' => 'int',
        'updated'  => 'timestamp'
    ];

    /**
     * @var string[]
     */
    public static $l_table_structure = [
        'uid'     => 'varchar',
        'address' => 'text',
        'l_name'  => 'text',
        'updated' => 'timestamp',
        'created' => 'int',
    ];

    protected function __construct()
    {
        tbk()->loader->add_action('tbk-loaded', $this, 'gather');
        tbk()->loader->add_action('tbk-loaded', $this, 'gather_locations');

    }

    public function gather_locations()
    {
        $this->locations = [];

        $records = db::select(self::$l_table_name, '*', [], FALSE);
        if ($records instanceof \WP_Error) {
            switch ($records->get_error_code()) {
                case 404:
                    /**
                     * Database table is not found.
                     */
                    db::create_table(self::$l_table_name, self::$l_table_structure);
                    break;
                default:
                    break;
            }

            return;
        }

        foreach ($records as $record) {
            $this->locations[ $record->uid ] = [
                'address' => $record->address,
                'l_name'  => $record->l_name,
                'uid'     => $record->uid
            ];
        }
    }

    public function gather()
    {
        $this->availability = [];

        $records = db::select(self::$table_name, '*', [], FALSE);
        if ($records instanceof \WP_Error) {
            switch ($records->get_error_code()) {
                case 404:
                    /**
                     * Database table is not found.
                     */
                    db::create_table(self::$table_name, self::$table_structure);
                    break;
                default:
                    break;
            }

            return;
        }

        foreach ($records as $record) {
            $this->availability[ $record->id ] = [
                'rrule'    => $record->rrule,
                'duration' => (int)$record->duration,
                'uid'      => $record->uid
            ];
        }
    }

    public function all()
    {
        return $this->availability;
    }

    public function locations()
    {
        return $this->locations;
    }

    /**
     * @return self
     */
    public static function instance()
    {
        return new self();
    }

}