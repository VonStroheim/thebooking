import {Dropdown} from 'primereact/dropdown';
import React from "react";
import {Location} from "../../typedefs";

// @ts-ignore
import styles from './CustomersDropdown.css';

export interface LocationsDropdownProps {
    locations: {
        [key: string]: Location
    },
    selected: string,

    onChange(e: any): any
}

export default function LocationsDropdown(props: LocationsDropdownProps) {

    const itemTemplate = (option: Location) => {
        if (option === null) return;
        return (
            <div className={styles.userBadge}>
                <i className={'pi pi-map-marker'}/>
                <div className={styles.userBadgeBody}>
                    <div>
                        {option.l_name}
                    </div>
                    <div className={styles.email}>
                        {option.address}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Dropdown
            options={Object.values(props.locations)}
            value={props.selected}
            optionValue={'uid'}
            optionLabel={'l_name'}
            filter
            valueTemplate={itemTemplate}
            itemTemplate={itemTemplate}
            onChange={props.onChange}
        />
    )
}