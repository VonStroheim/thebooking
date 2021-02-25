// @ts-ignore
import styles from './CalendarDayItem.css';

export interface CalendarDayItemProps {
    color?: string,
    label?: string
}

export default function CalendarDayItem(props: CalendarDayItemProps) {
    return (
        <div className={styles.item}>
            {props.color && (
                <span className={styles.dot} style={{backgroundColor: props.color}}/>
            )}
            {props.label && (
                <span className={styles.label}>{props.label}</span>
            )}

        </div>
    );
}
