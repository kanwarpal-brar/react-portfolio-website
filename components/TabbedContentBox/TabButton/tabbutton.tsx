import styles from "./tabbutton.module.scss"


export type TabButtonProps = {
    name: string;
    active: boolean;
    activateCallback: () => void;
}

export default function TabButton({ name, active, activateCallback }: TabButtonProps) {
    return (
        <button className={active ? styles.tab_button_active : styles.tab_button} onClick={activateCallback}>
            {name}
        </button>
    )
}
