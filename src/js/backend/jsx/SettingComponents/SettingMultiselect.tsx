import {MultiSelect} from 'primereact/multiselect';

import React from "react";

export interface SettingMultiselectProps {
    settingId: string,
    value: string | null,
    options: any[],
    disabled?: boolean,

    onChange(value: { [key: string]: any }): any
}

export default class SettingMultiselect extends React.Component<SettingMultiselectProps> {
    constructor(props: SettingMultiselectProps) {

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
                <MultiSelect disabled={this.props.disabled} options={this.props.options} value={this.props.value} onChange={this.handleChange} display="chip"/>
            </div>

        );
    }
}