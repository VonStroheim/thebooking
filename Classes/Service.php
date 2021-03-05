<?php

namespace TheBooking\Classes;

use VSHM_Framework\Strings;

defined('ABSPATH') || exit;

/**
 * Class Service
 *
 * @package TheBooking
 * @author  VonStroheim
 */
abstract class Service implements Service_Interface
{
    use \VSHM_Framework\Classes\Metadata;

    /**
     * @var string
     */
    protected $id = '';

    /**
     * @var string
     */
    protected $name = '';

    /**
     * @var string
     */
    protected $description = '';

    /**
     * Short description (no HTML)
     *
     * @var string
     */
    protected $short_description = '';

    /**
     * @var bool
     */
    protected $registered_only = FALSE;

    /**
     * HEX color
     *
     * @var string
     */
    protected $color = '';

    /**
     * WP_Post attachment
     *
     * @var int
     */
    protected $image;

    /**
     * Time slot duration in seconds.
     *
     * @var int
     */
    protected $duration;

    /**
     * State of this service
     *
     * @var boolean
     */
    protected $active = TRUE;

    public function __construct()
    {
    }

    /**
     * @param string $id
     *
     * @return string
     */
    public function id($id = NULL)
    {
        if (NULL !== $id) {
            $this->id = Strings::filter_input($id, Strings::FILTER_ID);
        }

        return $this->id;
    }

    /**
     * @param string $name
     *
     * @return string
     */
    public function name($name = NULL)
    {
        if (NULL !== $name) {
            $this->name = $name;
        }

        return Strings::unfilter_input($this->name);
    }

    /**
     * @param string $desc
     *
     * @return string
     */
    public function description($desc = NULL)
    {
        if (NULL !== $desc) {
            $this->description = $desc;
        }

        return Strings::unfilter_input($this->description);
    }

    /**
     * @param string $desc
     *
     * @return string
     */
    public function short_description($desc = NULL)
    {
        if (NULL !== $desc) {
            $this->short_description = Strings::filter_input($desc, Strings::FILTER_ALL_TAGS);
        }

        return Strings::unfilter_input($this->short_description);
    }

    /**
     * @param string $color
     *
     * @return string HEX color
     */
    public function color($color = NULL)
    {
        if (NULL !== $color) {
            $this->color = $color;
        }

        return $this->color;
    }

    /**
     * @param bool $bool
     *
     * @return bool
     */
    public function active($bool = NULL)
    {
        if (NULL !== $bool) {
            $this->active = (bool)$bool;
        }

        return $this->active;
    }

    /**
     * @param bool $bool
     *
     * @return bool
     */
    public function registered_only($bool = NULL)
    {
        if (NULL !== $bool) {
            $this->registered_only = (bool)$bool;
        }

        return $this->registered_only;
    }

    /**
     * @param int  $id
     * @param bool $nullify
     *
     * @return int
     */
    public function image($id = NULL, $nullify = FALSE)
    {
        if (NULL !== $id) {
            $this->image = (int)$id;
        }
        if (NULL === $id && $nullify) {
            $this->image = NULL;
        }

        return $this->image;
    }

    public function duration($seconds = NULL)
    {
        if (NULL !== $seconds) {
            $this->duration = (int)$seconds;
        }

        return $this->duration;
    }

    /**
     * @return array
     */
    public function as_array()
    {
        $reservationFormMeta = [
            'elements' => []
        ];
        $filteredMeta        = [];

        foreach ($this->metadata() as $key => $metadatum) {
            if ($key === 'formFieldsOrder') {
                $reservationFormMeta['order'] = $metadatum;
            } else if ($key === 'formFieldsRequired') {
                $reservationFormMeta['required'] = $metadatum;

            } elseif ($key === 'formFieldsConditions') {
                $reservationFormMeta['conditions'] = $metadatum;

            } elseif ($metadatum instanceof ValueTypes\FormField) {
                $reservationFormMeta['elements'][ $key ] = $metadatum->getValue();

            } else {
                $filteredMeta[ $key ] = $metadatum;
            }
        }
        $filteredMeta['reservationForm'] = $reservationFormMeta;

        if ($this->image) {
            $imageUrl = wp_get_attachment_image_src($this->image)[0];
        } else {
            $imageUrl = NULL;
        }

        return [
            'uid'              => $this->id,
            'color'            => $this->color,
            'duration'         => $this->duration,
            'active'           => $this->active,
            'name'             => $this->name(),
            'description'      => $this->description(),
            'shortDescription' => $this->short_description(),
            'registeredOnly'   => $this->registered_only,
            'meta'             => $filteredMeta,
            'image'            => $imageUrl
        ];
    }
}