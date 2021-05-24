// @ts-ignore
import styles from './WorkingHoursPlanner.css';
import globals from '../../globals';
import React from "react";
import {tbkCommonB} from "../../typedefs";
import {RRule, RRuleSet, rrulestr} from 'rrule';
import {Dropdown} from "primereact/dropdown";
import {Button} from "primereact/button";
import {setMinutes, startOfToday} from "date-fns";

declare const tbkCommon: tbkCommonB;
declare const _: any;
declare const lodash: any;
declare const noUiSlider: any;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface WProps {
    rangeMin: number,
    rangeMax: number,
    settingId: string,
    exDates?: any

    onChange(settings: { [key: string]: any }): any
}

interface WState {
    preferences: {
        rangeStart: number,
        rangeEnd: number
    },
    slidersDefaults: SliderSettings[],
    totalTimeLabels: string[],
    exDates: any
}

interface Format {
    to(value: number): string,

    from(value: number): number
}

const format: Format = {
    to  : function (value: number) {
        return new Date(1000 * 60 * Math.round(value)).toISOString().substr(11, 5);
    },
    from: function (value: number) {
        return Math.round(Number(value));
    }
};

const filterPips = function (value: number) {
    if (value % 60 === 0) {
        return 2;
    }
    return value % 30 ? -1 : 0;
};

interface SliderSettings {
    start: number[],
    tooltips: any[] | null,
    step: number,
    connect: boolean[] | boolean,
    behaviour: string,
    margin: number,
    range?: {
        min: number,
        max: number
    },
    pips?: {
        mode: string,
        density: number,
        format: Format,
        filter(value: number): any,
    }
}

const baseSliderSettings: SliderSettings = {
    start    : [540, 960],
    tooltips : [format, format],
    step     : 5,
    connect  : [false, true, false],
    behaviour: 'drag-tap',
    margin   : 5,
};

export default class WorkingHoursPlanner extends React.Component<WProps, WState> {
    private readonly id: string;
    private sliders: any[];
    private minPresets = [0, 60, 120, 180, 240, 300, 360, 420, 480];
    private maxPresets = [1080, 1140, 1200, 1260, 1320, 1380, 1440];

    constructor(props: WProps) {

        super(props);

        this.id = _.uniqueId("tbk-");
        this.sliders = [];

        // @ts-ignore
        window.RRULE = RRule;

        const sliderDefaults = Array.from({length: 7}, () => Object.assign({}, baseSliderSettings));

        const intervals: any = [];
        const rrules = Object.values(tbkCommon.availability).filter((rule: any) => {
            return rule.uid === props.settingId;
        })
        let exDates: Date[] = [];
        for (let weekNo = 0; weekNo <= 6; weekNo++) {
            rrules.forEach((rule: any) => {
                const RRULE: RRuleSet = rrulestr(rule.rrule, {forceset: true}) as RRuleSet;
                RRULE.rrules().forEach(innerRrule => {
                    if (Array.isArray(innerRrule.options.byweekday) && innerRrule.options.byweekday.includes(weekNo)) {
                        if (typeof intervals[weekNo] === 'undefined') {
                            intervals[weekNo] = [];
                        }
                        let dtStart = innerRrule.options.dtstart;
                        const start = dtStart.getHours() * 60 + dtStart.getMinutes();
                        intervals[weekNo].push(start);
                        intervals[weekNo].push(start + rule.duration);
                    }
                })
                exDates = RRULE.exdates()
            })
        }

        sliderDefaults[6].pips = {
            mode   : 'steps',
            density: 1,
            filter : filterPips,
            format : format
        }

        let fRangeMin = 1440;
        let fRangeMax = 0;

        sliderDefaults.map((def, i) => {
            def.start = intervals[i] || [0];
            if (def.start.length > 1) {
                fRangeMin = Math.min(fRangeMin, Math.min(...def.start));
                fRangeMax = Math.max(fRangeMax, Math.max(...def.start));
            }
            def.connect = def.start.length > 1 ? Array(def.start.length + 1).fill(false).map(function (value, index) {
                return !!(index % 2);
            }) : false;
            def.tooltips = def.start.length > 1 ? Array(def.start.length).fill(format) : null;
            return def;
        })

        // Getting closest "fixed" value
        fRangeMin = Math.max(...this.minPresets.filter(minutes => minutes <= fRangeMin));
        fRangeMax = Math.min(...this.maxPresets.filter(minutes => minutes >= fRangeMax));

        this.state = {
            slidersDefaults: sliderDefaults,
            preferences    : {
                rangeStart: props.rangeMin ? Math.min(props.rangeMin, fRangeMin) : fRangeMin,
                rangeEnd  : props.rangeMax ? Math.max(props.rangeMax, fRangeMax) : fRangeMax,
            },
            totalTimeLabels: Array(7).fill(''),
            exDates        : exDates.map(date => {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
            })
        }
    }

