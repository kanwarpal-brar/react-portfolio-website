import styles from "./sidebar.module.scss";
import SideBarIcon, { SideBarIconProps } from "./SidebarItem/sidebaritem";
import { useEffect, useState } from "react";
import { AiFillGithub, AiFillLinkedin, AiTwotoneMail } from "react-icons/ai";
import { MdHomeFilled, MdPerson, MdOutlineCode } from "react-icons/md";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { usePathname } from "next/navigation";

export default function SideBar() {
  const barSize = { base: 60, expanded: 200 };
  const btnOffset = { base: 70, minimized: 10 };

  const [width, setWidth] = useState(0);
  const [btnLeft, setBtnLeft] = useState(btnOffset.minimized);
  const [active, setActive] = useState(false);
  const [mouseInBar, setMouseInBar] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setTimeout(() => {
      toggleBarActive();
    }, 4000);
  }, []);

  const items: Array<SideBarIconProps> = [
    { name: "Home", icon: MdHomeFilled, redirectUrl: "/" },
    { name: "About", icon: MdPerson, redirectUrl: "/about" },
    { name: "Projects", icon: MdOutlineCode, redirectUrl: "/projects" },
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
      />
    );
  });

  const sideBarLowerIcons = lowerItems.map((item) => {
    return <SideBarIcon key={item.name} {...item} newTab={true} />;
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
      setWidth(barSize.base);
    }
  }

  function toggleBarActive() {
    setWidth(active ? 0 : barSize.base);
    setBtnLeft(active ? btnOffset.minimized : btnOffset.base);
    setActive(!active);
  }

  return (
    <>
      <div
        className={styles.sidebar_container}
        style={{ width: `${active ? barSize.base : 0}px` }}
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
