import styles from "./sidebar.module.scss";
import SideBarIcon, { SideBarIconProps } from "./SidebarItem/sidebaritem";
import { useEffect, useState } from "react";
import { AiFillGithub, AiFillLinkedin, AiTwotoneMail } from "react-icons/ai";
import { MdHomeFilled, MdPerson, MdOutlineCode, MdScience } from "react-icons/md";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { usePathname } from "next/navigation";

export type SideBarProps = {
  isMobile?: boolean
}

export default function SideBar({ isMobile }: SideBarProps) {
  console.log(`Got Mobile: ${isMobile}`);
  const barSize = { base: 60, expanded: 200 };
  const btnOffset = { base: 70, minimized: 10 };

  const [width, setWidth] = useState(0);
  const [btnLeft, setBtnLeft] = useState(btnOffset.minimized);
  const [active, setActive] = useState(false);
  const [mouseInBar, setMouseInBar] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setTimeout(() => {
      if (!isMobile) { console.log(`Calling cause ${isMobile}`); toggleBarActive() } ;
    }, 4000);
  }, [isMobile]);

  const items: Array<SideBarIconProps> = [
    { name: "Home", icon: MdHomeFilled, redirectUrl: "/" },
    { name: "About", icon: MdPerson, redirectUrl: "/about" },
    { name: "Projects", icon: MdOutlineCode, redirectUrl: "/projects" },
    { name: "Demos", icon: MdScience, redirectUrl: "/demos"}
  ];

  const lowerItems: Array<SideBarIconProps> = [
    {
      name: "Email Me",
      icon: AiTwotoneMail,
      redirectUrl: "mailto:kanwarpal.brar@outlook.com",
    },
    {
      name: "Github",
      icon: AiFillGithub,
      redirectUrl: "https://www.github.com/kanwarpal-brar",
    },
    {
      name: "LinkedIn",
      icon: AiFillLinkedin,
      redirectUrl: "https://www.linkedin.com/in/kanwarpal-brar/",
    },
  ];

  const sidebarIcons = items.map((item) => {
    return (
      <SideBarIcon
        key={item.name}
        {...item}
        active={pathname === item.redirectUrl ? true : false}
        clickCallback={isMobile ? () => { toggleBarActive() } : undefined}
      />
    );
  });

  const sideBarLowerIcons = lowerItems.map((item) => {
    return <SideBarIcon key={item.name} {...item} newTab={true} clickCallback={isMobile ? () => { toggleBarActive() } : undefined}/>;
  });

  function expandBar() {
    setMouseInBar(true);
    if (active && !isMobile) {
      setWidth(barSize.expanded);
    }
  }

  function shrinkBar() {
    setMouseInBar(false);
    if (active && !isMobile) {
      setWidth(barSize.base);
    }
  }

  function toggleBarActive() {
    setWidth(active ? 0 : barSize.base);
    setBtnLeft(active || isMobile ? btnOffset.minimized : btnOffset.base);
    setActive(!active);
  }

  return (
    <>
      <div
        className={styles.sidebar_container}
        style={isMobile ? {} : { width: `${active ? barSize.base : 0}px` }}
      >
        <div
          className={styles.sidebar}
          style={{ width: `${width}px` }}
          onMouseEnter={expandBar}
          onMouseLeave={shrinkBar}
        >
          {sidebarIcons}
          <div className={styles.sidebar_lower_icons}>{sideBarLowerIcons}</div>
        </div>
      </div>
      <button
        className={
          width == barSize.expanded
            ? styles.sidebar_button_active
            : styles.sidebar_button
        }
        onClick={toggleBarActive}
        style={{ left: btnLeft }}
      >
        {active ? <BsChevronLeft /> : <BsChevronRight />}
      </button>
    </>
  );
}