    inject = (sliders: HTMLCollectionOf<any>) => {
        this.sliders = [];
        for (let i = 0; i < sliders.length; i++) {
            if (typeof sliders[i].noUiSlider !== 'undefined') {
                sliders[i].noUiSlider.off();
                sliders[i].noUiSlider.destroy();
            }
            sliders[i].removeAttribute('disabled');

            noUiSlider.create(sliders[i], {
                ...this.state.slidersDefaults[i], ...{
                    range: {
                        min: this.state.preferences.rangeStart,
                        max: this.state.preferences.rangeEnd,
                    }
                }
            });
            sliders[i].noUiSlider.on('update', this.updateTotalTime);
            if (this.state.slidersDefaults[i].start.length === 1) {
                sliders[i].setAttribute('disabled', 'true');
            } else {
                this.mergeTooltips(sliders[i], 10, ' - ');
            }
            this.sliders[i] = sliders[i];
        }
    }

    handleChange = () => {
        const values = this.getValues();
        const rules: { [key: string]: any } = {};
        const now = new Date();
        values.forEach((value, i) => {
            // Monday is 0
            const chunks = lodash.chunk(value, 2);
            chunks.forEach((couple: any[]) => {
                const ID = couple[0] + '#' + couple[1];
                if (ID in rules) {
                    rules[ID].byweekday.push(i);
                } else {
                    rules[ID] = {
                        freq     : RRule.WEEKLY,
                        byweekday: [i],
                        dtstart  : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, couple[0]),
                        duration : couple[1] - couple[0]
                    };
                }
            })
        })
        const returningValues: { rrule: string, duration: number }[] = [];
        Object.values(rules).forEach(rule => {
            const ruleSet = new RRuleSet()
            ruleSet.rrule(new RRule({
                freq     : rule.freq,
                byweekday: rule.byweekday,
                dtstart  : rule.dtstart,
            }));
            this.state.exDates.forEach((date: Date) => {
                ruleSet.exdate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), rule.dtstart.getHours(), rule.dtstart.getMinutes()));
            })
            returningValues.push({
                rrule   : ruleSet.toString(),
                duration: rule.duration
            })
        })
        this.props.onChange(
            {
                [this.props.settingId]: returningValues
            }
        );
    }

    componentDidMount() {
        const sliders = document.getElementById(this.id).getElementsByClassName('slider');
        this.inject(sliders);
    }

    componentWillUnmount() {
        const sliders = document.getElementById(this.id).getElementsByClassName('slider');
        for (let i = 0; i < sliders.length; i++) {
            // @ts-ignore
            sliders[i].noUiSlider.off();
            // @ts-ignore
            sliders[i].noUiSlider.destroy();
        }
    }

    updateTotalTime = (values: any, handle: any, unencoded: number[], tap: any, positions: any, noUiSlider: any) => {

        let totalTime = 0;
        if (unencoded.length > 1) {
            const intervals: any[] = lodash.chunk(unencoded.map(function (value: number) {
                return Math.round(value)
            }), 2);

            intervals.forEach(interval => {
                totalTime += (interval[1] - interval[0]);
            });

        }

        const h = Math.trunc(totalTime / 60);
        const m = (totalTime % 60);

        const nodes = Array.from(noUiSlider.target.closest('ul').children);
        const thisIndex = nodes.indexOf(noUiSlider.target.closest('li'));
        const prevTotals = this.state.totalTimeLabels;
        prevTotals[thisIndex] = h + 'h' + m + 'm';
        this.setState({
            totalTimeLabels: prevTotals
        }, this.handleChange)
    }

    cutMarginsHandler = (value: number, margin: string) => {
        const startOrEnd = margin === 'start' ? 'rangeStart' : 'rangeEnd';
        this.setState({
            preferences: {
                ...this.state.preferences, ...{
                    [startOrEnd]: Number(value)
                }
            }
        }, this.cutMargins)
    }

    cutMargins = () => {
        for (let i = 0; i < this.sliders.length; i++) {
            // @ts-ignore
            this.sliders[i].noUiSlider.updateOptions({
                range: {
                    'min': this.state.preferences.rangeStart,
                    'max': this.state.preferences.rangeEnd,
                }
            }, true);
            // @ts-ignore
            this.sliders[i].noUiSlider.off();
            // @ts-ignore
            this.sliders[i].noUiSlider.on('update', this.updateTotalTime);
            if (this.state.slidersDefaults[i].tooltips) {
                this.mergeTooltips(this.sliders[i], 10, ' - ');
            }
        }
    }

    changeIntervals = (sliderIndex: number, event: string) => {
        const newSliderDefaults = Object.assign({}, this.state.slidersDefaults);
        const prevIntervals = Math.floor(newSliderDefaults[sliderIndex].start.length / 2);
        if ((prevIntervals === 4 && event === 'add') || (prevIntervals === 0 && event !== 'add')) return;
        const intervals = event === 'add' ? Math.min(prevIntervals + 1, 4) : Math.max(prevIntervals - 1, 0);
        const slider = this.sliders[sliderIndex];
        const prevTotalStrings = this.state.totalTimeLabels;
        const thisIndex = sliderIndex;


        if (Number(intervals) === 0) {
            slider.setAttribute('disabled', true);
            prevTotalStrings[thisIndex] = '0h0m';
            newSliderDefaults[thisIndex].start = [0];
            newSliderDefaults[thisIndex].tooltips = null;
            newSliderDefaults[thisIndex].connect = false;

        } else {
            slider.removeAttribute('disabled');

            /**
             * Equalizing spaces
             */
            const pF = 2;
            const L = this.state.preferences.rangeEnd - this.state.preferences.rangeStart
            const Y = L / (intervals * pF + intervals + 1)
            const X = pF * Y
            const startCoords = [];

            for (let i = 1; i <= intervals; i++) {
                startCoords.push(this.state.preferences.rangeStart + i * Y + (i - 1) * X)
                startCoords.push(this.state.preferences.rangeStart + i * (X + Y))
            }

            newSliderDefaults[thisIndex].start = startCoords;
            newSliderDefaults[thisIndex].tooltips = Array(intervals * 2).fill(format);
            newSliderDefaults[thisIndex].connect = Array(intervals * 2 + 1).fill(false).map(function (value, index) {
                return !!(index % 2);
            });
        }
        this.setState(
            {
                slidersDefaults: newSliderDefaults,
                totalTimeLabels: prevTotalStrings
            }, this.handleChange
        );

        slider.noUiSlider.off();
        slider.noUiSlider.destroy();
        noUiSlider.create(slider, {
            ...this.state.slidersDefaults[thisIndex], ...{
                range: {
                    min: this.state.preferences.rangeStart,
                    max: this.state.preferences.rangeEnd,
                }
            }
        });
        slider.noUiSlider.on('update', this.updateTotalTime);
        if (Number(intervals) !== 0) {
            this.mergeTooltips(slider, 10, ' - ');
        }
    }

    getValues = () => {
        const values = [];
        for (let i = 0; i < this.sliders.length; i++) {
            // @ts-ignore
            let reading = this.sliders[i].noUiSlider.get();
            if (Array.isArray(reading)) {
                values.push(reading.map(function (value, i) {
                    return Number(value);
                }));
            } else {
                values.push(false);
            }
        }
        return values;
    }

    /**
     * @param slider HtmlElement with an initialized slider
     * @param threshold Minimum proximity (in percentages) to merge tooltips
     * @param separator String joining tooltips
     */
    mergeTooltips = (slider: any, threshold: number, separator: string) => {

        const textIsRtl = getComputedStyle(slider).direction === 'rtl';
        const isRtl = slider.noUiSlider.options.direction === 'rtl';
        const isVertical = slider.noUiSlider.options.orientation === 'vertical';
        const tooltips = slider.noUiSlider.getTooltips();
        const origins = slider.noUiSlider.getOrigins();

        // Move tooltips into the origin element. The default stylesheet handles this.
        tooltips.forEach(function (tooltip: any, index: number) {
            if (tooltip) {
                origins[index].appendChild(tooltip);
            }
        });

        const _this = this;

        slider.noUiSlider.on('update', function (values: any[], handle: any, unencoded: number[], tap: any, positions: any[]) {

            const pools: any[][] = [[]];
            const poolPositions: number[][] = [[]];
            const poolValues: any[][] = [[]];
            let atPool = 0;

            // Assign the first tooltip to the first pool, if the tooltip is configured
            if (tooltips[0]) {
                pools[0][0] = 0;
                poolPositions[0][0] = positions[0];
                poolValues[0][0] = format.to(values[0]);
            }

            for (let i = 1; i < positions.length; i++) {
                if (!tooltips[i] || (positions[i] - positions[i - 1]) > threshold) {
                    atPool++;
                    pools[atPool] = [];
                    poolValues[atPool] = [];
                    poolPositions[atPool] = [];
                }

                if (tooltips[i]) {
                    pools[atPool].push(i);
                    poolValues[atPool].push(format.to(values[i]));
                    poolPositions[atPool].push(positions[i]);
                }
            }

            pools.forEach(function (pool, poolIndex) {
                const handlesInPool = pool.length;

                for (let j = 0; j < handlesInPool; j++) {
                    const handleNumber = pool[j];

                    if (j === handlesInPool - 1) {
                        let offset = 0;

                        poolPositions[poolIndex].forEach(function (value) {
                            offset += 1000 - 10 * value;
                        });

                        const direction = isVertical ? 'bottom' : 'right';
                        const last = isRtl ? 0 : handlesInPool - 1;
                        const lastOffset = 1000 - 10 * poolPositions[poolIndex][last];
                        offset = (textIsRtl && !isVertical ? 100 : 0) + (offset / handlesInPool) - lastOffset;

                        // Center this tooltip over the affected handles
                        tooltips[handleNumber].innerHTML = poolValues[poolIndex].join(separator);
                        tooltips[handleNumber].style.display = 'block';
                        tooltips[handleNumber].style[direction] = offset + '%';
                    } else {
                        // Hide this tooltip
                        tooltips[handleNumber].style.display = 'none';
                    }
                }
            });
        });
    }

    render() {

        const sliders = [];
        const _this = this;

        for (let i = 0; i < 7; i++) {
            const totalTimeString = globals.flatMap(sprintf(__('Total time: %s', 'thebooking'), '%1').split('%1'), function (part: string) {
                return [part, <span className={'total-time'}>{_this.state.totalTimeLabels[i]}</span>];
            });
            totalTimeString.pop();
            sliders.push(<li key={'slider_' + i}>
                <div className={'label'}>
                    {tbkCommon.weekDaysLabels[(i + 1) % 7]}
                    <span className={'total-time-wrapper'}>{totalTimeString}</span>
                </div>
                <div className={'slider'}/>
                <div className={'intervals'}>
                    <Button
                        className={'p-button-rounded p-button-text p-button-plain'}
                        icon={'pi pi-plus'}
                        tooltip={__('Add interval', 'thebooking')}
                        tooltipOptions={{
                            position: 'top'
                        }}
                        onClick={() => this.changeIntervals(i, 'add')}
                    />
                    <Button
                        className={'p-button-rounded p-button-text p-button-plain'}
                        icon={'pi pi-minus'}
                        tooltip={__('Remove interval', 'thebooking')}
                        tooltipOptions={{
                            position: 'top'
                        }}
                        onClick={() => this.changeIntervals(i, 'remove')}
                    />
                </div>
            </li>)
        }

        return (
            <div id={this.id} className={styles.workingHoursPlanner}>
                <div className={'p-grid p-formgrid p-fluid p-ai-center'}>
                    <div className={'p-col-12 p-lg-4'}>
                        <Dropdown
                            options={this.minPresets.map(minutes => {
                                return {
                                    value: minutes,
                                    label: sprintf(__('Showing from %s', 'thebooking'), globals.formatTime(setMinutes(startOfToday(), minutes)))
                                }
                            })}
                            value={this.state.preferences.rangeStart}
                            onChange={(e) => this.cutMarginsHandler(e.value, 'start')}
                        />
                    </div>
                    <div className={'p-col-12 p-lg-4'}>
                        <Dropdown
                            options={this.maxPresets.map(minutes => {
                                return {
                                    value: minutes,
                                    label: sprintf(__('to %s', 'thebooking'), globals.formatTime(setMinutes(startOfToday(), minutes)))
                                }
                            })}
                            value={this.state.preferences.rangeEnd}
                            onChange={(e) => this.cutMarginsHandler(e.value, 'end')}
                        />
                    </div>
                </div>
                <ul className={styles.sliders}>
                    {sliders}
                </ul>
            </div>
        )
    }
}