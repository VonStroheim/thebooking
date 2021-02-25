<?php

namespace TheBooking\Bus;

defined('ABSPATH') || exit;

/**
 * Class Handler
 *
 * @package TheBooking
 */
interface Handler
{
    /**
     * @param Command $command
     *
     * @return mixed
     */
    public function dispatch(Command $command);
}