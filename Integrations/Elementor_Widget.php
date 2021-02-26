<?php

namespace TheBooking\Integrations;

use TheBooking\Classes\Service;

defined('ABSPATH') || exit;

/**
 * Class Elementor_Widget
 *
 * @package TheBooking\Integrations
 * @author  VonStroheim
 * @since   3.0.0
 */
class Elementor_Widget extends \Elementor\Widget_Base
{
    public function get_name()
    {
        return 'tbk_widget';
    }

    public function get_keywords()
    {
        return ['booking', 'thebooking', 'teambooking', 'reservations', 'calendar'];
    }

    public function get_title()
    {
        return __('TheBooking widget', 'the-booking');
    }

    public function get_icon()
    {
        return 'tbk-elementor-widget-icon';
    }

    protected function _register_controls()
    {

        $controls = apply_filters('tbk_elementor_widget_controls', [
            'restrictions_section' => [
                'data'     =>
                    [
                        'label' => __('Restrictions', 'the-booking'),
                        'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
                    ],
                'controls' =>
                    [
                        'restrict_services' =>
                            [
                                'label'       => __('Restrict services', 'the-booking'),
                                'label_block' => TRUE,
                                'type'        => \Elementor\Controls_Manager::SELECT2,
                                'multiple'    => TRUE,
                                'options'     => array_map(static function ($service) {
                                    return $service->name();
                                }, tbkg()->services->all()),
                                'default'     => [],
                            ],
                    ]
            ],
        ]);

        foreach ($controls as $section_id => $section_struct) {
            $this->start_controls_section($section_id, $section_struct['data']);

            foreach ($section_struct['controls'] as $control_id => $control_data) {
                $this->add_control($control_id, $control_data);
            }

            $this->end_controls_section();
        }
    }

    public function get_categories()
    {
        return ['general'];
    }

    /**
     * Shortcode building process
     */
    public function build_shortcode()
    {
        $attrs    = '';
        $settings = $this->get_settings_for_display();

        if ($settings['restrict_services']) {
            $attrs .= ' service="' . implode(',', $settings['restrict_services']) . '"';
        }

        return '[tbk-booking' . apply_filters('tbk_elementor_widget_calendar_shortcode_attrs', $attrs, $settings) . ']';
    }

    /**
     *
     */
    public function render_plain_content()
    {
        echo $this->build_shortcode();
    }

    /**
     *
     */
    protected function render()
    {
        $shortcode = do_shortcode(shortcode_unautop($this->build_shortcode()));
        ?>
        <div class="elementor-shortcode"><?php echo $shortcode; ?></div>
        <?php
    }
}