// @ts-ignore
import styles from './Nav.css';
import {AppBar} from '@material-ui/core';

export default function Nav(props: any) {
    return (
        <AppBar elevation={0} position={'relative'} color={'transparent'}>
            <div className={styles.nav}>
                {props.children}
            </div>
        </AppBar>
    );
}