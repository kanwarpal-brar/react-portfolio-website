import { IconType } from 'react-icons/lib';
import styles from './sidebaritem.module.scss'
import Link from 'next/link';

export type SideBarIconProps = {
    name: string;
    icon: any;
    redirectUrl: string;
    active?: boolean;
    newTab?: boolean;
}

export default function SideBarIcon({name, icon, redirectUrl, active, newTab}: SideBarIconProps) {
    const Icon = icon;
    return (
        <Link href={redirectUrl} className={active ? styles.sidebar_item_active : styles.sidebar_item} target={newTab ? '_blank' : undefined}>
            <Icon className={styles.sidebar_item_icon}/>
            <span className={styles.sidebar_item_text}>{name}</span>
        </Link>
    );
}