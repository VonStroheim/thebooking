<?php

namespace TheBooking;

use TheBooking\Bus\Commands\EditCustomer;
use TheBooking\Classes\Customer;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * Class Customers
 *
 * @package TheBooking
 */
class Customers
{
    /**
     * @var Customer[]
     */
    private $customers = [];

    /**
     * @var string
     */
    public static $table_name = 'tbkl_customers';

    /**
     * @var string[]
     */
    public static $table_structure = [
        'customer_name' => ['type' => 'text', 'null' => TRUE],
        'email'         => 'varchar',
        'phone'         => ['type' => 'varchar', 'null' => TRUE],
        'wp_user'       => 'int',
        'created'       => 'int',
        'birthday'      => ['type' => 'varchar', 'null' => TRUE],
        'updated'       => 'timestamp'
    ];

    protected function __construct()
    {
        tbkg()->loader->add_action('tbk-loaded', $this, 'gather');
        tbkg()->loader->add_action('profile_update', $this, 'wpProfileIsUpdated', 10, 2);
        tbkg()->loader->add_action('deleted_user', $this, 'wpProfileIsDeleted', 10, 3);
    }


    public function gather()
    {
        $this->customers = [];
        $records         = db::select(self::$table_name, '*', [], FALSE);
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
            $customer = new Customer();
            $customer->name($record->customer_name);
            $customer->email($record->email);
            $customer->birthday($record->birthday);
            $customer->phone($record->phone);
            $customer->wp_user($record->wp_user);
            $customer->id($record->id);
            $this->customers[ $record->id ] = $customer;
        }
    }

    public function delete($id)
    {
        db::delete(self::$table_name, ['id' => $id]);
        unset($this->customers[ $id ]);
    }

    /**
     * When a WordPress user is deleted, apply changes to the mapped customer.
     *
     * @param          $user_id
     * @param          $user_reassigned
     * @param \WP_User $old_user
     */
    public function wpProfileIsDeleted($user_id, $user_reassigned, $old_user)
    {
        foreach (tbkg()->customers->all() as $customer) {
            if ($customer->wp_user() === $user_id) {
                $command = new EditCustomer(
                    $customer->name(),
                    $customer->email(),
                    $customer->phone(),
                    $user_reassigned ?: 0,
                    $customer->birthday(),
                    $customer->id()
                );
                tbkg()->bus->dispatch($command);
            }
        }
    }

    /**
     * When a WordPress user is updated, apply changes to the mapped customer.
     *
     * @param          $user_id
     * @param \WP_User $old_data
     */
    public function wpProfileIsUpdated($user_id, $old_data)
    {
        foreach (tbkg()->customers->all() as $customer) {
            if ($customer->wp_user() === $user_id) {
                $user = get_user_by('ID', $user_id);
                $command = new EditCustomer(
                    $user->display_name,
                    $user->user_email,
                    $customer->phone(),
                    $user_id,
                    $customer->birthday(),
                    $customer->id()
                );
                tbkg()->bus->dispatch($command);
            }
        }
    }

    /**
     * @return Customer[]
     */
    public function all()
    {
        return $this->customers;
    }

    /**
     * @param int $id
     *
     * @return FALSE|Customer
     */
    public function get($id)
    {
        if (!isset($this->customers[ $id ])) {
            return FALSE;
        }

        return $this->customers[ $id ];
    }

    /**
     * @return int
     */
    public function count()
    {
        return count($this->customers);
    }

    /**
     * @return self
     */
    public static function instance()
    {
        return new self();
    }
}