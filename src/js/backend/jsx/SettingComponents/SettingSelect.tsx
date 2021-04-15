import {Dropdown} from 'primereact/dropdown';
//@ts-ignore
import styles from 'SettingSelect.css';

import React from "react";

export interface SettingSelectProps {
    settingId: string,
    value: string | null,
    options: any[],
    disabled?: boolean,
    showClear?: boolean,
    placeholder?: string

    onChange(value: { [key: string]: any }): any
}

export default class SettingSelect extends React.Component<SettingSelectProps> {
    constructor(props: SettingSelectProps) {

        super(props);
    }

    handleChange = (event: any) => {
        this.props.onChange({
            [this.props.settingId]: event.value || null
        })
    }

    valueTemplate = (option: any) => {
        if (!option) return <span>{this.props.placeholder}</span>;

        return this.itemTemplate(option)
    }

    itemTemplate = (option: any) => {
        return (
            <div className={'p-d-flex p-ai-center'}>
                {option.avatarColor && (
                    <div className={'p-mr-2 '} style={{
                        borderRadius   : '50%',
                        width          : '1.2rem',
                        height         : '1.2rem',
                        backgroundColor: option.avatarColor
                    }}>
                    </div>
                )}
                <div>
                    <div>{option.label}</div>
                    {option.description && (
                        <div style={{opacity: '0.7'}}>
                            {option.description}
                        </div>
                    )}
                </div>

            </div>
        )
    }

    render() {
        return (
            <div>
                <Dropdown
                    disabled={this.props.disabled}
                    options={this.props.options}
                    placeholder={this.props.placeholder}
                    value={this.props.value}
                    valueTemplate={this.valueTemplate}
                    itemTemplate={this.itemTemplate}
                    onChange={this.handleChange}
                    showClear={this.props.showClear}
                />
            </div>

        );
    }
}