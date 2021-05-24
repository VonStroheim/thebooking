// @ts-ignore
import styles from './WorkingHoursPlanner.css';
import React from "react";
import {tbkCommonB} from "../../typedefs";
import {RRule, RRuleSet, rrulestr} from 'rrule';
import {Calendar as PCalendar} from 'primereact/calendar';
import {addYears, setMonth, subYears} from "date-fns";
import {Button} from "primereact/button";

declare const tbkCommon: tbkCommonB;
declare const _: any;

export interface WProps {
    settingId: string,
    value: []

    onChange(settings: { [key: string]: any }): any
}

interface WState {
    exDates: any,
    viewDate: Date
}


export default class ClosingDatesPlanner extends React.Component<WProps, WState> {

    constructor(props: WProps) {

        super(props);

        // @ts-ignore
        window.RRULE = RRule;

        let exDates: Date[] = [];

        props.value.forEach((rule: any) => {
            const RRULE: RRuleSet = rrulestr(rule.rrule, {forceset: true}) as RRuleSet;
            exDates = RRULE.exdates()
        })

        this.state = {
            exDates : exDates.map(date => {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
            }),
            viewDate: setMonth(new Date(), 0)
        }
    }

    handleChange = () => {

        const returningValues: { rrule: string, duration: number }[] = [];

        this.props.value.forEach((rule: any) => {
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
                <div className="p-d-flex p-ai-center p-jc-center">
                    <Button icon="pi pi-chevron-left" className="p-button-rounded p-button-text p-button-plain p-m-1"
                            onClick={() => this.setState({viewDate: subYears(this.state.viewDate, 1)})}/>
                    <div style={{padding: '1rem', fontWeight: 600, color: 'var(--primary-color)'}}>
                        {this.state.viewDate.getFullYear()}
                    </div>
                    <Button icon="pi pi-chevron-right" className="p-button-rounded p-button-text p-button-plain p-m-1"
                            onClick={() => this.setState({viewDate: addYears(this.state.viewDate, 1)})}/>
                </div>
                <div className={styles.exDates} key={this.state.viewDate.getFullYear()}>
                    <PCalendar inline value={this.state.exDates}
                               locale={tbkCommon.i18n.locale.substring(0, 2)}
                               selectionMode="multiple"
                               viewDate={this.state.viewDate}
                               onChange={(e: any) => {
                                   this.setState({exDates: e.value}, this.handleChange)
                               }}
                               numberOfMonths={12}
                    />
                </div>
            </div>
        )
    }
}