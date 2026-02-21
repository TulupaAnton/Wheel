import { useState } from 'react'
import { Wheel } from '../entities/wheel/Wheel'
import { WinModal } from '../shared/ui/Modal/Modal'
import styles from './Home.module.css'
import logo from '../shared/assets/images/logo.png'
import king from '../shared/assets/images/King.png'
import queen from '../shared/assets/images/Quin.png'
import ace from '../shared/assets/images/Ace.png'
import chip from '../shared/assets/images/Chip.png'
import chip2 from '../shared/assets/images/Chip2.png'
import Light1 from '../shared/assets/images/Lights/Light1.svg'
import Light2 from '../shared/assets/images/Lights/Light2.svg'
import Light3 from '../shared/assets/images/Lights/Light3.svg'
import Light4 from '../shared/assets/images/Lights/Light4.svg'
import Light5 from '../shared/assets/images/Lights/Light5.svg'
import Light6 from '../shared/assets/images/Lights/Light6.svg'
import Light7 from '../shared/assets/images/Lights/Light7.svg'
import Light8 from '../shared/assets/images/Lights/Light8.svg'
import LightTop from '../shared/assets/images/Lights/LightTop.svg'
import LightTop2 from '../shared/assets/images/Lights/LightTop2.svg'

export function Home () {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [winValue, setWinValue] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSpinComplete = prize => {
    setWinValue(prize)
    setIsModalOpen(true)
  }

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className={styles.page}>
      <div className={styles.topLight} />

      <div className={styles.mainContent}>
        <div className={styles.wrapper}>
          <header className={styles.header}>
            <img src={logo} alt='Logo' />

            {/* BURGER (виден только на мобилке через CSS) */}
            <button
              className={styles.burgerBtn}
              type='button'
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(v => !v)}
            >
              <span />
              <span />
              <span />
            </button>

            {/* MOBILE MENU */}
            <nav
              className={`${styles.navMenu} ${
                isMenuOpen ? styles.navMenuActive : ''
              }`}
            >
              <button
                className={styles.menuClose}
                type='button'
                aria-label='Close menu'
                onClick={closeMenu}
              >
                ×
              </button>

              <div className={styles.mobileButtons}>
                <button
                  className={styles.buttonLogin}
                  type='button'
                  onClick={closeMenu}
                >
                  LOGIN
                </button>

                <button
                  className={styles.buttonJoin}
                  type='button'
                  onClick={closeMenu}
                >
                  JOIN
                </button>
              </div>
            </nav>
          </header>

          {/* DESKTOP BUTTONS (на мобилке скрываем через CSS) */}
          <div className={styles.Btnwrapper}>
            <button className={styles.buttonLogin} type='button'>
              LOGIN
            </button>
            <button className={styles.buttonJoin} type='button'>
              JOIN
            </button>
          </div>
        </div>

        <div className={styles.sectionP}>
          <h1 className={styles.title1}>
            Spin the wheel &{' '}
            <span className={styles.titleSpan}>Win free coins</span>
          </h1>
          <p className={styles.title2}>Play Roulette - 100% free</p>
        </div>
      </div>

      <Wheel onSpinComplete={handleSpinComplete} />

      <img src={king} className={`${styles.decor} ${styles.king}`} alt='' />
      <img src={queen} className={`${styles.decor} ${styles.queen}`} alt='' />
      <img src={chip} className={`${styles.decor} ${styles.chip}`} alt='' />
      <img src={ace} className={`${styles.decor} ${styles.ace}`} alt='' />
      <img src={chip2} className={`${styles.decor} ${styles.chip2}`} alt='' />

      {/* FIX: Light1 должен иметь styles.Light1, а не chip2 */}
      <img
        src={Light1}
        className={`${styles.decorLight} ${styles.Light1}`}
        alt=''
      />
      <img
        src={Light2}
        className={`${styles.decorLight} ${styles.Light2}`}
        alt=''
      />
      <img
        src={Light3}
        className={`${styles.decorLight} ${styles.Light3}`}
        alt=''
      />
      <img
        src={Light4}
        className={`${styles.decorLight} ${styles.Light4}`}
        alt=''
      />
      <img
        src={Light5}
        className={`${styles.decorLight} ${styles.Light5}`}
        alt=''
      />
      <img
        src={Light6}
        className={`${styles.decorLight} ${styles.Light6}`}
        alt=''
      />
      <img
        src={Light7}
        className={`${styles.decorLight} ${styles.Light7}`}
        alt=''
      />
      <img
        src={Light8}
        className={`${styles.decorLight} ${styles.Light8}`}
        alt=''
      />

      <img
        src={LightTop}
        className={`${styles.decorLight} ${styles.LightTop}`}
        alt=''
      />
      <img
        src={LightTop2}
        className={`${styles.decorLight} ${styles.LightTop2}`}
        alt=''
      />

      <WinModal
        isOpen={isModalOpen}
        prize={winValue}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
