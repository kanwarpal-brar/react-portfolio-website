import styles from './sidebar.module.scss'
import SideBarIcon, { SideBarIconProps } from './SidebarItem/sidebaritem';
import { useState } from 'react';
import { AiFillHome, AiFillGithub, AiFillLinkedin } from 'react-icons/ai'
import { BsChevronCompactRight, BsFillPersonFill } from 'react-icons/bs';
import { usePathname } from 'next/navigation';


export default function SideBar() {
    // 
    const barSize = {base: 68, expanded: 200};
    const btnOffset = {base: 78, minimized: 10}
    const barMinimizeDelay = 0.2;  // sec the bar waits for mouse re-entry before minimize

    const [width, setWidth] = useState(barSize.base);
    const [btnLeft, setBtnLeft] = useState(btnOffset.base);
    const [active, setActive] = useState(true)
    const [mouseInBar, setMouseInBar] = useState(false);
    const pathname = usePathname()

    const items: Array<SideBarIconProps> = [
        {name: 'Home', icon: AiFillHome, redirectUrl: '/'},
        {name: 'About', icon: BsFillPersonFill,redirectUrl: '/about'},
    ];

    const lowerItems: Array<SideBarIconProps> = [
        {name: 'Github', icon: AiFillGithub, redirectUrl: 'https://github.com/kanwarpal-brar'},
        {name: 'LinkedIn', icon: AiFillLinkedin, redirectUrl: 'https://www.linkedin.com/in/kanwarpal-brar/' }
    ];

    const sidebarIcons = items.map(item => {
        return <SideBarIcon key={item.name} {...item } active={pathname === item.redirectUrl ? true : false} />
    });

    const sideBarLowerIcons = lowerItems.map(item => {
        return <SideBarIcon key={item.name} {...item} newTab={true}/>
    });

    function expandBar() {
        setMouseInBar(true);
        if (active) {
            setWidth(barSize.expanded);
        }
    }

    function shrinkBar() {
        setMouseInBar(false);
        if (active) {
            // setTimeout(() => { if (active && !mouseInBar) { setWidth(barSize.base) }}, barMinimizeDelay);
            setWidth(barSize.base);
        }
    }

    function toggleBarActive() {
        console.log('clicked');
        setWidth(active ? 0 : barSize.base);
        setBtnLeft(active ? btnOffset.minimized : btnOffset.base);
        setActive(!active);
    }

    return(
        <>
            <div className={styles.sidebar} style={{width: `${width}px`}} onMouseEnter={expandBar} onMouseLeave={shrinkBar}>
                {sidebarIcons}
                <div className={styles.sidebar_lower_icons}>
                    {sideBarLowerIcons}
                </div>
            </div>
            <button className={styles.sidebar_button} onClick={toggleBarActive} style={{left: btnLeft}}>
                <BsChevronCompactRight />
            </button>
        </>
    );
}

