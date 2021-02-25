// @ts-ignore
import styles from "./SettingTextInput.css";
import {InputText} from 'primereact/inputtext';
import React from "react";

export interface SettingTextInputProps {
    settingId: string,
    value: string,
    placeholder?: string,
    disabled?: boolean,
    label?: string

    onChange(value: { [key: string]: any }): any
}

class SettingTextInput extends React.Component<SettingTextInputProps> {

    constructor(props: SettingTextInputProps) {

        super(props);
    }

    handleChange = (event: any) => {
        this.props.onChange({
            [this.props.settingId]: event.target.value
        })
    }

    render() {

        return (
            <div className={styles.settingTextInput} id={'settingID_' + this.props.settingId}>
                {this.props.label && (
                    <label>{this.props.label}</label>
                )}
                <InputText disabled={this.props.disabled} value={this.props.value} onChange={this.handleChange} placeholder={this.props.placeholder}/>
            </div>
        );
    }

}

export default SettingTextInput;