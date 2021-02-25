// @ts-ignore
import styles from "./SettingNotice.css";
import {Message} from 'primereact/message';
import React from "react";

export interface SettingNoticeProps {
    type: string
}

export default class SettingNotice extends React.Component<SettingNoticeProps> {

    render() {
        let severity = 'info';
        if (this.props.type === 'warning') {
            severity = 'warn';
        }
        return (
            <div className={styles.settingNotice}>
                <Message severity={severity} text={this.props.children as any}/>
            </div>
        );
    }
}