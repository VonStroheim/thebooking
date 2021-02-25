<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\DeleteService;
use TheBooking\Bus\Handler;

defined('ABSPATH') || exit;

/**
 * DeleteServiceHandler
 *
 * @package TheBooking\Classes
 */
class DeleteServiceHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command DeleteService */
        tbk()->services->delete($command->getUid());
    }
}