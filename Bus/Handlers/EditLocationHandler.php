<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\EditLocation;
use TheBooking\Bus\Handler;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * EditLocationHandler
 *
 * @package TheBooking\Classes
 */
class EditLocationHandler implements Handler
{
    private $table_name = 'tbkl_locations';

    public function dispatch(Command $command)
    {
        /** @var $command EditLocation */

        db::update($this->table_name, [
            'l_name'  => $command->getName(),
            'address' => $command->getAddress(),
        ], ['uid' => $command->getUid()]);
    }
}
