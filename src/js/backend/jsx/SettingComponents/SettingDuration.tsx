import {Dropdown} from 'primereact/dropdown';
import globals from '../../../globals'

import React from "react";
import {DurationObject} from "../../../typedefs";

declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

export interface SettingDurationProps {
    settingId: string,
    value: number | null,
    disabled?: boolean,
    showDays?: boolean,
    showHours?: boolean,
    showMinutes?: boolean,

    onChange(value: { [key: string]: any }): any
}

export default class SettingDuration extends React.Component<SettingDurationProps, DurationObject> {
    constructor(props: SettingDurationProps) {

        super(props);

        this.state = globals.secondsToDurationObj(props.value || 0)
    }

    handleChange = () => {
        this.props.onChange({
            [this.props.settingId]: globals.durationObjToSeconds(this.state)
        })
    }

    daysOptions = () => {
        const days: any[] = []
        for (let x = 0; x < 11; x++) {
            days.push({
                label: x,
                value: x
            })
        }
        return days;
    }

    minutesOptions = () => {
        const minutes: any[] = []
        for (let x = 0; x < 60; x++) {
            minutes.push({
                label: x,
                value: x
            })
        }
        return minutes;
    }

    hoursOptions = () => {
        const hours: any[] = []
        for (let x = 0; x < 24; x++) {
            hours.push({
                label: x,
                value: x
            })
        }
        return hours;
    }

    render() {
        return (
            <div className="p-formgroup-inline">
                {this.props.showDays && (
                    <div className="p-field">
                        <label>{__('Days', 'thebooking')}</label>
                        <Dropdown disabled={this.props.disabled} options={this.daysOptions()} value={this.state.days}
                                  onChange={
                                      (e: any) => {
                                          this.setState({days: e.value}, this.handleChange)
                                      }
                                  }
                                  valueTemplate={(x) => {
                                      return x.label
                                  }}
                        />
                    </div>
                )}
                {this.props.showHours && (
                    <div className="p-field">
                        <label>{__('Hours', 'thebooking')}</label>
                        <Dropdown
                            disabled={this.props.disabled} options={this.hoursOptions()} value={this.state.hours}
                            onChange={
                                (e: any) => {
                                    this.setState({hours: e.value}, this.handleChange)
                                }
                            }
                            valueTemplate={(x) => {
                                return x.label
                            }}
                        />
                    </div>
                )}
                {this.props.showMinutes && (
                    <div className="p-field">
                        <label>{__('Minutes', 'thebooking')}</label>
                        <Dropdown
                            disabled={this.props.disabled} options={this.minutesOptions()} value={this.state.minutes}
                            onChange={
                                (e: any) => {
                                    this.setState({minutes: e.value}, this.handleChange)
                                }
                            }
                            valueTemplate={(x) => {
                                return x.label
                            }}
                        />
                    </div>
                )}
            </div>

        );
    }
}