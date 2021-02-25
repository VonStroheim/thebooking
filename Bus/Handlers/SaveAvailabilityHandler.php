<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\SaveAvailability;
use TheBooking\Bus\Handler;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * SaveAvailabilityHandler
 *
 * @package TheBooking\Classes
 */
class SaveAvailabilityHandler implements Handler
{
    private $table_name = 'tbkl_availability';

    public function dispatch(Command $command)
    {
        /** @var $command SaveAvailability */

        $availability = db::select($this->table_name, '*', [
            'uid' => $command->getUid()
        ]);

        if ($availability) {
            db::delete($this->table_name, [
                'uid' => $command->getUid()
            ]);
        }

        foreach ($command->getRules() as $rule) {
            db::insert($this->table_name, [
                'uid'      => $command->getUid(),
                'duration' => $rule['duration'],
                'rrule'    => $rule['rrule'],
            ]);
        }

        tbk()->availability->gather();
    }
}
