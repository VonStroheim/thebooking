// @ts-ignore
import styles from "./SideMenu.css";
import React from 'react';
import {TabMenu} from 'primereact/tabmenu';

export interface SideMenuProps {
    items: SideMenuItem[],
}

interface SideMenuState {
    items: SideMenuItem[],
}

export interface SideMenuItem {
    icon?: string,
    label: string,
    ref: string,

    command?(event: any): any
}

export default class SideMenu extends React.Component<SideMenuProps, SideMenuState> {

    constructor(props: SideMenuProps) {

        super(props);

        this.state = {
            items: props.items ? this.mapPrime(props.items) : []
        }
    }

    getActiveItem = () => {
        const currentHash = window.location.hash.substr(1);
        const index = this.state.items.findIndex(item => item.ref === currentHash);
        return this.state.items[index];
    }

    mapPrime = (items: SideMenuItem[]) => {
        return items.map(item => {
            return {
                label  : item.label,
                ref    : item.ref,
                icon   : item.icon,
                command: (event: any) => {
                    window.location.hash = item.ref;
                }
            }
        })
    }

    render() {
        return (
            this.state.items.length > 0 && (
                <TabMenu model={this.state.items} className={styles.sideMenu} activeItem={this.getActiveItem()}/>
            )
        );
    }
}