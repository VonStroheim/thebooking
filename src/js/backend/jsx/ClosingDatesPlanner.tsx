// @ts-ignore
import styles from './WorkingHoursPlanner.css';
import globals from '../../globals';
import React from "react";
import {tbkCommonB} from "../../typedefs";
import {RRule, RRuleSet, rrulestr} from 'rrule';
// @ts-ignore
import Calendar from 'rc-year-calendar';

declare const tbkCommon: tbkCommonB;
declare const _: any;

export interface WProps {
    settingId: string,
    exDates?: any

    onChange(settings: { [key: string]: any }): any
}

interface WState {
    exDates: any
}


export default class ClosingDatesPlanner extends React.PureComponent<WProps, WState> {


    constructor(props: WProps) {

        super(props);

        // @ts-ignore
        window.RRULE = RRule;

        const rrules = Object.values(tbkCommon.availability).filter((rule: any) => {
            return rule.uid === 'availabilityGlobal_1';
        })

        let exDates: Date[] = [];

        rrules.forEach((rule: any) => {
            const RRULE: RRuleSet = rrulestr(rule.rrule, {forceset: true}) as RRuleSet;
            exDates = RRULE.exdates()
        })

        this.state = {
            exDates: exDates.map(date => {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
            })
        }
    }

    handleChange = () => {

        const rrules = Object.values(tbkCommon.availability).filter((rule: any) => {
            return rule.uid === 'availabilityGlobal_1';
        })

        const returningValues: { rrule: string, duration: number }[] = [];

        rrules.forEach((rule: any) => {
            const RRULE: RRuleSet = rrulestr(rule.rrule, {forceset: true}) as RRuleSet;
            const NEW_RULE = new RRuleSet();

            RRULE.rrules().forEach(innerRrule => {
                NEW_RULE.rrule(new RRule({
                    freq     : innerRrule.options.freq,
                    byweekday: innerRrule.options.byweekday,
                    dtstart  : innerRrule.options.dtstart,
                }));

                this.state.exDates.forEach((date: Date) => {
                    NEW_RULE.exdate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), innerRrule.options.dtstart.getHours(), innerRrule.options.dtstart.getMinutes()));
                })
                returningValues.push({
                    rrule   : NEW_RULE.toString(),
                    duration: rule.duration
                })

            })

        })

        this.props.onChange(
            {
                [this.props.settingId]: returningValues
            }
        );
    }

    render() {

        return (
            <div className={styles.workingHoursPlanner}>
                <div className={styles.exDates} style={{wordBreak: "normal", height: '700px', lineHeight: 'normal', display: 'flex'}}>
                    <Calendar
                        style={'border'}
                        language={tbkCommon.i18n.locale.substring(0, 1)}
                        onDayClick={(e: any) => {
                            if (globals.isDateInArray(this.state.exDates, e.date)) {
                                this.setState({
                                    exDates: this.state.exDates.filter((date: Date) => {
                                        return date.getTime() !== e.date.getTime()
                                    })
                                }, this.handleChange)
                            } else {
                                this.setState({exDates: [...this.state.exDates, e.date]}, this.handleChange)
                            }

                        }}
                        onRangeSelected={(e: any) => {
                            this.setState({exDates: globals.getDaysArray(e.startDate, e.endDate)}, this.handleChange)
                        }}
                        dataSource={this.getMappedExdates()}/>
                </div>
            </div>
        )
    }

    getMappedExdates = () => {
        const mapped: any = [];
        this.state.exDates.forEach((date: Date) => {
            mapped.push({
                startDate: date,
                endDate  : date,
                color    : '#B92F37'
            })
        })
        return mapped;
    }

}