<?php

namespace TheBooking\Bus;

defined('ABSPATH') || exit;

/**
 * Class Bus
 *
 * @package TheBooking
 */
class Bus implements BusInterface
{

    /**
     * @var array
     */
    private $subscriptions = [];

    /**
     * @param string $commandClassName
     * @param string $handlerClassName
     */
    public function subscribe($commandClassName, $handlerClassName)
    {
        $this->subscriptions[ $commandClassName ] = $handlerClassName;
    }

    /**
     * @param Command $command
     */
    public function dispatch(Command $command)
    {
        $commandName = get_class($command);
        $handlerName = str_replace('\Commands\\', '\Handlers\\', $commandName) . 'Handler';
        if (!class_exists($handlerName)) {
            if (isset($this->subscriptions[ $commandName ]) && class_exists($this->subscriptions[ $commandName ])) {
                $handlerName = $this->subscriptions[ $commandName ];
            }
        }
        $handler = new $handlerName();
        if ($handler instanceof Handler) {
            $handler->dispatch($command);

            /**
             * Middleware
             */
            $reflected = new \ReflectionClass($command);
            do_action('tbk_dispatched_' . $reflected->getShortName(), $command);
        } else {
            throw new \BadMethodCallException('No handler for $commandName');
        }
    }
}