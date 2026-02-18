import { Wheel } from '../entities/wheel/Wheel'
import styles from './Home.module.css'
import logo from '../shared/assets/images/logo.png'
import bg from '../shared/assets/images/bg.jpg'
export function Home () {
  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <img src={logo} alt='Logo' />
        </header>
        <div className={styles.Btnwrapper}>
          <div>
            <button className={styles.buttonLogin}>LOGIN</button>
          </div>
          <div>
            <button className={styles.buttonJoin}>JOIN</button>
          </div>
        </div>
      </div>
      <Wheel />
    </div>
  )
}
