<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * SaveReservationForm
 *
 * @package TheBooking\Classes
 */
class SaveReservationForm implements Command
{
    /**
     * @var string
     */
    private $serviceId;

    /**
     * @var array
     */
    private $elements;

    /**
     * @var array
     */
    private $required;

    /**
     * @var array
     */
    private $order;

    /**
     * @var array
     */
    private $conditions;

    /**
     * SaveReservationForm constructor.
     *
     * @param string $serviceId
     * @param array  $elements
     * @param array  $required
     * @param array  $order
     * @param array  $conditions
     */
    public function __construct($serviceId, $elements, $required, $order, $conditions)
    {
        $this->serviceId    = $serviceId;
        $this->elements     = $elements;
        $this->required     = $required;
        $this->order        = $order;
        $this->conditions   = $conditions;
    }

    /**
     * @return array
     */
    public function getElements()
    {
        return $this->elements;
    }

    /**
     * @return array
     */
    public function getRequired()
    {
        return $this->required;
    }

    /**
     * @return array
     */
    public function getOrder()
    {
        return $this->order;
    }

    /**
     * @return array
     */
    public function getConditions()
    {
        return $this->conditions;
    }

    /**
     * @return string
     */
    public function getServiceId()
    {
        return $this->serviceId;
    }
}