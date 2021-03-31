<?php

namespace TheBooking;

use TheBooking\Classes\DateTimeTbk;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * Class Update
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class Update
{

    public static function maybeUpdate()
    {
        $storedVersion = get_option('tbkg_version');
        if ($storedVersion !== TBKG_VERSION) {
            if (!$storedVersion) {
                $storedVersion = 1.1;
            }
            self::from($storedVersion);
            update_option('tbkg_version', TBKG_VERSION);
        }
    }

    /**
     * @param string $version
     */
    public static function from($version)
    {
        switch ($version) {
            /** @noinspection PhpMissingBreakStatementInspection */
            case '1.1':
                db::alter_table(Reservations::$table_name, Reservations::getSchema());
                $reservations = db::select(Reservations::$table_name, '*', [], FALSE);
                foreach ($reservations as $reservation) {
                    $startDate = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->r_start);
                    $endDate   = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->r_end);
                    db::update(Reservations::$table_name, [
                        'r_start_utc' => $startDate->toDB(),
                        'r_end_utc'   => $endDate->toDB(),
                    ], ['reservation_uid' => $reservation->reservation_uid]);
                }
                db::alter_table(Customers::$table_name, Customers::getSchema());
                $customers = db::select(Customers::$table_name, '*', [], FALSE);
                foreach ($customers as $customer) {
                    db::update(Customers::$table_name, [
                        'timezone' => wp_timezone()->getName(),
                    ], ['id' => $customer->id]);
                }
            default:
                break;
        }
    }
}