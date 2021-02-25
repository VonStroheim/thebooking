<?php

namespace VSHM_Framework\Classes;

defined('ABSPATH') || exit;

/**
 * Trait Metadata
 *
 * Implements basic metadata functions
 *
 * @package VSHM_Framework\Classes
 * @author  VonStroheim
 */
trait Metadata
{
    /**
     * @var array
     */
    protected $metadata = [];

    /**
     * @param array $meta
     *
     * @return array
     */
    public function metadata(array $meta = NULL)
    {
        if (NULL !== $meta) {
            $this->metadata = $meta;
            if (property_exists(static::class, 'dirty')) {
                $this->dirty = TRUE;
            }
        }

        return $this->metadata;
    }

    /**
     * @param string $key
     *
     * @return mixed
     */
    public function getMeta($key)
    {
        if (isset($this->metadata[ $key ])) {
            return maybe_unserialize($this->metadata[ $key ]);
        }

        return NULL;
    }

    /**
     * @param string $key
     * @param mixed  $value
     */
    public function addMeta($key, $value)
    {
        $this->metadata[ $key ] = $value;
        if (property_exists(static::class, 'dirty')) {
            $this->dirty = TRUE;
        }
    }

    /**
     * @param $key
     *
     * @return $this
     */
    public function dropMeta($key)
    {
        unset($this->metadata[ $key ]);
        if (property_exists(static::class, 'dirty')) {
            $this->dirty = TRUE;
        }

        return $this;
    }

    /**
     * Useful to add a new array to a meta which is supposed to be a collection
     * of arrays.
     *
     * @param string $key
     * @param array  $value
     * @param null   $valueKey
     */
    public function addToMeta($key, array $value, $valueKey = NULL)
    {
        $meta = $this->getMeta($key);
        if (NULL !== $meta) {
            if (is_array($meta)) {
                if (NULL === $valueKey) {
                    $meta[] = $value;
                } else {
                    $meta[ $valueKey ] = $value;
                }
            } else {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    trigger_error('Trying to add an array to a non-array collection metadata.');
                }

                return;
            }
            $this->addMeta($key, $meta);
        } else {
            if (NULL === $valueKey) {
                $this->metadata[ $key ] = [$value];
            } else {
                $this->metadata[ $key ] = [$valueKey => $value];
            }
        }
        if (property_exists(static::class, 'dirty')) {
            $this->dirty = TRUE;
        }
    }
}