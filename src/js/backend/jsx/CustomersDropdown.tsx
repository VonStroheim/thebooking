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
    inDialog?: boolean,

    onChange(e: any): any
}

interface CustomersDropdownState {
    mounted: boolean
}

export default class CustomersDropdown extends React.Component<CustomersDropdownProps, CustomersDropdownState> {
    private readonly container: React.RefObject<any>;

    constructor(props: CustomersDropdownProps) {
        super(props);

        this.container = React.createRef();

        this.state = {
            mounted: false
        }
    }

    itemTemplate = (option: CustomerBackendRecord) => {
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

    componentDidMount() {
        this.setState({mounted: true});
    }

    render() {
        return (
            <div ref={this.container} style={{position: "relative"}} key={'customersDropdown'}>
                {this.state.mounted && (
                    <Dropdown
                        options={Object.values(this.props.customers)}
                        value={this.props.selected}
                        optionValue={'id'}
                        optionLabel={'name'}
                        filter
                        appendTo={this.props.inDialog ? this.container.current : null}
                        valueTemplate={this.itemTemplate}
                        itemTemplate={this.itemTemplate}
                        onChange={this.props.onChange}
                        panelClassName={this.props.inDialog ? styles.panelFix : ''}
                    />
                )}
            </div>
        )

    }
}