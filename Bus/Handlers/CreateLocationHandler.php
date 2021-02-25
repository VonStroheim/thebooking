<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\CreateLocation;
use TheBooking\Bus\Handler;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * CreateLocationHandler
 *
 * @package TheBooking\Classes
 */
class CreateLocationHandler implements Handler
{
    private $table_name = 'tbkl_locations';

    public function dispatch(Command $command)
    {
        /** @var $command CreateLocation */

        db::insert($this->table_name, [
            'address' => $command->getAddress(),
            'l_name'  => $command->getName(),
            'uid'     => $command->getUid(),
            'created' => time()
        ]);
    }
}
