<?php

namespace TheBooking;

use TheBooking\Bus\Commands\DeleteCustomer;
use TheBooking\Bus\Commands\DeleteReservation;
use TheBooking\Bus\Commands\DeleteService;

defined('ABSPATH') || exit;

/**
 * Class Actions
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class Actions
{

    public static function load_actions()
    {
        tbkg()->loader->add_action('tbk_dispatched_DeleteService', self::class, 'delete_reservations_after_service');
        tbkg()->loader->add_action('tbk_dispatched_DeleteCustomer', self::class, 'delete_reservations_after_customer');
    }

    /**
     * Ensures that reservations are removed after a service is removed.
     *
     * @param DeleteService $command
     */
    public static function delete_reservations_after_service(DeleteService $command)
    {
        foreach (tbkg()->reservations->all() as $reservation) {
            if ($reservation->service_id() === $command->getUid()) {
                tbkg()->bus->dispatch(new DeleteReservation($reservation->id()));
            }
        }
    }

    /**
     * Ensures that reservations are removed after a customer is removed.
     *
     * @param DeleteCustomer $command
     */
    public static function delete_reservations_after_customer(DeleteCustomer $command)
    {
        foreach (tbkg()->reservations->all() as $reservation) {
            if ($reservation->customer_id() === $command->getId()) {
                tbkg()->bus->dispatch(new DeleteReservation($reservation->id()));
            }
        }
    }

}