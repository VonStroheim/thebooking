// @ts-ignore
import styles from "./SettingTextInput.css";
import {InputNumber} from 'primereact/inputnumber';
import React from "react";

export interface IProps {
    settingId: string,
    value: number,
    placeholder?: string,
    disabled?: boolean,
    showButtons?: boolean,
    label?: string,
    min?: number,
    max?: number,
    step?: number,
    currency?: string,

    onChange(value: { [key: string]: any }): any
}

class SettingNumberInput extends React.Component<IProps> {

    constructor(props: IProps) {

        super(props);
    }

    handleChange = (event: any) => {
        this.props.onChange({
            [this.props.settingId]: event.target.value
        })
    }

    render() {

        return (
            <div className={styles.settingNumberInput} id={'settingID_' + this.props.settingId}>
                {this.props.label && (
                    <label>{this.props.label}</label>
                )}
                <InputNumber
                    disabled={this.props.disabled}
                    value={this.props.value || 0}
                    incrementButtonClassName="p-button-secondary"
                    decrementButtonClassName="p-button-secondary"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus"
                    onValueChange={this.handleChange}
                    placeholder={this.props.placeholder}
                    min={this.props.min}
                    max={this.props.max}
                    step={this.props.step}
                    showButtons={this.props.showButtons}
                    buttonLayout={'horizontal'}
                    currency={this.props.currency}
                    mode={this.props.currency ? 'currency' : 'decimal'}
                />
            </div>
        );
    }

}

export default SettingNumberInput;