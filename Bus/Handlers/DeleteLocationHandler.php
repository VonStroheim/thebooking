<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\DeleteLocation;
use TheBooking\Bus\Handler;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * DeleteLocationHandler
 *
 * @package TheBooking\Classes
 */
class DeleteLocationHandler implements Handler
{
    private $table_name = 'tbkl_locations';

    public function dispatch(Command $command)
    {
        /** @var $command DeleteLocation */
        db::delete($this->table_name, ['uid' => $command->getId()]);

        do_action('tbk_location_deleted', $command->getId());
    }
}