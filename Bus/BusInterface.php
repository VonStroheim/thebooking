<?php

namespace TheBooking\Bus;

defined('ABSPATH') || exit;

/**
 * Class BusInterface
 *
 * TODO: add a pipeline
 *
 * @package TheBooking
 */
interface BusInterface
{
    /**
     * @param string $commandClassName
     * @param string $handlerClassName
     *
     * @return void
     */
    public function subscribe($commandClassName, $handlerClassName);

    /**
     * @param Command $command
     *
     * @return void
     */
    public function dispatch(Command $command);
}