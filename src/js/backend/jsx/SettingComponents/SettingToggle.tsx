// @ts-ignore
import styles from "./SettingToggle.css";
import React from "react";
import {InputSwitch} from 'primereact/inputswitch';

export interface SettingToggleProps {
    checked: boolean,
    settingId: string,
    disabled?: boolean

    onChange(value: { [key: string]: any }): any
}

class SettingToggle extends React.Component<SettingToggleProps> {

    constructor(props: SettingToggleProps) {

        super(props);
    }

    handleChange = (event: any) => {
        this.props.onChange({
            [this.props.settingId]: event.value
        })
    }

    render() {
        return (
            <div className={styles.settingToggle} id={'settingID_' + this.props.settingId}>
                <InputSwitch disabled={this.props.disabled} checked={this.props.checked} onChange={this.handleChange}/>
            </div>
        );
    }

}

export default SettingToggle;