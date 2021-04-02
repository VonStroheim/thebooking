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
        tbkg()->loader->add_action('tbk_dispatched_DeleteService', self::class, 'delete_interactions_with_service');
        tbkg()->loader->add_action('tbk_dispatched_DeleteCustomer', self::class, 'delete_reservations_after_customer');
        tbkg()->loader->add_action('updated_option', self::class, 'updatedTimezone', 10, 3);
    }

    /**
     * @param string $option_name
     * @param string $old
     * @param string $new
     */
    public static function updatedTimezone($option_name, $old, $new)
    {
        if ($option_name === 'timezone_string') {
            // It could be useful in the future.
        }
    }

    /**
     * Removes interactions with a service after it is removed.
     *
     * @param DeleteService $command
     */
    public static function delete_interactions_with_service(DeleteService $command)
    {
        $serviceFactory = tbkg()->services;
        foreach ($serviceFactory->all() as $service) {
            $blocksList = $service->getMeta('blocksOtherList');
            if (is_array($blocksList) && ($key = array_search($command->getUid(), $blocksList, TRUE)) !== FALSE) {
                unset($blocksList[ $key ]);
            }
            $service->addMeta('blocksOtherList', $blocksList);
            $serviceFactory::update($service);
        }
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