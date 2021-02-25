import {Dropdown} from 'primereact/dropdown';

import React from "react";

export interface SettingSelectProps {
    settingId: string,
    value: string | null,
    options: any[],
    disabled?: boolean,

    onChange(value: { [key: string]: any }): any
}

export default class SettingSelect extends React.Component<SettingSelectProps> {
    constructor(props: SettingSelectProps) {

        super(props);
    }

    handleChange = (event: any) => {
        this.props.onChange({
            [this.props.settingId]: event.value
        })
    }

    render() {
        return (
            <div>
                <Dropdown disabled={this.props.disabled} options={this.props.options} value={this.props.value} onChange={this.handleChange}/>
            </div>

        );
    }
}