import {Dropdown} from 'primereact/dropdown';
import React from "react";
import {CustomerBackendRecord, tbkCommonB} from "../../typedefs";

// @ts-ignore
import styles from './CustomersDropdown.css';

declare const tbkCommon: tbkCommonB;

export interface CustomersDropdownProps {
    customers: {
        [key: number]: CustomerBackendRecord
    },
    selected: number,

    onChange(e: any): any
}

export default function CustomersDropdown(props: CustomersDropdownProps) {

    const itemTemplate = (option: CustomerBackendRecord) => {
        if (option === null) return;
        const users = tbkCommon.users.filter(user => {
            return user.ID === option.wpUserId;
        });
        const avatar = typeof users[0] !== 'undefined' ? users[0].avatar : tbkCommon.pluginUrl + 'Admin/Images/user-placeholder.png';
        return (
            <div className={styles.userBadge}>
                <img src={avatar}
                     onError={(e: any) => e.target.src = tbkCommon.pluginUrl + 'Admin/Images/user-placeholder.png'
                     }/>
                <div className={styles.userBadgeBody}>
                    <div>
                        {option.name}
                    </div>
                    <div className={styles.email}>
                        {option.email}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Dropdown
            options={Object.values(props.customers)}
            value={props.selected}
            optionValue={'id'}
            optionLabel={'name'}
            filter
            valueTemplate={itemTemplate}
            itemTemplate={itemTemplate}
            onChange={props.onChange}
        />
    )
}