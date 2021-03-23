<?php

namespace TheBooking\Classes\ValueTypes;

defined('ABSPATH') || exit;

/**
 * Class Status
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class Status
{
    const DRAFT     = 'draft';
    const PENDING   = 'pending';
    const CONFIRMED = 'confirmed';
    const DECLINED  = 'declined';
    const CANCELLED = 'cancelled';
    const ARCHIVED  = 'archived';
    const OPEN      = 'open';
    const CLOSED    = 'closed';

    /**
     * @var string
     */
    private $status;

    public function __construct($status)
    {
        $this->status = $status;
    }

    public function getValue()
    {
        return $this->status;
    }
}
