<?php

namespace TheBooking\Classes;

use TheBooking\Classes\ValueTypes\Status;

defined('ABSPATH') || exit;

/**
 * Class Resource
 *
 * @package TheBooking\Classes
 * @author  VonStroheim
 */
class Resource
{
    use \VSHM_Framework\Classes\Metadata;

    /**
     * @var int
     */
    protected $created;

    /**
     * @var int
     */
    protected $updated;

    /**
     * @var string|int
     */
    protected $id;

    /**
     * @var Status
     */
    protected $status;

    /**
     * Returns the fully-qualified class name of the resource.
     *
     * @return string
     */
    public static function class_name()
    {
        return static::class;
    }

    /**
     * @param int $timestamp
     *
     * @return int
     */
    public function created($timestamp = NULL)
    {
        return $this->_get_or_set_int(__FUNCTION__, $timestamp);
    }

    /**
     * @param string $timestamp
     *
     * @return string
     */
    public function updated($timestamp = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $timestamp);
    }

    /**
     * @param Status $status
     *
     * @return Status
     */
    public function status($status = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $status);
    }

    /**
     * @param string $id
     *
     * @return string
     */
    public function id($id = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $id);
    }

    /**
     * Base method to retrieve/set properties. Must be only used internally.
     *
     * @param string $prop
     * @param null   $value
     *
     * @return mixed
     */
    final protected function _get_or_set($prop, $value = NULL)
    {
        if (NULL !== $value) {
            $this->$prop = $value;
        }

        return $this->$prop;
    }

    /**
     * Base method to retrieve/set INT properties. Must be only used internally.
     *
     * @param string   $prop
     * @param null|int $value
     *
     * @return int
     */
    final protected function _get_or_set_int($prop, $value = NULL)
    {
        if (NULL !== $value) {
            $this->$prop = (int)$value;
        }

        return (int)$this->$prop;
    }

    /**
     * Base method to retrieve/set BOOL properties. Must be only used internally.
     *
     * @param bool      $prop
     * @param null|bool $value
     *
     * @return int
     */
    final protected function _get_or_set_bool($prop, $value = NULL)
    {
        if (NULL !== $value) {
            $this->$prop = (bool)$value;
        }

        return (bool)$this->$prop;
    }

    /**
     * @param $prop_name
     */
    final public function _nullify_prop($prop_name)
    {
        if (method_exists($this, $prop_name)) {
            $this->$prop_name = NULL;
        }
    }
}